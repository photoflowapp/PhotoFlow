import { getSupabaseClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
}

interface RememberedDeviceUser {
  id: string;
  email: string;
  rememberedAt: number;
}

const REMEMBERED_DEVICE_USER_KEY = 'photoflow_device_remembered_user';
// Remember signed-in device for 90 days (refreshed on each launch/sign-in)
const REMEMBERED_DEVICE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export function saveRememberedDeviceUser(user: AuthUser): void {
  if (!user?.id) return;
  try {
    const payload: RememberedDeviceUser = {
      id: user.id,
      email: user.email || '',
      rememberedAt: Date.now(),
    };
    localStorage.setItem(REMEMBERED_DEVICE_USER_KEY, JSON.stringify(payload));
  } catch {
    // Ignore localStorage quota/privacy errors
  }
}

export function clearRememberedDeviceUser(): void {
  try {
    localStorage.removeItem(REMEMBERED_DEVICE_USER_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

export function getRememberedDeviceUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(REMEMBERED_DEVICE_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RememberedDeviceUser>;
      if (parsed.id && typeof parsed.rememberedAt === 'number') {
        const age = Date.now() - parsed.rememberedAt;
        if (age <= REMEMBERED_DEVICE_MAX_AGE_MS) {
          const user: AuthUser = {
            id: parsed.id,
            email: parsed.email || '',
          };
          // Refresh timestamp so active devices stay remembered
          saveRememberedDeviceUser(user);
          return user;
        } else {
          clearRememberedDeviceUser();
        }
      }
    }

    // Fallback: inspect existing Supabase auth token in localStorage if present
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const tokenRaw = localStorage.getItem(key);
        if (!tokenRaw) continue;
        const tokenData = JSON.parse(tokenRaw) as {
          user?: { id?: string; email?: string };
          currentSession?: { user?: { id?: string; email?: string } };
        };
        const sbUser = tokenData?.user || tokenData?.currentSession?.user;
        if (sbUser?.id) {
          const user: AuthUser = {
            id: sbUser.id,
            email: sbUser.email || '',
          };
          saveRememberedDeviceUser(user);
          return user;
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Connect your Supabase URL and Publishable Key first.');
  }
  return supabase;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const remembered = getRememberedDeviceUser();
  const supabase = getSupabaseClient();
  if (!supabase) return remembered;

  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error && data.session?.user) {
      const user: AuthUser = {
        id: data.session.user.id,
        email: data.session.user.email || '',
      };
      saveRememberedDeviceUser(user);
      return user;
    }
  } catch {
    // Fall back to remembered device user if network/session check fails
  }

  return remembered;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Authentication failed.');
  const user: AuthUser = {
    id: data.user.id,
    email: data.user.email || email.trim(),
  };
  saveRememberedDeviceUser(user);
  return user;
}

export async function signUpWithEmail(email: string, password: string): Promise<{
  user: AuthUser | null;
  confirmationRequired: boolean;
}> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(error.message);
  if (data.user && !data.session) {
    return {
      user: { id: data.user.id, email: data.user.email || email.trim() },
      confirmationRequired: true,
    };
  }
  if (data.user) {
    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email || email.trim(),
    };
    saveRememberedDeviceUser(user);
    return {
      user,
      confirmationRequired: false,
    };
  }
  throw new Error('Could not create account.');
}

export async function sendPasswordReset(email: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  });
  if (error) throw new Error(error.message);
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function signOutUser(): Promise<void> {
  clearRememberedDeviceUser();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors during sign out
    }
  }
}
