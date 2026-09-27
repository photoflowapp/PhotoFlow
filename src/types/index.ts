export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'CAD'
  | 'AUD'
  | 'CHF'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'NZD'
  | 'JPY';

export type ProjectStatus =
  | 'Inquiry'
  | 'Follow Up'
  | 'Quoted'
  | 'Booked'
  | 'Planning'
  | 'Shoot Complete'
  | 'Editing'
  | 'Gallery Ready'
  | 'Delivered'
  | 'Completed';

export const PIPELINE_STAGES: ProjectStatus[] = [
  'Inquiry',
  'Follow Up',
  'Quoted',
  'Booked',
  'Planning',
  'Shoot Complete',
  'Editing',
  'Gallery Ready',
  'Delivered',
  'Completed',
];

export const STAGE_DOT_COLORS: Record<ProjectStatus, string> = {
  Inquiry: '#a3a3a3',
  'Follow Up': '#f59e0b',
  Quoted: '#3b82f6',
  Booked: '#10b981',
  Planning: '#06b6d4',
  'Shoot Complete': '#8b5cf6',
  Editing: '#f97316',
  'Gallery Ready': '#14b8a6',
  Delivered: '#22c55e',
  Completed: '#171717',
};

export const SERVICE_TYPES = [
  'Other',
  'Wedding',
  'Portrait',
  'Commercial',
  'Editorial',
  'Event',
  'Brand & Lifestyle',
  'Family & Maternity',
  'Architecture',
] as const;

export type TaskPriority = 'Urgent' | 'High' | 'Normal' | 'Low';
export type TaskStatus = 'Todo' | 'Done';

export const PRIORITY_DOT_COLORS: Record<TaskPriority, string> = {
  Urgent: '#ef4444',
  High: '#f59e0b',
  Normal: '#a3a3a3',
  Low: '#d4d4d4',
};

export type PaymentType = 'Deposit' | 'Final Payment' | 'Full Payment' | 'Add-on';
export type PaymentStatus = 'Pending' | 'Paid' | 'Overdue';

export type ProjectPaymentStatus = 'Unpaid' | 'Partial' | 'Paid';
export type GalleryStatus = 'Not Started' | 'In Progress' | 'Ready' | 'Delivered';

export type ClientType = 'Individual' | 'Couple' | 'Brand' | 'Agency' | 'Commercial';
export type ClientStatus = 'Lead' | 'Active' | 'Past' | 'Archived';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  clientType: ClientType;
  leadSource: string;
  status: ClientStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
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
  paymentStatus: ProjectPaymentStatus;
  galleryStatus: GalleryStatus;
  priority: TaskPriority;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
  status: TaskStatus;
  clientId: string;
  projectId: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  projectId: string;
  clientId: string;
  type: PaymentType;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  paidDate: string;
  invoiceReference: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'project_created'
  | 'project_updated'
  | 'task_created'
  | 'task_completed'
  | 'payment_created'
  | 'payment_received'
  | 'client_created'
  | 'settings_updated'
  | 'db_reset';

export interface Activity {
  id: string;
  clientId: string;
  projectId: string;
  type: ActivityType;
  message: string;
  timestamp: string;
}

export interface SettingsMap {
  currency: CurrencyCode;
  studioName: string;
  photographerName: string;
  studioEmail: string;
  defaultAutoTasks: boolean;
  onboardingCompleted: boolean;
}

export type DatasetKey =
  | 'clients'
  | 'projects'
  | 'tasks'
  | 'payments'
  | 'activities'
  | 'settings';

export interface DatasetEnvelope<T> {
  version: number;
  updatedAt: string;
  data: T;
}

export interface EncryptionEnvelope {
  version: number;
  algorithm: 'AES-GCM';
  iv: string;
  ciphertext: string;
  encryptedAt: string;
}

export interface WrappedKeyBundle {
  version: number;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  wrapIv: string;
  wrappedKey: string;
  verificationCiphertext: string;
  createdAt: string;
}

export interface StorageManifest {
  version: number;
  updatedAt: string;
  datasets: Record<
    DatasetKey,
    {
      version: number;
      updatedAt: string;
      objectPath: string;
    }
  >;
}

export type SyncStatus = 'saved' | 'saving' | 'syncing' | 'offline' | 'error';

export type AppPage =
  | 'dashboard'
  | 'pipeline'
  | 'calendar'
  | 'tasks'
  | 'payments'
  | 'clients';

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'shoot' | 'editing' | 'gallery' | 'task';
  projectId?: string;
  taskId?: string;
  status?: string;
  priority?: TaskPriority;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'error';
}
