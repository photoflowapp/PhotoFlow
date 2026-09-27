import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  X,
  CheckSquare,
  FolderKanban,
} from 'lucide-react';
import { PRIORITY_DOT_COLORS, TaskPriority } from '../types';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import { formatShortDate, todayIsoDate } from '../utils/format';
import { CustomSelect } from '../components/ui/CustomSelect';

export const TasksPage: React.FC = () => {
  const tasks = usePhotoFlowStore((s) => s.tasks);
  const projects = usePhotoFlowStore((s) => s.projects);
  const toggleTaskStatus = usePhotoFlowStore((s) => s.toggleTaskStatus);
  const createTask = usePhotoFlowStore((s) => s.createTask);
  const deleteTask = usePhotoFlowStore((s) => s.deleteTask);
  const setSelectedProjectId = usePhotoFlowStore((s) => s.setSelectedProjectId);

  const [statusFilter, setStatusFilter] = useState<'Todo' | 'Done'>('Todo');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayIsoDate());
  const [priority, setPriority] = useState<TaskPriority>('Normal');
  const [projectId, setProjectId] = useState('');

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === statusFilter)
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  }, [tasks, statusFilter]);

  const handleCreateTask = async () => {
    if (!title.trim()) return;
    const relatedProject = projects.find((p) => p.id === projectId);
    await createTask({
      title: title.trim(),
      description: '',
      dueDate,
      dueTime: '17:00',
      priority,
      status: 'Todo',
      clientId: relatedProject?.clientId || '',
      projectId,
      category: 'General',
    });
    setTitle('');
    setShowCreateModal(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.blur();
    }
  };

  const today = todayIsoDate();

  const priorityOptions: Array<{ value: TaskPriority; label: string; dotColor: string }> = [
    { value: 'Low', label: 'Low', dotColor: PRIORITY_DOT_COLORS.Low },
    { value: 'Normal', label: 'Normal', dotColor: PRIORITY_DOT_COLORS.Normal },
    { value: 'High', label: 'High', dotColor: PRIORITY_DOT_COLORS.High },
    { value: 'Urgent', label: 'Urgent', dotColor: PRIORITY_DOT_COLORS.Urgent },
  ];

  const projectOptions = [
    { value: '', label: 'No project' },
    ...projects.map((p) => ({ value: p.id, label: p.projectName })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CheckSquare className="w-5 h-5 text-black" />
          <h1 className="text-2xl font-semibold tracking-tight text-black">Tasks</h1>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="h-8 px-3 rounded-md bg-black hover:bg-neutral-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New task</span>
        </button>
      </div>

      {/* Tabs — Open & Completed with smooth moving underline */}
      <div className="relative inline-grid grid-cols-2 border-b border-neutral-200 text-xs">
        {(['Todo', 'Done'] as const).map((st) => {
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
              {st === 'Todo' ? 'Open' : 'Completed'}
            </button>
          );
        })}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-black transition-transform duration-300 ease-out"
          style={{
            width: '50%',
            transform: `translateX(${statusFilter === 'Todo' ? 0 : 100}%)`,
          }}
        />
      </div>

      {/* Flat Task List — clicking task opens project details; only checkbox toggles status */}
      {filteredTasks.length === 0 ? (
        <p className="py-12 text-center text-xs text-neutral-400">
          {statusFilter === 'Todo' ? 'No open tasks' : 'No completed tasks'}
        </p>
      ) : (
        <div className="divide-y divide-neutral-100">
          {filteredTasks.map((t) => {
            const done = t.status === 'Done';
            const proj = projects.find((p) => p.id === t.projectId);
            const isOverdue = !done && t.dueDate && t.dueDate < today;

            return (
              <div
                key={t.id}
                onClick={() => {
                  if (t.projectId) {
                    setSelectedProjectId(t.projectId);
                  }
                }}
                className={`py-3 px-1 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors group ${
                  t.projectId ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskStatus(t.id);
                    }}
                    className="shrink-0 cursor-pointer"
                    aria-label={done ? 'Reopen task' : 'Complete task'}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-neutral-300 hover:text-black transition-colors" />
                    )}
                  </button>

                  <span
                    className={`text-sm truncate ${
                      done ? 'line-through text-neutral-400' : 'text-black font-medium'
                    }`}
                  >
                    {t.title}
                  </span>

                  {proj && (
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400 truncate shrink-0 max-w-[160px]">
                      <FolderKanban className="w-3 h-3 shrink-0" />
                      <span className="truncate">{proj.projectName}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_DOT_COLORS[t.priority] }}
                    title={t.priority}
                  />
                  <span
                    className={`text-xs tabular-nums ${
                      isOverdue ? 'text-red-600 font-medium' : 'text-neutral-400'
                    }`}
                  >
                    {formatShortDate(t.dueDate)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(t.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-600 transition-opacity cursor-pointer"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Popup Modal (closes only via close button, Enter blurs input) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-2xl p-5 space-y-4 overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-neutral-500" />
                <h2 className="text-sm font-semibold text-black">New task</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Task title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="e.g. Deliver preview gallery"
                  className="w-full h-9 px-3 rounded-md bg-white border border-neutral-200 text-sm text-black focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    className="w-full h-9 px-2.5 rounded-md bg-white border border-neutral-200 text-xs sm:text-sm text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Priority</label>
                  <CustomSelect
                    value={priority}
                    onChange={(val) => setPriority(val as TaskPriority)}
                    options={priorityOptions}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-500 mb-1">Project</label>
                <CustomSelect
                  value={projectId}
                  onChange={setProjectId}
                  options={projectOptions}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCreateTask}
                className="h-8 px-4 rounded-lg bg-black text-white text-xs font-medium hover:bg-neutral-800 cursor-pointer"
              >
                Create task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
