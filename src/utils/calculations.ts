import {
  CalendarEventItem,
  Payment,
  Project,
  ProjectPaymentStatus,
  Task,
} from '../types';

export interface ProjectFinancialMetrics {
  calculatedPaid: number;
  calculatedRemaining: number;
  paymentStatus: ProjectPaymentStatus;
}

export function computeProjectFinancials(
  project: Pick<Project, 'id' | 'quotedAmount'>,
  payments: Payment[]
): ProjectFinancialMetrics {
  const projectPayments = payments.filter((p) => p.projectId === project.id);
  const calculatedPaid = projectPayments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const quoted = Number(project.quotedAmount) || 0;
  const calculatedRemaining = Math.max(0, quoted - calculatedPaid);

  let paymentStatus: ProjectPaymentStatus = 'Unpaid';
  if (quoted > 0 && calculatedPaid >= quoted) {
    paymentStatus = 'Paid';
  } else if (calculatedPaid > 0) {
    paymentStatus = 'Partial';
  }

  return {
    calculatedPaid,
    calculatedRemaining,
    paymentStatus,
  };
}

export function computeProjectPaymentStatus(
  project: Pick<Project, 'quotedAmount'>,
  projectPayments: Payment[]
): ProjectPaymentStatus {
  const paid = projectPayments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const quoted = Number(project.quotedAmount) || 0;
  if (quoted > 0 && paid >= quoted) return 'Paid';
  if (paid > 0) return 'Partial';
  return 'Unpaid';
}

export interface DashboardKpis {
  clearedRevenue: number;
  outstanding: number;
  upcomingShoots: number;
  inEditing: number;
  rolling30DayRevenue: number;
}

export function computeDashboardKpis(
  projects: Project[],
  payments: Payment[]
): DashboardKpis {
  const clearedRevenue = payments
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const outstanding = projects.reduce((sum, proj) => {
    const { calculatedRemaining } = computeProjectFinancials(proj, payments);
    return sum + calculatedRemaining;
  }, 0);

  const upcomingShoots = projects.filter(
    (p) => p.status === 'Booked' || p.status === 'Planning'
  ).length;

  const inEditing = projects.filter((p) => p.status === 'Editing').length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysIso = thirtyDaysAgo.toISOString().slice(0, 10);

  const rolling30DayRevenue = payments
    .filter((p) => p.status === 'Paid' && p.paidDate && p.paidDate >= thirtyDaysIso)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return {
    clearedRevenue,
    outstanding,
    upcomingShoots,
    inEditing,
    rolling30DayRevenue,
  };
}

export interface IncomeTrendPoint {
  date: string;
  label: string;
  amount: number;
  cumulative: number;
}

export function compute30DayIncomeTrend(payments: Payment[]): IncomeTrendPoint[] {
  const points: IncomeTrendPoint[] = [];
  const today = new Date();
  let runningTotal = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const daySum = payments
      .filter((p) => p.status === 'Paid' && p.paidDate && p.paidDate.slice(0, 10) === iso)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    runningTotal += daySum;
    points.push({
      date: iso,
      label,
      amount: daySum,
      cumulative: runningTotal,
    });
  }

  return points;
}

export function buildCalendarEvents(
  projects: Project[],
  tasks: Task[]
): CalendarEventItem[] {
  const events: CalendarEventItem[] = [];

  for (const p of projects) {
    if (p.shootDate) {
      events.push({
        id: `shoot-${p.id}`,
        title: p.projectName,
        date: p.shootDate,
        time: p.shootTime || '09:00',
        type: 'shoot',
        projectId: p.id,
        status: p.status,
      });
    }
    if (p.editingDue) {
      events.push({
        id: `edit-${p.id}`,
        title: `Editing: ${p.projectName}`,
        date: p.editingDue,
        type: 'editing',
        projectId: p.id,
        status: p.status,
      });
    }
    if (p.galleryDue) {
      events.push({
        id: `gallery-${p.id}`,
        title: `Gallery: ${p.projectName}`,
        date: p.galleryDue,
        type: 'gallery',
        projectId: p.id,
        status: p.galleryStatus,
      });
    }
  }

  for (const t of tasks) {
    if (t.dueDate && t.status !== 'Done') {
      events.push({
        id: `task-${t.id}`,
        title: t.title,
        date: t.dueDate,
        time: t.dueTime,
        type: 'task',
        projectId: t.projectId || undefined,
        taskId: t.id,
        priority: t.priority,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export interface AttentionSummary {
  todaysShoots: Project[];
  galleryDeadlines: Project[];
  overdueTasks: Task[];
}

export function computeAttentionItems(
  projects: Project[],
  tasks: Task[],
  todayIso: string
): AttentionSummary {
  const sevenDaysOut = new Date(`${todayIso}T00:00:00`);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const sevenDaysIso = sevenDaysOut.toISOString().slice(0, 10);

  const todaysShoots = projects.filter((p) => p.shootDate === todayIso);

  const galleryDeadlines = projects.filter(
    (p) =>
      p.galleryDue &&
      p.galleryDue <= sevenDaysIso &&
      p.galleryStatus !== 'Delivered' &&
      p.status !== 'Completed' &&
      p.status !== 'Delivered'
  );

  const overdueTasks = tasks.filter(
    (t) => t.status === 'Todo' && t.dueDate && t.dueDate <= todayIso
  );

  return {
    todaysShoots,
    galleryDeadlines,
    overdueTasks,
  };
}
