import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { usePhotoFlowStore } from './stores/usePhotoFlowStore';
import { getSupabaseClient } from './lib/supabase/client';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { AuthScreen } from './components/AuthScreen';
import { SubscriptionGate } from './components/SubscriptionGate';
import { EncryptionVaultGate } from './components/EncryptionVaultGate';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { PipelinePage } from './pages/PipelinePage';
import { CalendarPage } from './pages/CalendarPage';
import { TasksPage } from './pages/TasksPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ProjectWizardModal } from './components/ProjectWizardModal';
import { ProjectDetailsModal } from './components/ProjectDetailsModal';
import { SearchCommandDialog } from './components/SearchCommandDialog';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/ToastContainer';

export default function App() {
  const authLoading = usePhotoFlowStore((s) => s.authLoading);
  const user = usePhotoFlowStore((s) => s.user);
  const subscriptionStatus = usePhotoFlowStore((s) => s.subscriptionStatus);
  const vaultStatus = usePhotoFlowStore((s) => s.vaultStatus);
  const currentPage = usePhotoFlowStore((s) => s.currentPage);
  const initializeAuth = usePhotoFlowStore((s) => s.initializeAuth);
  const setAuthenticatedUser = usePhotoFlowStore((s) => s.setAuthenticatedUser);
  const loadAllDatasets = usePhotoFlowStore((s) => s.loadAllDatasets);

  const isOnline = useOnlineStatus();

  useEffect(() => {
    initializeAuth();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const currentUser = usePhotoFlowStore.getState().user;
        if (!currentUser || currentUser.id !== session.user.id) {
          setAuthenticatedUser({
            id: session.user.id,
            email: session.user.email || '',
          });
        }
      } else {
        setAuthenticatedUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [initializeAuth, setAuthenticatedUser]);

  useEffect(() => {
    if (isOnline && user && subscriptionStatus === 'active' && vaultStatus === 'unlocked') {
      loadAllDatasets();
    }
  }, [isOnline, user, subscriptionStatus, vaultStatus, loadAllDatasets]);

  if (
    authLoading ||
    (user && (subscriptionStatus === 'checking' || (subscriptionStatus === 'active' && vaultStatus === 'checking')))
  ) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-black animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <ToastContainer />
      </>
    );
  }

  if (subscriptionStatus === 'required') {
    return (
      <>
        <SubscriptionGate />
        <ToastContainer />
      </>
    );
  }

  if (vaultStatus === 'needs_setup' || vaultStatus === 'locked') {
    return (
      <>
        <EncryptionVaultGate />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <AppShell>
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'pipeline' && <PipelinePage />}
        {currentPage === 'calendar' && <CalendarPage />}
        {currentPage === 'tasks' && <TasksPage />}
        {currentPage === 'payments' && <PaymentsPage />}
      </AppShell>

      <ProjectWizardModal />
      <ProjectDetailsModal />
      <SearchCommandDialog />
      <SettingsModal />
      <ToastContainer />
    </>
  );
}
