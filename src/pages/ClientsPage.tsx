import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  X,
  Users,
  User,
  Mail,
  Phone,
  Copy,
  Check,
  FolderKanban,
} from 'lucide-react';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';

export const ClientsPage: React.FC = () => {
  const clients = usePhotoFlowStore((s) => s.clients);
  const projects = usePhotoFlowStore((s) => s.projects);
  const upsertClient = usePhotoFlowStore((s) => s.upsertClient);
  const deleteClient = usePhotoFlowStore((s) => s.deleteClient);
  const setSelectedProjectId = usePhotoFlowStore((s) => s.setSelectedProjectId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (value: string, key: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSave = async () => {
    if (!firstName.trim()) return;
    await upsertClient({
      firstName,
      lastName,
      company: '',
      email,
      phone,
      clientType: 'Individual',
      leadSource: 'Direct',
      status: 'Active',
      notes: '',
    });
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setShowAddModal(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.blur();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-black" />
          <h1 className="text-2xl font-semibold tracking-tight text-black">Clients</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="h-8 px-3 rounded-md bg-black hover:bg-neutral-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New client</span>
        </button>
      </div>

      {clients.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-400">No clients</p>
      ) : (
        <div className="divide-y divide-neutral-100 border-t border-neutral-200">
          {clients.map((c) => {
            const clientProjects = projects.filter((p) => p.clientId === c.id);
            const fullName = `${c.firstName} ${c.lastName}`.trim();
            return (
              <div
                key={c.id}
                className="py-3.5 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/70 transition-colors group"
              >
                {/* Left: Client Identity */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-semibold text-black shrink-0">
                    <User className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-black truncate">{fullName}</p>
                    {clientProjects.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {clientProjects.slice(0, 3).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedProjectId(p.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-[11px] text-black truncate max-w-[160px] cursor-pointer"
                          >
                            <FolderKanban className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span className="truncate">{p.projectName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Click-to-copy Contact Pills + Delete */}
                <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0 pl-11 sm:pl-0">
                  {c.email && (
                    <button
                      type="button"
                      onClick={() => handleCopy(c.email, `email-${c.id}`)}
                      className="h-7 px-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-xs text-black inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Click to copy email"
                    >
                      <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span className="truncate max-w-[180px]">{c.email}</span>
                      {copiedKey === `email-${c.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-neutral-400 shrink-0" />
                      )}
                    </button>
                  )}

                  {c.phone && (
                    <button
                      type="button"
                      onClick={() => handleCopy(c.phone, `phone-${c.id}`)}
                      className="h-7 px-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-xs text-black inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Click to copy phone"
                    >
                      <Phone className="w-3 h-3 text-neutral-500 shrink-0" />
                      <span>{c.phone}</span>
                      {copiedKey === `phone-${c.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-neutral-400 shrink-0" />
                      )}
                    </button>
                  )}

                  {!c.email && !c.phone && (
                    <span className="text-xs text-neutral-400">No contact info</span>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteClient(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-600 transition-opacity cursor-pointer"
                    aria-label="Delete client"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Client Popup Modal (closes only via close button, Enter blurs input) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-500" />
                <h2 className="text-sm font-semibold text-black">New client</h2>
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
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Emma"
                    className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Watson"
                    className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="client@email.com"
                  className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="+1 555 0100"
                  className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="h-8 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 cursor-pointer"
              >
                Save client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
