import { getSupabaseClient } from './client';

export interface AuthUser {
  id: string;
  email: string;
}

function requireSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Connect your Supabase URL and Publishable Key first.');
  }
  return supabase;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;
  return {
    id: data.session.user.id,
    email: data.session.user.email || '',
  };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Authentication failed.');
  return {
    id: data.user.id,
    email: data.user.email || email.trim(),
  };
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
    return {
      user: { id: data.user.id, email: data.user.email || email.trim() },
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
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
}
