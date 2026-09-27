import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  X,
  CreditCard,
  Wallet,
  Clock,
  FolderKanban,
} from 'lucide-react';
import { PaymentType } from '../types';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import { formatCurrency, formatShortDate, todayIsoDate } from '../utils/format';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CurrencyInput } from '../components/ui/CurrencyInput';

export const PaymentsPage: React.FC = () => {
  const payments = usePhotoFlowStore((s) => s.payments);
  const projects = usePhotoFlowStore((s) => s.projects);
  const settings = usePhotoFlowStore((s) => s.settings);
  const markPaymentPaid = usePhotoFlowStore((s) => s.markPaymentPaid);
  const createPayment = usePhotoFlowStore((s) => s.createPayment);
  const deletePayment = usePhotoFlowStore((s) => s.deletePayment);
  const setSelectedProjectId = usePhotoFlowStore((s) => s.setSelectedProjectId);

  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Paid'>('Pending');
  const [showAddModal, setShowAddModal] = useState(false);

  const [projectId, setProjectId] = useState('');
  const [type, setType] = useState<PaymentType>('Deposit');
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState(todayIsoDate());

  const totals = useMemo(() => {
    const paid = payments
      .filter((p) => p.status === 'Paid')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const pending = payments
      .filter((p) => p.status !== 'Paid')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    return { paid, pending };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter === 'Paid') return p.status === 'Paid';
      return p.status !== 'Paid';
    });
  }, [payments, statusFilter]);

  const handleAddPayment = async () => {
    if (!amount || amount <= 0) return;

    const proj = projects.find((p) => p.id === projectId);
    await createPayment({
      projectId,
      clientId: proj?.clientId || '',
      type,
      dueDate,
      amount,
      status: 'Pending',
      paidDate: '',
      invoiceReference: '',
      notes: '',
    });

    setAmount(0);
    setShowAddModal(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.blur();
    }
  };

  const projectOptions = [
    { value: '', label: 'Select project...' },
    ...projects.map((p) => ({ value: p.id, label: p.projectName })),
  ];

  const typeOptions: Array<{ value: PaymentType; label: string }> = [
    { value: 'Deposit', label: 'Deposit' },
    { value: 'Final Payment', label: 'Final Payment' },
    { value: 'Full Payment', label: 'Full Payment' },
    { value: 'Add-on', label: 'Add-on' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CreditCard className="w-5 h-5 text-black" />
          <h1 className="text-2xl font-semibold tracking-tight text-black">Billing</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="h-8 px-3 rounded-md bg-black hover:bg-neutral-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New payment</span>
        </button>
      </div>

      {/* Summary Strip with Larger Standalone Icons (no background) */}
      <div className="grid grid-cols-2 gap-6 py-4 border-y border-neutral-100">
        <div className="flex items-start gap-3">
          <Wallet className="w-6 h-6 text-black shrink-0 mt-0.5 stroke-[1.75]" />
          <div>
            <p className="text-xs text-neutral-400">Paid</p>
            <p className="text-xl font-semibold text-black tabular-nums mt-0.5">
              {formatCurrency(totals.paid, settings.currency)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="w-6 h-6 text-black shrink-0 mt-0.5 stroke-[1.75]" />
          <div>
            <p className="text-xs text-neutral-400">Pending</p>
            <p className="text-xl font-semibold text-black tabular-nums mt-0.5">
              {formatCurrency(totals.pending, settings.currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs — Pending & Paid with smooth moving underline */}
      <div className="relative inline-grid grid-cols-2 border-b border-neutral-200 text-xs">
        {(['Pending', 'Paid'] as const).map((st) => {
          const active = statusFilter === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-4 pb-2.5 text-center transition-colors cursor-pointer ${
                active
                  ? 'text-black font-semibold'
                  : 'text-neutral-400 hover:text-black font-medium'
              }`}
            >
              {st}
            </button>
          );
        })}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-black transition-transform duration-300 ease-out"
          style={{
            width: '50%',
            transform: `translateX(${statusFilter === 'Pending' ? 0 : 100}%)`,
          }}
        />
      </div>

      {/* Flat Payments List */}
      {filteredPayments.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-400">
          {statusFilter === 'Pending' ? 'No pending payments' : 'No paid payments'}
        </p>
      ) : (
        <div className="divide-y divide-neutral-100">
          {filteredPayments.map((pay) => {
            const proj = projects.find((p) => p.id === pay.projectId);
            const isPaid = pay.status === 'Paid';

            return (
              <div
                key={pay.id}
                className="py-3 px-1 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isPaid ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-sm font-medium text-black">{pay.type}</span>
                    {proj && (
                      <button
                        type="button"
                        onClick={() => setSelectedProjectId(proj.id)}
                        className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-black truncate cursor-pointer"
                      >
                        <FolderKanban className="w-3 h-3 shrink-0" />
                        <span className="truncate">{proj.projectName}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 pl-4 mt-0.5">
                    {isPaid
                      ? `Paid ${formatShortDate(pay.paidDate)}`
                      : `Due ${formatShortDate(pay.dueDate)}`}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium text-black tabular-nums">
                    {formatCurrency(pay.amount, settings.currency)}
                  </span>

                  {isPaid ? (
                    <span className="text-xs text-emerald-600 font-medium">Paid</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markPaymentPaid(pay.id)}
                      className="h-7 px-2.5 rounded-md bg-black text-white text-xs font-medium hover:bg-neutral-800 cursor-pointer"
                    >
                      Mark paid
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deletePayment(pay.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-600 transition-opacity cursor-pointer"
                    aria-label="Delete payment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Payment Popup Modal (closes only via close button, Enter blurs input) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-2xl p-5 space-y-4 overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-neutral-500" />
                <h2 className="text-sm font-semibold text-black">New payment</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Project</label>
                <CustomSelect
                  value={projectId}
                  onChange={setProjectId}
                  options={projectOptions}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Type</label>
                  <CustomSelect
                    value={type}
                    onChange={(val) => setType(val as PaymentType)}
                    options={typeOptions}
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">
                    Amount ({settings.currency})
                  </label>
                  <CurrencyInput
                    currency={settings.currency}
                    value={amount}
                    onChange={setAmount}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-xs sm:text-sm text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAddPayment}
                className="h-8 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 cursor-pointer"
              >
                Save payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
