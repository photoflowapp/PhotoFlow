import React, { useEffect, useState } from 'react';
import {
  X,
  Loader2,
  FolderKanban,
  User,
  Camera,
  Wallet,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import {
  PIPELINE_STAGES,
  PRIORITY_DOT_COLORS,
  ProjectStatus,
  SERVICE_TYPES,
  STAGE_DOT_COLORS,
  TaskPriority,
} from '../types';
import { ProjectUpsertInput, usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import { addDaysIso, formatCurrency, todayIsoDate } from '../utils/format';
import { CustomSelect } from './ui/CustomSelect';
import { CurrencyInput } from './ui/CurrencyInput';

export const ProjectWizardModal: React.FC = () => {
  const isOpen = usePhotoFlowStore((s) => s.isProjectWizardOpen);
  const editingProjectId = usePhotoFlowStore((s) => s.editingProjectId);
  const projects = usePhotoFlowStore((s) => s.projects);
  const clients = usePhotoFlowStore((s) => s.clients);
  const settings = usePhotoFlowStore((s) => s.settings);
  const closeProjectWizard = usePhotoFlowStore((s) => s.closeProjectWizard);
  const saveProjectWorkflow = usePhotoFlowStore((s) => s.saveProjectWorkflow);

  const editingProject = editingProjectId
    ? projects.find((p) => p.id === editingProjectId)
    : undefined;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [form, setForm] = useState<ProjectUpsertInput>({
    projectName: '',
    serviceType: 'Other',
    leadDate: todayIsoDate(),
    shootDate: addDaysIso(todayIsoDate(), 14),
    shootTime: '10:00',
    location: '',
    status: 'Inquiry',
    packageName: '',
    quotedAmount: 0,
    depositAmount: 0,
    finalAmount: 0,
    editingDue: addDaysIso(todayIsoDate(), 21),
    galleryDue: addDaysIso(todayIsoDate(), 28),
    followUpDate: addDaysIso(todayIsoDate(), 3),
    galleryStatus: 'Not Started',
    priority: 'Normal',
    notes: '',
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientCompany: '',
    leadSource: 'Direct',
    autoGenerateTasks: true,
  });

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setValidationError(null);

    if (editingProject) {
      setForm({
        id: editingProject.id,
        projectName: editingProject.projectName,
        serviceType: editingProject.serviceType,
        leadDate: editingProject.leadDate,
        shootDate: editingProject.shootDate,
        shootTime: editingProject.shootTime,
        location: editingProject.location,
        status: editingProject.status,
        packageName: editingProject.packageName,
        quotedAmount: editingProject.quotedAmount,
        depositAmount: editingProject.depositAmount,
        finalAmount: editingProject.finalAmount,
        editingDue: editingProject.editingDue,
        galleryDue: editingProject.galleryDue,
        followUpDate: editingProject.followUpDate,
        galleryStatus: editingProject.galleryStatus,
        priority: editingProject.priority,
        notes: editingProject.notes,
        clientId: editingProject.clientId,
        clientName: editingProject.clientName,
        clientEmail: editingProject.clientEmail,
        clientPhone: editingProject.clientPhone,
        autoGenerateTasks: false,
      });
    } else {
      setForm({
        projectName: '',
        serviceType: 'Other',
        leadDate: todayIsoDate(),
        shootDate: addDaysIso(todayIsoDate(), 14),
        shootTime: '10:00',
        location: '',
        status: 'Inquiry',
        packageName: '',
        quotedAmount: 0,
        depositAmount: 0,
        finalAmount: 0,
        editingDue: addDaysIso(todayIsoDate(), 21),
        galleryDue: addDaysIso(todayIsoDate(), 28),
        followUpDate: addDaysIso(todayIsoDate(), 3),
        galleryStatus: 'Not Started',
        priority: 'Normal',
        notes: '',
        clientId: '',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientCompany: '',
        leadSource: 'Direct',
        autoGenerateTasks: settings.defaultAutoTasks ?? true,
      });
    }
  }, [isOpen, editingProject, settings.defaultAutoTasks]);

  if (!isOpen) return null;

  const updateField = <K extends keyof ProjectUpsertInput>(
    key: K,
    value: ProjectUpsertInput[K]
  ) => {
    setValidationError(null);
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'quotedAmount' || key === 'depositAmount') {
        const q = Number(key === 'quotedAmount' ? value : prev.quotedAmount) || 0;
        const d = Number(key === 'depositAmount' ? value : prev.depositAmount) || 0;
        next.finalAmount = Math.max(0, q - d);
      }
      return next;
    });
  };

  const handleSelectExistingClient = (clientId: string) => {
    if (!clientId) {
      updateField('clientId', '');
      return;
    }
    const found = clients.find((c) => c.id === clientId);
    if (found) {
      setForm((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: `${found.firstName} ${found.lastName}`.trim(),
        clientEmail: found.email,
        clientPhone: found.phone,
        clientCompany: found.company,
      }));
    }
  };

  const validateBeforeSave = (): boolean => {
    if (!form.projectName.trim()) {
      setValidationError('Project name is required.');
      setStep(1);
      return false;
    }

    const quoted = Number(form.quotedAmount) || 0;
    const deposit = Number(form.depositAmount) || 0;

    if (quoted > 0 || deposit > 0) {
      if (!form.clientName.trim()) {
        setValidationError('Client name is required when pricing is set.');
        setStep(2);
        return false;
      }
      if (!form.clientEmail.trim() && !form.clientPhone.trim()) {
        setValidationError('Client email or phone is required when pricing is set.');
        setStep(2);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateBeforeSave()) return;

    setSaving(true);
    try {
      await saveProjectWorkflow(form);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.blur();
    }
  };

  const serviceOptions = SERVICE_TYPES.map((s) => ({ value: s, label: s }));
  const stageOptions = PIPELINE_STAGES.map((s) => ({
    value: s,
    label: s,
    dotColor: STAGE_DOT_COLORS[s],
  }));
  const priorityOptions: Array<{ value: TaskPriority; label: string; dotColor: string }> = [
    { value: 'Low', label: 'Low', dotColor: PRIORITY_DOT_COLORS.Low },
    { value: 'Normal', label: 'Normal', dotColor: PRIORITY_DOT_COLORS.Normal },
    { value: 'High', label: 'High', dotColor: PRIORITY_DOT_COLORS.High },
    { value: 'Urgent', label: 'Urgent', dotColor: PRIORITY_DOT_COLORS.Urgent },
  ];
  const clientOptions = [
    { value: '', label: 'New client' },
    ...clients.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}`.trim(),
      sublabel: c.email || c.phone,
    })),
  ];

  const steps: Array<{
    num: 1 | 2 | 3 | 4;
    label: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      num: 1,
      label: 'Project',
      title: 'Project details',
      subtitle: 'Name, service type, and pipeline stage',
      icon: FolderKanban,
    },
    {
      num: 2,
      label: 'Client',
      title: 'Client information',
      subtitle: 'Select an existing client or add contact info',
      icon: User,
    },
    {
      num: 3,
      label: 'Schedule',
      title: 'Shoot & delivery dates',
      subtitle: 'When and where the shoot takes place',
      icon: Camera,
    },
    {
      num: 4,
      label: 'Pricing',
      title: 'Pricing & workflow',
      subtitle: `Quote and deposit in ${settings.currency}`,
      icon: Wallet,
    },
  ];

  const activeStepMeta = steps.find((s) => s.num === step)!;
  const ActiveIcon = activeStepMeta.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-2xl flex flex-col overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Larger Standalone Icon (no bg) & Smooth Moving Tab Underline */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ActiveIcon className="w-6 h-6 text-black shrink-0 stroke-[1.75]" />
              <div>
                <h2 className="text-sm font-semibold text-black leading-tight">
                  {editingProject ? 'Edit project' : activeStepMeta.title}
                </h2>
                <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                  {activeStepMeta.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeProjectWizard}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Text-only Tabs with Smoothly Sliding Bottom Line */}
          <div className="relative grid grid-cols-4 border-b border-neutral-200 mt-3.5">
            {steps.map((s) => {
              const isCurrent = step === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setStep(s.num)}
                  className={`py-2.5 text-xs text-center transition-colors cursor-pointer ${
                    isCurrent
                      ? 'text-black font-semibold'
                      : 'text-neutral-400 hover:text-black font-medium'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-black transition-transform duration-300 ease-out"
              style={{
                width: '25%',
                transform: `translateX(${(step - 1) * 100}%)`,
              }}
            />
          </div>
        </div>

        {/* Onboarding Step Content — compact & zero-scroll on mobile */}
        <div className="px-5 py-4 space-y-3.5">
          {validationError && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
              {validationError}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Project name</label>
                <input
                  type="text"
                  value={form.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="e.g. Emma & Liam Wedding"
                  className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Service</label>
                  <CustomSelect
                    value={form.serviceType}
                    onChange={(val) => updateField('serviceType', val)}
                    options={serviceOptions}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Stage</label>
                  <CustomSelect
                    value={form.status}
                    onChange={(val) => updateField('status', val as ProjectStatus)}
                    options={stageOptions}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Package</label>
                  <input
                    type="text"
                    value={form.packageName}
                    onChange={(e) => updateField('packageName', e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Full Day"
                    className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Priority</label>
                  <CustomSelect
                    value={form.priority}
                    onChange={(val) => updateField('priority', val as TaskPriority)}
                    options={priorityOptions}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Optional quick note..."
                  className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {clients.length > 0 && (
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Existing client</label>
                  <CustomSelect
                    value={form.clientId || ''}
                    onChange={handleSelectExistingClient}
                    options={clientOptions}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Client name</label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => updateField('clientName', e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Emma Watson"
                  className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => updateField('clientEmail', e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="client@email.com"
                    className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.clientPhone}
                    onChange={(e) => updateField('clientPhone', e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="+1 555 0100"
                    className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Shoot date</label>
                  <input
                    type="date"
                    value={form.shootDate}
                    onChange={(e) => updateField('shootDate', e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-2.5 rounded-md bg-white border border-neutral-200 text-xs sm:text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Shoot time</label>
                  <input
                    type="time"
                    value={form.shootTime}
                    onChange={(e) => updateField('shootTime', e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-2.5 rounded-md bg-white border border-neutral-200 text-xs sm:text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Studio / Venue"
                  className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Editing due</label>
                  <input
                    type="date"
                    value={form.editingDue}
                    onChange={(e) => updateField('editingDue', e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-2.5 rounded-md bg-white border border-neutral-200 text-xs sm:text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Gallery due</label>
                  <input
                    type="date"
                    value={form.galleryDue}
                    onChange={(e) => updateField('galleryDue', e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-2.5 rounded-md bg-white border border-neutral-200 text-xs sm:text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    Quoted ({settings.currency})
                  </label>
                  <CurrencyInput
                    currency={settings.currency}
                    value={form.quotedAmount}
                    onChange={(val) => updateField('quotedAmount', val)}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    Deposit ({settings.currency})
                  </label>
                  <CurrencyInput
                    currency={settings.currency}
                    value={form.depositAmount}
                    onChange={(val) => updateField('depositAmount', val)}
                  />
                </div>
              </div>

              <div className="px-3.5 py-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <span className="text-xs text-neutral-500">Remaining balance</span>
                <span className="text-sm font-semibold text-black tabular-nums">
                  {formatCurrency(form.finalAmount, settings.currency)}
                </span>
              </div>

              {!editingProject && (
                <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(form.autoGenerateTasks)}
                    onChange={(e) => updateField('autoGenerateTasks', e.target.checked)}
                    className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                  />
                  <span className="text-xs text-neutral-600">
                    Automatically generate production tasks
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3.5 border-t border-neutral-100 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                className="h-8 px-3 rounded-lg border border-neutral-200 hover:border-black text-xs font-medium text-black inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
                className="h-8 px-4 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="h-8 px-4 rounded-lg bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{editingProject ? 'Save changes' : 'Create project'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
