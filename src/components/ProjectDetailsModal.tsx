import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Image,
  Wallet,
  CheckSquare,
  CreditCard,
  Copy,
  Check,
  FileText,
  Pencil,
  AlertTriangle,
} from 'lucide-react';
import { PIPELINE_STAGES, ProjectStatus, STAGE_DOT_COLORS } from '../types';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import { computeProjectFinancials } from '../utils/calculations';
import { formatCurrency, formatShortDate, todayIsoDate } from '../utils/format';
import { CustomSelect } from './ui/CustomSelect';

export const ProjectDetailsModal: React.FC = () => {
  const selectedProjectId = usePhotoFlowStore((s) => s.selectedProjectId);
  const setSelectedProjectId = usePhotoFlowStore((s) => s.setSelectedProjectId);
  const projects = usePhotoFlowStore((s) => s.projects);
  const tasks = usePhotoFlowStore((s) => s.tasks);
  const payments = usePhotoFlowStore((s) => s.payments);
  const settings = usePhotoFlowStore((s) => s.settings);
  const updateProjectStatus = usePhotoFlowStore((s) => s.updateProjectStatus);
  const openEditProjectWizard = usePhotoFlowStore((s) => s.openEditProjectWizard);
  const deleteProject = usePhotoFlowStore((s) => s.deleteProject);
  const toggleTaskStatus = usePhotoFlowStore((s) => s.toggleTaskStatus);
  const createTask = usePhotoFlowStore((s) => s.createTask);
  const markPaymentPaid = usePhotoFlowStore((s) => s.markPaymentPaid);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!selectedProjectId) return null;

  const project = projects.find((p) => p.id === selectedProjectId);
  if (!project) return null;

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectPayments = payments.filter((p) => p.projectId === project.id);
  const financials = computeProjectFinancials(project, payments);

  const handleCopy = async (value: string, key: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      setTimeout(() => {
        setCopiedField((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleQuickTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle.trim(),
      description: project.projectName,
      dueDate: project.shootDate || todayIsoDate(),
      dueTime: '17:00',
      priority: 'Normal',
      status: 'Todo',
      clientId: project.clientId,
      projectId: project.id,
      category: 'General',
    });
    setNewTaskTitle('');
  };

  const stageOptions = PIPELINE_STAGES.map((stage) => ({
    value: stage,
    label: stage,
    dotColor: STAGE_DOT_COLORS[stage],
  }));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
        <div
          className="w-full max-w-xl bg-white rounded-2xl border border-neutral-200 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between gap-2 bg-white shrink-0">
            <div className="w-44">
              <CustomSelect
                size="sm"
                value={project.status}
                onChange={(val) => updateProjectStatus(project.id, val as ProjectStatus)}
                options={stageOptions}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const id = project.id;
                  setSelectedProjectId(null);
                  openEditProjectWizard(id);
                }}
                className="h-8 px-2.5 rounded-lg border border-neutral-200 hover:border-black text-xs font-medium text-black inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Delete project"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  setSelectedProjectId(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-6 overflow-y-auto flex-1">
            {/* Header Title */}
            <div>
              <h2 className="text-lg font-semibold text-black tracking-tight">
                {project.projectName}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {project.serviceType}
                {project.packageName ? ` · ${project.packageName}` : ''}
              </p>
            </div>

            {/* Visual Icon Grid for Project Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-neutral-400">Shoot date</p>
                  <p className="text-xs font-medium text-black truncate mt-0.5">
                    {formatShortDate(project.shootDate)}
                    {project.shootTime ? ` · ${project.shootTime}` : ''}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5">
                <Image className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-neutral-400">Gallery due</p>
                  <p className="text-xs font-medium text-black truncate mt-0.5">
                    {formatShortDate(project.galleryDue)}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 flex items-start gap-2.5 col-span-2 sm:col-span-1">
                <MapPin className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] text-neutral-400">Location</p>
                  <p className="text-xs font-medium text-black truncate mt-0.5">
                    {project.location || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financials Strip with Icon */}
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-2.5">
                <Wallet className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-xs font-medium text-black">Financial overview</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Total quoted</span>
                  <span className="text-sm font-semibold text-black tabular-nums mt-0.5 block">
                    {formatCurrency(project.quotedAmount, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Cleared</span>
                  <span className="text-sm font-semibold text-emerald-600 tabular-nums mt-0.5 block">
                    {formatCurrency(financials.calculatedPaid, settings.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[11px]">Remaining</span>
                  <span
                    className={`text-sm font-semibold tabular-nums mt-0.5 block ${
                      financials.calculatedRemaining > 0 ? 'text-amber-600' : 'text-neutral-400'
                    }`}
                  >
                    {formatCurrency(financials.calculatedRemaining, settings.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Section with Click-to-Copy Contact Details */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <User className="w-4 h-4 text-neutral-500" />
                <h3 className="text-xs font-medium text-black">Client</h3>
              </div>

              <div className="p-3.5 rounded-xl border border-neutral-200 flex flex-col gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-semibold text-black shrink-0">
                    {(project.clientName || 'C').slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-black truncate">
                    {project.clientName || 'No client assigned'}
                  </span>
                </div>

                {(project.clientEmail || project.clientPhone) && (
                  <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full">
                    {project.clientEmail && (
                      <button
                        type="button"
                        onClick={() => handleCopy(project.clientEmail, 'email')}
                        className="w-full sm:flex-1 min-w-0 h-9 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-xs text-black flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        title={`Click to copy: ${project.clientEmail}`}
                      >
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate text-left">{project.clientEmail}</span>
                        </span>
                        {copiedField === 'email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                      </button>
                    )}

                    {project.clientPhone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(project.clientPhone, 'phone')}
                        className="w-full sm:flex-1 min-w-0 h-9 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-xs text-black flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        title={`Click to copy: ${project.clientPhone}`}
                      >
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                          <span className="truncate text-left">{project.clientPhone}</span>
                        </span>
                        {copiedField === 'phone' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {project.notes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  <h3 className="text-xs font-medium text-black">Notes</h3>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                  {project.notes}
                </p>
              </div>
            )}

            {/* Tasks */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <CheckSquare className="w-3.5 h-3.5 text-neutral-500" />
                <h3 className="text-xs font-medium text-black">Tasks</h3>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Add a task..."
                  className="flex-1 h-8 px-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-black focus:outline-none focus:bg-white focus:border-black"
                />
                <button
                  type="button"
                  onClick={handleQuickTask}
                  className="h-8 px-3 rounded-lg bg-black text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {projectTasks.length === 0 ? (
                <p className="text-xs text-neutral-400 py-2">No tasks</p>
              ) : (
                <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                  {projectTasks.map((t) => {
                    const done = t.status === 'Done';
                    return (
                      <div
                        key={t.id}
                        className="w-full py-2 flex items-center justify-between gap-3 px-1"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskStatus(t.id);
                            }}
                            className="shrink-0 cursor-pointer"
                            aria-label={done ? 'Mark undone' : 'Mark done'}
                          >
                            {done ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-neutral-300 hover:text-black transition-colors" />
                            )}
                          </button>
                          <span
                            className={`text-xs truncate ${
                              done ? 'line-through text-neutral-400' : 'text-black'
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 shrink-0 tabular-nums">
                          {formatShortDate(t.dueDate)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payments */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                <h3 className="text-xs font-medium text-black">Payments</h3>
              </div>

              {projectPayments.length === 0 ? (
                <p className="text-xs text-neutral-400 py-2">No payments</p>
              ) : (
                <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                  {projectPayments.map((pay) => {
                    const isPaid = pay.status === 'Paid';
                    return (
                      <div
                        key={pay.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="text-black font-medium">{pay.type}</span>
                          <span className="text-neutral-400 ml-2">
                            {isPaid
                              ? `Paid ${formatShortDate(pay.paidDate)}`
                              : `Due ${formatShortDate(pay.dueDate)}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-medium text-black tabular-nums">
                            {formatCurrency(pay.amount, settings.currency)}
                          </span>
                          {isPaid ? (
                            <span className="text-emerald-600 font-medium">Paid</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => markPaymentPaid(pay.id)}
                              className="h-7 px-2.5 rounded-lg bg-black text-white text-[11px] font-medium hover:bg-neutral-800 cursor-pointer"
                            >
                              Mark paid
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Project Popup */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-neutral-200 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-black">Delete project</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">This cannot be undone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-medium text-black">{project.projectName}</span> and its
              linked tasks and payments?
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={async () => {
                  await deleteProject(project.id);
                  setConfirmDeleteOpen(false);
                }}
                className="h-8 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Delete project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
