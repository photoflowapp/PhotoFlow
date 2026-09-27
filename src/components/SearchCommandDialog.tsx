import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, FolderKanban, CheckSquare, Users } from 'lucide-react';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';

export const SearchCommandDialog: React.FC = () => {
  const isSearchOpen = usePhotoFlowStore((s) => s.isSearchOpen);
  const setSearchOpen = usePhotoFlowStore((s) => s.setSearchOpen);
  const projects = usePhotoFlowStore((s) => s.projects);
  const clients = usePhotoFlowStore((s) => s.clients);
  const tasks = usePhotoFlowStore((s) => s.tasks);
  const setSelectedProjectId = usePhotoFlowStore((s) => s.setSelectedProjectId);
  const setCurrentPage = usePhotoFlowStore((s) => s.setCurrentPage);

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) setQuery('');
  }, [isSearchOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        projects: projects.slice(0, 4),
        clients: clients.slice(0, 3),
        tasks: tasks.filter((t) => t.status === 'Todo').slice(0, 3),
      };
    }
    return {
      projects: projects
        .filter(
          (p) =>
            p.projectName.toLowerCase().includes(q) ||
            p.clientName.toLowerCase().includes(q) ||
            p.status.toLowerCase().includes(q)
        )
        .slice(0, 5),
      clients: clients
        .filter(
          (c) =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
        )
        .slice(0, 4),
      tasks: tasks
        .filter((t) => t.title.toLowerCase().includes(q))
        .slice(0, 4),
    };
  }, [query, projects, clients, tasks]);

  if (!isSearchOpen) return null;

  const hasAny =
    results.projects.length > 0 || results.clients.length > 0 || results.tasks.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-neutral-100">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.blur();
              }
            }}
            placeholder="Search projects, clients, tasks..."
            className="flex-1 bg-transparent text-sm text-black placeholder:text-neutral-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2.5 space-y-3">
          {!hasAny && (
            <p className="py-8 text-center text-xs text-neutral-400">No results</p>
          )}

          {results.projects.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[11px] text-neutral-400 flex items-center gap-1.5">
                <FolderKanban className="w-3 h-3" />
                <span>Projects</span>
              </p>
              {results.projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-neutral-100 text-left text-sm transition-colors cursor-pointer"
                >
                  <span className="text-black font-medium truncate">{p.projectName}</span>
                  <span className="text-xs text-neutral-400 shrink-0 ml-2">
                    {p.clientName || p.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {results.tasks.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[11px] text-neutral-400 flex items-center gap-1.5">
                <CheckSquare className="w-3 h-3" />
                <span>Tasks</span>
              </p>
              {results.tasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (t.projectId) {
                      setSelectedProjectId(t.projectId);
                    } else {
                      setCurrentPage('tasks');
                    }
                    setSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-neutral-100 text-left text-sm transition-colors cursor-pointer"
                >
                  <span className="text-black truncate">{t.title}</span>
                  <span className="text-xs text-neutral-400 shrink-0 ml-2">{t.priority}</span>
                </button>
              ))}
            </div>
          )}

          {results.clients.length > 0 && (
            <div>
              <p className="px-2.5 py-1 text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                <span>Clients</span>
              </p>
              {results.clients.map((c) => {
                const fullName = `${c.firstName} ${c.lastName}`.trim();
                const clientProject = projects.find(
                  (p) =>
                    p.clientId === c.id ||
                    (fullName && p.clientName.toLowerCase() === fullName.toLowerCase())
                );
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (clientProject) {
                        setSelectedProjectId(clientProject.id);
                      } else {
                        setCurrentPage('pipeline');
                      }
                      setSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-neutral-100 text-left text-sm transition-colors cursor-pointer"
                  >
                    <span className="text-black truncate">
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="text-xs text-neutral-400 shrink-0 ml-2">
                      {clientProject ? clientProject.projectName : c.email}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
