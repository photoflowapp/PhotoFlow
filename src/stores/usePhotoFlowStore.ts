import { create } from 'zustand';
import {
  Activity,
  AppPage,
  Client,
  CurrencyCode,
  DatasetKey,
  EncryptionEnvelope,
  Payment,
  Project,
  ProjectStatus,
  SettingsMap,
  SyncStatus,
  Task,
  TaskPriority,
  ToastMessage,
  WrappedKeyBundle,
} from '../types';
import {
  createWrappedKeyBundle,
  generateUserDataKey,
  unwrapKeyBundle,
} from '../lib/crypto/cryptoService';
import {
  loadEncryptedDataset,
  loadWrappedKeyBundle,
  saveEncryptedDataset,
  saveManifest,
  saveWrappedKeyBundle,
  wipeAllUserStorageObjects,
} from '../lib/storage/storageRepository';
import { AuthUser, getCurrentUser, signOutUser } from '../lib/supabase/authService';
import {
  SubscriptionRecord,
  verifyAndLoadSubscription,
} from '../lib/stripe/stripeService';
import { computeProjectPaymentStatus } from '../utils/calculations';
import { addDaysIso, generateUuid, todayIsoDate } from '../utils/format';

interface DatasetVersions {
  clients: number;
  projects: number;
  tasks: number;
  payments: number;
  activities: number;
  settings: number;
}

export interface ProjectUpsertInput {
  id?: string;
  projectName: string;
  serviceType: string;
  leadDate: string;
  shootDate: string;
  shootTime: string;
  location: string;
  status: ProjectStatus;
  packageName: string;
  quotedAmount: number;
  depositAmount: number;
  finalAmount: number;
  editingDue: string;
  galleryDue: string;
  followUpDate: string;
  galleryStatus: Project['galleryStatus'];
  priority: TaskPriority;
  notes: string;
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  leadSource?: string;
  autoGenerateTasks?: boolean;
}

interface PhotoFlowStore {
  authLoading: boolean;
  user: AuthUser | null;

  subscriptionStatus: 'checking' | 'required' | 'active';
  subscriptionRecord: SubscriptionRecord | null;

  vaultStatus: 'checking' | 'needs_setup' | 'locked' | 'unlocked';
  dek: CryptoKey | null;
  keyBundle: WrappedKeyBundle | null;
  lastSampleEnvelope: EncryptionEnvelope | null;

  clients: Client[];
  projects: Project[];
  tasks: Task[];
  payments: Payment[];
  activities: Activity[];
  settings: SettingsMap;
  versions: DatasetVersions;

  currentPage: AppPage;
  selectedProjectId: string | null;
  editingProjectId: string | null;
  isProjectWizardOpen: boolean;
  isSearchOpen: boolean;
  isSettingsOpen: boolean;
  calendarMonth: Date;
  selectedCalendarDate: string;

  dataLoading: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  toasts: ToastMessage[];

  initializeAuth: () => Promise<void>;
  setAuthenticatedUser: (user: AuthUser | null) => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  setupEncryptionVault: (
    passphrase: string,
    currency: CurrencyCode,
    studioName: string
  ) => Promise<void>;
  unlockEncryptionVault: (passphrase: string) => Promise<void>;
  lockVault: () => void;
  signOut: () => Promise<void>;

  loadAllDatasets: () => Promise<void>;
  persistDataset: (dataset: DatasetKey) => Promise<void>;

  setCurrentPage: (page: AppPage) => void;
  setSelectedProjectId: (id: string | null) => void;
  openNewProjectWizard: () => void;
  openEditProjectWizard: (projectId: string) => void;
  closeProjectWizard: () => void;
  setSearchOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setCalendarMonth: (date: Date) => void;
  setSelectedCalendarDate: (isoDate: string) => void;
  addToast: (title: string, description?: string, variant?: ToastMessage['variant']) => void;
  dismissToast: (id: string) => void;

  saveProjectWorkflow: (input: ProjectUpsertInput) => Promise<Project>;
  updateProjectStatus: (projectId: string, status: ProjectStatus) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  upsertClient: (
    clientInput: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ) => Promise<Client>;
  deleteClient: (clientId: string) => Promise<void>;

  createTask: (
    taskInput: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Task>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  createPayment: (
    paymentInput: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Payment>;
  markPaymentPaid: (paymentId: string) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;

  updateSettings: (partial: Partial<SettingsMap>) => Promise<void>;
  clearAllApplicationData: () => Promise<void>;
  importLegacyJsonData: (payload: Partial<{
    clients: Client[];
    projects: Project[];
    tasks: Task[];
    payments: Payment[];
    activities: Activity[];
    settings: SettingsMap;
  }>) => Promise<void>;
}

const DEFAULT_SETTINGS: SettingsMap = {
  currency: 'USD',
  studioName: 'PhotoFlow',
  photographerName: '',
  studioEmail: '',
  defaultAutoTasks: true,
  onboardingCompleted: true,
};

const saveTimers: Partial<Record<DatasetKey, ReturnType<typeof setTimeout>>> = {};

export const usePhotoFlowStore = create<PhotoFlowStore>((set, get) => ({
  authLoading: true,
  user: null,

  subscriptionStatus: 'checking',
  subscriptionRecord: null,

  vaultStatus: 'checking',
  dek: null,
  keyBundle: null,
  lastSampleEnvelope: null,

  clients: [],
  projects: [],
  tasks: [],
  payments: [],
  activities: [],
  settings: DEFAULT_SETTINGS,
  versions: {
    clients: 1,
    projects: 1,
    tasks: 1,
    payments: 1,
    activities: 1,
    settings: 1,
  },

  currentPage: 'dashboard',
  selectedProjectId: null,
  editingProjectId: null,
  isProjectWizardOpen: false,
  isSearchOpen: false,
  isSettingsOpen: false,
  calendarMonth: new Date(),
  selectedCalendarDate: todayIsoDate(),

  dataLoading: false,
  syncStatus: 'saved',
  syncError: null,
  lastSyncedAt: null,
  toasts: [],

  addToast: (title, description, variant = 'default') => {
    const id = generateUuid();
    set((s) => ({
      toasts: [...s.toasts, { id, title, description, variant }],
    }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 3500);
  },

  dismissToast: (id) => {
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    }));
  },

  initializeAuth: async () => {
    set({ authLoading: true });
    try {
      const user = await getCurrentUser();
      await get().setAuthenticatedUser(user);
    } catch {
      set({ user: null, authLoading: false, vaultStatus: 'checking' });
    }
  },

  setAuthenticatedUser: async (user) => {
    if (!user) {
      set({
        user: null,
        authLoading: false,
        subscriptionStatus: 'checking',
        subscriptionRecord: null,
        vaultStatus: 'checking',
        dek: null,
        keyBundle: null,
        clients: [],
        projects: [],
        tasks: [],
        payments: [],
        activities: [],
        settings: DEFAULT_SETTINGS,
      });
      return;
    }

    set({
      user,
      authLoading: false,
      subscriptionStatus: 'checking',
      vaultStatus: 'checking',
    });

    try {
      const subResult = await verifyAndLoadSubscription(user);
      if (subResult.justCompletedCheckout) {
        get().addToast('Subscription activated', 'Thank you for subscribing to PhotoFlow.', 'success');
      } else if (subResult.checkoutCanceled) {
        get().addToast('Checkout canceled', 'You can subscribe whenever you are ready.', 'default');
      }

      set({
        subscriptionStatus: subResult.isSubscribed ? 'active' : 'required',
        subscriptionRecord: subResult.record,
      });
    } catch {
      set({
        subscriptionStatus: 'required',
        subscriptionRecord: null,
      });
    }

    try {
      const bundle = await loadWrappedKeyBundle(user.id);
      if (!bundle) {
        set({ vaultStatus: 'needs_setup', keyBundle: null });
        return;
      }

      set({ keyBundle: bundle, vaultStatus: 'locked' });
    } catch (err) {
      set({
        vaultStatus: 'needs_setup',
        syncError: err instanceof Error ? err.message : 'Failed to inspect encryption key bundle.',
      });
    }
  },

  refreshSubscriptionStatus: async () => {
    const { user } = get();
    if (!user) return;
    const subResult = await verifyAndLoadSubscription(user);
    set({
      subscriptionStatus: subResult.isSubscribed ? 'active' : 'required',
      subscriptionRecord: subResult.record,
    });
    if (subResult.isSubscribed) {
      get().addToast('Subscription verified', undefined, 'success');
    } else {
      get().addToast('No active subscription found yet', 'Complete Stripe checkout to unlock your workspace.', 'default');
    }
  },

  setupEncryptionVault: async (passphrase, currency, studioName) => {
    const { user } = get();
    if (!user) throw new Error('Not authenticated.');
    if (passphrase.trim().length < 6) {
      throw new Error('Passphrase must be at least 6 characters.');
    }

    set({ dataLoading: true, syncStatus: 'saving', syncError: null });
    try {
      const dek = await generateUserDataKey();
      const bundle = await createWrappedKeyBundle(dek, passphrase);
      await saveWrappedKeyBundle(user.id, bundle);

      const initialSettings: SettingsMap = {
        ...DEFAULT_SETTINGS,
        currency,
        studioName: studioName.trim() || 'PhotoFlow',
        studioEmail: user.email,
        onboardingCompleted: true,
      };

      set({
        dek,
        keyBundle: bundle,
        vaultStatus: 'unlocked',
        clients: [],
        projects: [],
        tasks: [],
        payments: [],
        activities: [],
        settings: initialSettings,
      });

      const allKeys: DatasetKey[] = [
        'clients',
        'projects',
        'tasks',
        'payments',
        'activities',
        'settings',
      ];
      for (const k of allKeys) {
        await get().persistDataset(k);
      }

      set({
        dataLoading: false,
        syncStatus: 'saved',
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (err) {
      set({
        dataLoading: false,
        syncStatus: 'error',
        syncError: err instanceof Error ? err.message : 'Vault setup failed.',
      });
      throw err;
    }
  },

  unlockEncryptionVault: async (passphrase) => {
    const { user, keyBundle } = get();
    if (!user || !keyBundle) throw new Error('Encryption key bundle not found.');

    set({ dataLoading: true, syncError: null });
    try {
      const dek = await unwrapKeyBundle(keyBundle, passphrase);
      set({ dek, vaultStatus: 'unlocked' });
      await get().loadAllDatasets();
    } catch (err) {
      set({ dataLoading: false });
      throw err;
    }
  },

  lockVault: () => {
    set({
      dek: null,
      vaultStatus: 'locked',
      clients: [],
      projects: [],
      tasks: [],
      payments: [],
      activities: [],
    });
  },

  signOut: async () => {
    await signOutUser();
    set({
      user: null,
      subscriptionStatus: 'checking',
      subscriptionRecord: null,
      dek: null,
      keyBundle: null,
      vaultStatus: 'checking',
      clients: [],
      projects: [],
      tasks: [],
      payments: [],
      activities: [],
      settings: DEFAULT_SETTINGS,
      selectedProjectId: null,
      editingProjectId: null,
      isProjectWizardOpen: false,
      isSettingsOpen: false,
    });
  },

  loadAllDatasets: async () => {
    const { user, dek } = get();
    if (!user || !dek) return;

    set({ dataLoading: true, syncStatus: 'syncing', syncError: null });

    try {
      const [clientsEnv, projectsEnv, tasksEnv, paymentsEnv, activitiesEnv, settingsEnv] =
        await Promise.all([
          loadEncryptedDataset<Client[]>(user.id, 'clients', dek, []),
          loadEncryptedDataset<Project[]>(user.id, 'projects', dek, []),
          loadEncryptedDataset<Task[]>(user.id, 'tasks', dek, []),
          loadEncryptedDataset<Payment[]>(user.id, 'payments', dek, []),
          loadEncryptedDataset<Activity[]>(user.id, 'activities', dek, []),
          loadEncryptedDataset<SettingsMap>(user.id, 'settings', dek, DEFAULT_SETTINGS),
        ]);

      set({
        clients: clientsEnv.data,
        projects: projectsEnv.data,
        tasks: tasksEnv.data,
        payments: paymentsEnv.data,
        activities: activitiesEnv.data.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        settings: { ...DEFAULT_SETTINGS, ...settingsEnv.data },
        versions: {
          clients: clientsEnv.version,
          projects: projectsEnv.version,
          tasks: tasksEnv.version,
          payments: paymentsEnv.version,
          activities: activitiesEnv.version,
          settings: settingsEnv.version,
        },
        dataLoading: false,
        syncStatus: navigator.onLine ? 'saved' : 'offline',
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (err) {
      set({
        dataLoading: false,
        syncStatus: 'error',
        syncError: err instanceof Error ? err.message : 'Failed to decrypt datasets.',
      });
      throw err;
    }
  },

  persistDataset: async (dataset) => {
    if (saveTimers[dataset]) {
      clearTimeout(saveTimers[dataset]);
    }

    set({ syncStatus: navigator.onLine ? 'saving' : 'offline', syncError: null });

    return new Promise<void>((resolve) => {
      saveTimers[dataset] = setTimeout(async () => {
        const { user, dek, versions } = get();
        if (!user || !dek) {
          resolve();
          return;
        }

        if (!navigator.onLine) {
          set({ syncStatus: 'offline' });
          resolve();
          return;
        }

        try {
          set({ syncStatus: 'syncing' });
          const nextVer = (versions[dataset] || 1) + 1;
          const stateData = get()[dataset];

          const result = await saveEncryptedDataset(
            user.id,
            dataset,
            stateData,
            nextVer,
            dek
          );

          const updatedVersions = {
            ...get().versions,
            [dataset]: result.version,
          };

          set({
            versions: updatedVersions,
            lastSampleEnvelope: result.envelopeSample,
            syncStatus: 'saved',
            lastSyncedAt: result.updatedAt,
            syncError: null,
          });

          const manifestDatasets = (
            ['clients', 'projects', 'tasks', 'payments', 'activities', 'settings'] as DatasetKey[]
          ).reduce(
            (acc, key) => {
              const ver = updatedVersions[key] || 1;
              acc[key] = {
                version: ver,
                updatedAt: result.updatedAt,
                objectPath: `${user.id}/${key}.enc`,
              };
              return acc;
            },
            {} as Record<DatasetKey, { version: number; updatedAt: string; objectPath: string }>
          );

          await saveManifest(
            user.id,
            {
              version: 1,
              updatedAt: result.updatedAt,
              datasets: manifestDatasets,
            },
            dek
          );
        } catch (err) {
          set({
            syncStatus: 'error',
            syncError: err instanceof Error ? err.message : 'Failed to save encrypted data.',
          });
        } finally {
          resolve();
        }
      }, 240);
    });
  },

  setCurrentPage: (page) => set({ currentPage: page }),
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  openNewProjectWizard: () => set({ editingProjectId: null, isProjectWizardOpen: true }),
  openEditProjectWizard: (projectId) =>
    set({ editingProjectId: projectId, isProjectWizardOpen: true }),
  closeProjectWizard: () => set({ editingProjectId: null, isProjectWizardOpen: false }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setCalendarMonth: (date) => set({ calendarMonth: date }),
  setSelectedCalendarDate: (isoDate) => set({ selectedCalendarDate: isoDate }),

  saveProjectWorkflow: async (input) => {
    const now = new Date().toISOString();
    const {
      clients,
      projects,
      tasks,
      payments,
      activities,
      persistDataset,
      addToast,
    } = get();

    const isEditing = Boolean(input.id);
    const existingProject = isEditing ? projects.find((p) => p.id === input.id) : undefined;
    const projectId = existingProject?.id || generateUuid();

    let matchedClient = input.clientId
      ? clients.find((c) => c.id === input.clientId)
      : undefined;

    if (!matchedClient && input.clientEmail.trim()) {
      matchedClient = clients.find(
        (c) => c.email.trim().toLowerCase() === input.clientEmail.trim().toLowerCase()
      );
    }

    if (!matchedClient && input.clientName.trim()) {
      matchedClient = clients.find(
        (c) =>
          `${c.firstName} ${c.lastName}`.trim().toLowerCase() ===
          input.clientName.trim().toLowerCase()
      );
    }

    let updatedClients = [...clients];
    let clientChanged = false;
    let clientId = matchedClient?.id || '';

    if (input.clientName.trim()) {
      const nameParts = input.clientName.trim().split(/\s+/);
      const firstName = nameParts[0] || 'Client';
      const lastName = nameParts.slice(1).join(' ');

      if (!matchedClient) {
        clientId = generateUuid();
        const newClient: Client = {
          id: clientId,
          firstName,
          lastName,
          company: input.clientCompany?.trim() || '',
          email: input.clientEmail.trim(),
          phone: input.clientPhone.trim(),
          clientType: input.serviceType === 'Commercial' ? 'Commercial' : 'Individual',
          leadSource: input.leadSource?.trim() || 'Direct',
          status: 'Active',
          notes: '',
          createdAt: now,
          updatedAt: now,
        };
        updatedClients = [newClient, ...updatedClients];
        clientChanged = true;
      } else {
        clientId = matchedClient.id;
        if (
          (input.clientEmail.trim() && input.clientEmail.trim() !== matchedClient.email) ||
          (input.clientPhone.trim() && input.clientPhone.trim() !== matchedClient.phone)
        ) {
          updatedClients = updatedClients.map((c) =>
            c.id === matchedClient!.id
              ? {
                  ...c,
                  email: input.clientEmail.trim() || c.email,
                  phone: input.clientPhone.trim() || c.phone,
                  updatedAt: now,
                }
              : c
          );
          clientChanged = true;
        }
      }
    }

    let updatedPayments = [...payments];
    let paymentsChanged = false;
    const projectPayments = updatedPayments.filter((p) => p.projectId === projectId);

    const quoted = Number(input.quotedAmount) || 0;
    const deposit = Number(input.depositAmount) || 0;
    const finalAmt =
      input.finalAmount > 0 ? Number(input.finalAmount) : Math.max(0, quoted - deposit);

    if (deposit > 0) {
      const existingDeposit = projectPayments.find((p) => p.type === 'Deposit');
      if (!existingDeposit) {
        updatedPayments.unshift({
          id: generateUuid(),
          projectId,
          clientId,
          type: 'Deposit',
          dueDate: input.leadDate || todayIsoDate(),
          amount: deposit,
          status: 'Pending',
          paidDate: '',
          invoiceReference: `DEP-${projectId.slice(0, 4).toUpperCase()}`,
          notes: `Retainer for ${input.projectName}`,
          createdAt: now,
          updatedAt: now,
        });
        paymentsChanged = true;
      } else if (existingDeposit.status !== 'Paid' && existingDeposit.amount !== deposit) {
        updatedPayments = updatedPayments.map((p) =>
          p.id === existingDeposit.id ? { ...p, amount: deposit, updatedAt: now } : p
        );
        paymentsChanged = true;
      }
    }

    if (finalAmt > 0 && deposit > 0) {
      const existingFinal = projectPayments.find((p) => p.type === 'Final Payment');
      if (!existingFinal) {
        updatedPayments.unshift({
          id: generateUuid(),
          projectId,
          clientId,
          type: 'Final Payment',
          dueDate: input.shootDate || addDaysIso(todayIsoDate(), 14),
          amount: finalAmt,
          status: 'Pending',
          paidDate: '',
          invoiceReference: `FIN-${projectId.slice(0, 4).toUpperCase()}`,
          notes: `Balance for ${input.projectName}`,
          createdAt: now,
          updatedAt: now,
        });
        paymentsChanged = true;
      } else if (existingFinal.status !== 'Paid' && existingFinal.amount !== finalAmt) {
        updatedPayments = updatedPayments.map((p) =>
          p.id === existingFinal.id
            ? {
                ...p,
                amount: finalAmt,
                dueDate: input.shootDate || p.dueDate,
                updatedAt: now,
              }
            : p
        );
        paymentsChanged = true;
      }
    } else if (deposit === 0 && quoted > 0) {
      const existingFull = projectPayments.find((p) => p.type === 'Full Payment');
      if (!existingFull) {
        updatedPayments.unshift({
          id: generateUuid(),
          projectId,
          clientId,
          type: 'Full Payment',
          dueDate: input.shootDate || addDaysIso(todayIsoDate(), 7),
          amount: quoted,
          status: 'Pending',
          paidDate: '',
          invoiceReference: `INV-${projectId.slice(0, 4).toUpperCase()}`,
          notes: `Full payment for ${input.projectName}`,
          createdAt: now,
          updatedAt: now,
        });
        paymentsChanged = true;
      } else if (existingFull.status !== 'Paid' && existingFull.amount !== quoted) {
        updatedPayments = updatedPayments.map((p) =>
          p.id === existingFull.id ? { ...p, amount: quoted, updatedAt: now } : p
        );
        paymentsChanged = true;
      }
    }

    const paymentStatus = computeProjectPaymentStatus(
      { quotedAmount: quoted },
      updatedPayments.filter((p) => p.projectId === projectId)
    );

    const savedProject: Project = {
      id: projectId,
      clientId,
      clientName: input.clientName.trim(),
      clientEmail: input.clientEmail.trim(),
      clientPhone: input.clientPhone.trim(),
      projectName: input.projectName.trim(),
      serviceType: input.serviceType,
      leadDate: input.leadDate || todayIsoDate(),
      shootDate: input.shootDate,
      shootTime: input.shootTime,
      location: input.location.trim(),
      status: input.status,
      packageName: input.packageName.trim(),
      quotedAmount: quoted,
      depositAmount: deposit,
      finalAmount: finalAmt,
      editingDue: input.editingDue,
      galleryDue: input.galleryDue,
      followUpDate: input.followUpDate,
      paymentStatus,
      galleryStatus: input.galleryStatus,
      priority: input.priority,
      notes: input.notes.trim(),
      createdAt: existingProject?.createdAt || now,
      updatedAt: now,
    };

    const updatedProjects = isEditing
      ? projects.map((p) => (p.id === projectId ? savedProject : p))
      : [savedProject, ...projects];

    let updatedTasks = [...tasks];
    let tasksChanged = false;

    if (!isEditing && input.autoGenerateTasks) {
      const shootRef = input.shootDate || addDaysIso(todayIsoDate(), 14);
      const defaultChecklist: Array<{
        title: string;
        category: string;
        priority: TaskPriority;
        dueDate: string;
      }> = [
        {
          title: 'Send prep guide & shot list',
          category: 'Pre-Production',
          priority: 'Normal',
          dueDate: addDaysIso(shootRef, -7),
        },
        {
          title: 'Gear check & battery charging',
          category: 'Pre-Production',
          priority: 'High',
          dueDate: addDaysIso(shootRef, -1),
        },
        {
          title: 'Cull raw files',
          category: 'Post-Production',
          priority: 'Normal',
          dueDate: addDaysIso(shootRef, 2),
        },
        {
          title: 'Color grading & retouching',
          category: 'Post-Production',
          priority: 'High',
          dueDate: input.editingDue || addDaysIso(shootRef, 7),
        },
        {
          title: 'Export & deliver digital gallery',
          category: 'Delivery',
          priority: 'High',
          dueDate: input.galleryDue || addDaysIso(shootRef, 14),
        },
      ];

      if (input.serviceType.toLowerCase().includes('wedding')) {
        defaultChecklist.unshift({
          title: 'Send contract & retainer invoice',
          category: 'Administration',
          priority: 'Urgent',
          dueDate: addDaysIso(todayIsoDate(), 2),
        });
      }

      const generatedTasks: Task[] = defaultChecklist.map((item) => ({
        id: generateUuid(),
        title: item.title,
        description: `${savedProject.projectName}`,
        dueDate: item.dueDate,
        dueTime: '17:00',
        priority: item.priority,
        status: 'Todo',
        clientId,
        projectId,
        category: item.category,
        createdAt: now,
        updatedAt: now,
      }));

      updatedTasks = [...generatedTasks, ...updatedTasks];
      tasksChanged = true;
    }

    const newActivity: Activity = {
      id: generateUuid(),
      clientId,
      projectId,
      type: isEditing ? 'project_updated' : 'project_created',
      message: isEditing
        ? `Updated ${savedProject.projectName}`
        : `Created ${savedProject.projectName}`,
      timestamp: now,
    };

    const updatedActivities = [newActivity, ...activities];

    set({
      clients: updatedClients,
      projects: updatedProjects,
      tasks: updatedTasks,
      payments: updatedPayments,
      activities: updatedActivities,
      isProjectWizardOpen: false,
      editingProjectId: null,
    });

    const writePromises: Promise<void>[] = [
      persistDataset('projects'),
      persistDataset('activities'),
    ];
    if (clientChanged) writePromises.push(persistDataset('clients'));
    if (paymentsChanged) writePromises.push(persistDataset('payments'));
    if (tasksChanged) writePromises.push(persistDataset('tasks'));

    await Promise.all(writePromises);

    addToast(isEditing ? 'Project updated' : 'Project created', savedProject.projectName, 'success');

    return savedProject;
  },

  updateProjectStatus: async (projectId, status) => {
    const now = new Date().toISOString();
    const { projects, activities, persistDataset } = get();
    const target = projects.find((p) => p.id === projectId);
    if (!target || target.status === status) return;

    const updatedProjects = projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            status,
            galleryStatus:
              status === 'Gallery Ready'
                ? 'Ready'
                : status === 'Delivered' || status === 'Completed'
                  ? 'Delivered'
                  : p.galleryStatus,
            updatedAt: now,
          }
        : p
    );

    const newActivity: Activity = {
      id: generateUuid(),
      clientId: target.clientId,
      projectId,
      type: 'project_updated',
      message: `${target.projectName} moved to ${status}`,
      timestamp: now,
    };

    set({
      projects: updatedProjects,
      activities: [newActivity, ...activities],
    });

    await Promise.all([persistDataset('projects'), persistDataset('activities')]);
  },

  deleteProject: async (projectId) => {
    const { projects, tasks, payments, activities, persistDataset, addToast } = get();
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;

    const now = new Date().toISOString();
    set({
      projects: projects.filter((p) => p.id !== projectId),
      tasks: tasks.filter((t) => t.projectId !== projectId),
      payments: payments.filter((pay) => pay.projectId !== projectId),
      activities: [
        {
          id: generateUuid(),
          clientId: target.clientId,
          projectId,
          type: 'project_updated',
          message: `Deleted ${target.projectName}`,
          timestamp: now,
        },
        ...activities,
      ],
      selectedProjectId: get().selectedProjectId === projectId ? null : get().selectedProjectId,
    });

    await Promise.all([
      persistDataset('projects'),
      persistDataset('tasks'),
      persistDataset('payments'),
      persistDataset('activities'),
    ]);

    addToast('Project deleted');
  },

  upsertClient: async (clientInput) => {
    const now = new Date().toISOString();
    const { clients, activities, persistDataset, addToast } = get();
    const isEditing = Boolean(clientInput.id);
    const id = clientInput.id || generateUuid();

    const savedClient: Client = {
      id,
      firstName: clientInput.firstName.trim(),
      lastName: clientInput.lastName.trim(),
      company: clientInput.company.trim(),
      email: clientInput.email.trim(),
      phone: clientInput.phone.trim(),
      clientType: clientInput.clientType,
      leadSource: clientInput.leadSource,
      status: clientInput.status,
      notes: clientInput.notes,
      createdAt: isEditing
        ? clients.find((c) => c.id === id)?.createdAt || now
        : now,
      updatedAt: now,
    };

    const updatedClients = isEditing
      ? clients.map((c) => (c.id === id ? savedClient : c))
      : [savedClient, ...clients];

    const newActivity: Activity = {
      id: generateUuid(),
      clientId: id,
      projectId: '',
      type: 'client_created',
      message: `${isEditing ? 'Updated' : 'Added'} ${savedClient.firstName} ${savedClient.lastName}`.trim(),
      timestamp: now,
    };

    set({
      clients: updatedClients,
      activities: [newActivity, ...activities],
    });

    await Promise.all([persistDataset('clients'), persistDataset('activities')]);
    addToast(isEditing ? 'Client updated' : 'Client saved', undefined, 'success');
    return savedClient;
  },

  deleteClient: async (clientId) => {
    const { clients, persistDataset, addToast } = get();
    set({
      clients: clients.filter((c) => c.id !== clientId),
    });
    await persistDataset('clients');
    addToast('Client deleted');
  },

  createTask: async (taskInput) => {
    const now = new Date().toISOString();
    const { tasks, activities, persistDataset, addToast } = get();

    const newTask: Task = {
      ...taskInput,
      id: generateUuid(),
      createdAt: now,
      updatedAt: now,
    };

    const newActivity: Activity = {
      id: generateUuid(),
      clientId: newTask.clientId,
      projectId: newTask.projectId,
      type: 'task_created',
      message: `Added task "${newTask.title}"`,
      timestamp: now,
    };

    set({
      tasks: [newTask, ...tasks],
      activities: [newActivity, ...activities],
    });

    await Promise.all([persistDataset('tasks'), persistDataset('activities')]);
    addToast('Task added', newTask.title, 'success');
    return newTask;
  },

  toggleTaskStatus: async (taskId) => {
    const now = new Date().toISOString();
    const { tasks, activities, persistDataset } = get();
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const nextStatus = target.status === 'Done' ? 'Todo' : 'Done';
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: nextStatus as Task['status'], updatedAt: now } : t
    );

    const updatedActivities =
      nextStatus === 'Done'
        ? [
            {
              id: generateUuid(),
              clientId: target.clientId,
              projectId: target.projectId,
              type: 'task_completed' as const,
              message: `Completed "${target.title}"`,
              timestamp: now,
            },
            ...activities,
          ]
        : activities;

    set({
      tasks: updatedTasks,
      activities: updatedActivities,
    });

    await Promise.all([
      persistDataset('tasks'),
      ...(nextStatus === 'Done' ? [persistDataset('activities')] : []),
    ]);
  },

  deleteTask: async (taskId) => {
    const { tasks, persistDataset } = get();
    set({
      tasks: tasks.filter((t) => t.id !== taskId),
    });
    await persistDataset('tasks');
  },

  createPayment: async (paymentInput) => {
    const now = new Date().toISOString();
    const { payments, projects, activities, persistDataset, addToast } = get();

    const newPayment: Payment = {
      ...paymentInput,
      id: generateUuid(),
      createdAt: now,
      updatedAt: now,
    };

    const updatedPayments = [newPayment, ...payments];

    let updatedProjects = projects;
    if (newPayment.projectId) {
      updatedProjects = projects.map((proj) => {
        if (proj.id !== newPayment.projectId) return proj;
        const projPayments = updatedPayments.filter((p) => p.projectId === proj.id);
        return {
          ...proj,
          paymentStatus: computeProjectPaymentStatus(proj, projPayments),
          updatedAt: now,
        };
      });
    }

    const newActivity: Activity = {
      id: generateUuid(),
      clientId: newPayment.clientId,
      projectId: newPayment.projectId,
      type: 'payment_created',
      message: `Added ${newPayment.type} (${newPayment.amount})`,
      timestamp: now,
    };

    set({
      payments: updatedPayments,
      projects: updatedProjects,
      activities: [newActivity, ...activities],
    });

    await Promise.all([
      persistDataset('payments'),
      persistDataset('projects'),
      persistDataset('activities'),
    ]);

    addToast('Payment added', undefined, 'success');
    return newPayment;
  },

  markPaymentPaid: async (paymentId) => {
    const now = new Date().toISOString();
    const today = todayIsoDate();
    const { payments, projects, activities, persistDataset, addToast } = get();

    const target = payments.find((p) => p.id === paymentId);
    if (!target || target.status === 'Paid') return;

    const updatedPayments = payments.map((p) =>
      p.id === paymentId
        ? { ...p, status: 'Paid' as const, paidDate: today, updatedAt: now }
        : p
    );

    const relatedProject = projects.find((proj) => proj.id === target.projectId);
    const updatedProjects = projects.map((proj) => {
      if (proj.id !== target.projectId) return proj;
      const projPayments = updatedPayments.filter((p) => p.projectId === proj.id);
      return {
        ...proj,
        paymentStatus: computeProjectPaymentStatus(proj, projPayments),
        updatedAt: now,
      };
    });

    const newActivity: Activity = {
      id: generateUuid(),
      clientId: target.clientId,
      projectId: target.projectId,
      type: 'payment_received',
      message: `Received ${target.type}${relatedProject ? ` · ${relatedProject.projectName}` : ''}`,
      timestamp: now,
    };

    set({
      payments: updatedPayments,
      projects: updatedProjects,
      activities: [newActivity, ...activities],
    });

    await Promise.all([
      persistDataset('payments'),
      persistDataset('projects'),
      persistDataset('activities'),
    ]);

    addToast('Marked as paid', relatedProject?.projectName, 'success');
  },

  deletePayment: async (paymentId) => {
    const now = new Date().toISOString();
    const { payments, projects, persistDataset } = get();
    const target = payments.find((p) => p.id === paymentId);
    const updatedPayments = payments.filter((p) => p.id !== paymentId);

    const updatedProjects = target?.projectId
      ? projects.map((proj) => {
          if (proj.id !== target.projectId) return proj;
          const projPayments = updatedPayments.filter((p) => p.projectId === proj.id);
          return {
            ...proj,
            paymentStatus: computeProjectPaymentStatus(proj, projPayments),
            updatedAt: now,
          };
        })
      : projects;

    set({ payments: updatedPayments, projects: updatedProjects });
    await Promise.all([persistDataset('payments'), persistDataset('projects')]);
  },

  updateSettings: async (partial) => {
    const now = new Date().toISOString();
    const { settings, activities, persistDataset, addToast } = get();
    const updatedSettings: SettingsMap = { ...settings, ...partial };

    const newActivity: Activity = {
      id: generateUuid(),
      clientId: '',
      projectId: '',
      type: 'settings_updated',
      message: 'Updated workspace settings',
      timestamp: now,
    };

    set({
      settings: updatedSettings,
      activities: [newActivity, ...activities],
    });

    await Promise.all([persistDataset('settings'), persistDataset('activities')]);
    addToast('Settings saved', undefined, 'success');
  },

  clearAllApplicationData: async () => {
    const { user, settings, persistDataset, addToast } = get();
    if (!user) return;

    const now = new Date().toISOString();
    await wipeAllUserStorageObjects(user.id);

    const resetActivity: Activity = {
      id: generateUuid(),
      clientId: '',
      projectId: '',
      type: 'db_reset',
      message: 'Cleared all workspace data',
      timestamp: now,
    };

    set({
      clients: [],
      projects: [],
      tasks: [],
      payments: [],
      activities: [resetActivity],
      settings,
      selectedProjectId: null,
      editingProjectId: null,
    });

    await Promise.all([
      persistDataset('clients'),
      persistDataset('projects'),
      persistDataset('tasks'),
      persistDataset('payments'),
      persistDataset('activities'),
      persistDataset('settings'),
    ]);

    addToast('All data cleared');
  },

  importLegacyJsonData: async (payload) => {
    const { settings, persistDataset, addToast } = get();
    set({
      clients: Array.isArray(payload.clients) ? payload.clients : get().clients,
      projects: Array.isArray(payload.projects) ? payload.projects : get().projects,
      tasks: Array.isArray(payload.tasks) ? payload.tasks : get().tasks,
      payments: Array.isArray(payload.payments) ? payload.payments : get().payments,
      activities: Array.isArray(payload.activities) ? payload.activities : get().activities,
      settings: payload.settings ? { ...settings, ...payload.settings } : settings,
    });

    await Promise.all([
      persistDataset('clients'),
      persistDataset('projects'),
      persistDataset('tasks'),
      persistDataset('payments'),
      persistDataset('activities'),
      persistDataset('settings'),
    ]);

    addToast('Data imported', undefined, 'success');
  },
}));
