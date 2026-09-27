import React, { useMemo, useState } from 'react';
import { Plus, Search, Kanban } from 'lucide-react';
import { PIPELINE_STAGES, ProjectStatus, STAGE_DOT_COLORS } from '../types';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import { computeProjectFinancials } from '../utils/calculations';
import { formatCurrency, formatShortDate } from '../utils/format';
import { CustomSelect } from '../components/ui/CustomSelect';

export const PipelinePage: React.FC = () => {
  const projects = usePhotoFlowStore((s) => s.projects);
  const payments = usePhotoFlowStore((s) => s.payments);
  const settings = usePhotoFlowStore((s) => s.settings);
  const setSelectedProjectId = usePhotoFlowStore((s) => s.setSelectedProjectId);
  const openNewProjectWizard = usePhotoFlowStore((s) => s.openNewProjectWizard);
  const updateProjectStatus = usePhotoFlowStore((s) => s.updateProjectStatus);

  const [stageFilter, setStageFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (stageFilter !== 'ALL' && p.status !== stageFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.projectName.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.serviceType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [projects, stageFilter, searchQuery]);

  const filterOptions = [
    { value: 'ALL', label: 'All stages' },
    ...PIPELINE_STAGES.map((stage) => ({
      value: stage,
      label: stage,
      dotColor: STAGE_DOT_COLORS[stage],
    })),
  ];

  const stageSelectOptions = PIPELINE_STAGES.map((stage) => ({
    value: stage,
    label: stage,
    dotColor: STAGE_DOT_COLORS[stage],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Kanban className="w-5 h-5 text-black" />
          <h1 className="text-2xl font-semibold tracking-tight text-black">Pipeline</h1>
        </div>

        <button
          type="button"
          onClick={openNewProjectWizard}
          className="h-8 px-3 rounded-md bg-black hover:bg-neutral-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New project</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-row items-center gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter projects..."
            className="w-full h-8 pl-8 pr-3 rounded-md bg-neutral-50 border border-neutral-200 text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:bg-white focus:border-black"
          />
        </div>

        <div className="w-40 sm:w-44 shrink-0">
          <CustomSelect
            size="sm"
            value={stageFilter}
            onChange={(val) => setStageFilter(val as ProjectStatus | 'ALL')}
            options={filterOptions}
            align="right"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="py-16 text-center border-t border-neutral-100">
          <p className="text-sm text-neutral-400">No projects found</p>
        </div>
      ) : (
        /* Flat List View — state is always on the right side on both mobile and desktop */
        <div className="divide-y divide-neutral-100 border-t border-neutral-200">
          <div className="hidden md:grid md:grid-cols-12 gap-4 py-2 text-[11px] text-neutral-400 px-1">
            <div className="col-span-4">Project</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-2">Shoot date</div>
            <div className="col-span-2">Stage</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>

          {filteredProjects.map((project) => {
            const fin = computeProjectFinancials(project, payments);
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="py-3 px-1 flex items-center justify-between gap-3 md:grid md:grid-cols-12 md:gap-4 hover:bg-neutral-50/80 transition-colors cursor-pointer"
              >
                {/* Project Name & Mobile Details (truncated with ... on mobile so stage stays on right) */}
                <div className="flex-1 min-w-0 md:col-span-4">
                  <p className="text-sm font-medium text-black truncate">
                    {project.projectName}
                  </p>
                  <p className="text-xs text-neutral-400 md:hidden truncate mt-0.5">
                    {project.clientName || project.serviceType} · {formatShortDate(project.shootDate)} ·{' '}
                    {formatCurrency(project.quotedAmount, settings.currency)}
                  </p>
                </div>

                <div className="hidden md:block col-span-2 text-xs text-neutral-600 truncate">
                  {project.clientName || '—'}
                </div>

                <div className="hidden md:block col-span-2 text-xs text-neutral-500 tabular-nums">
                  {formatShortDate(project.shootDate)}
                </div>

                {/* Stage Select — Right side on mobile, column on desktop */}
                <div
                  className="w-36 sm:w-40 md:w-auto shrink-0 md:col-span-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CustomSelect
                    size="sm"
                    value={project.status}
                    onChange={(val) => updateProjectStatus(project.id, val as ProjectStatus)}
                    options={stageSelectOptions}
                    align="right"
                  />
                </div>

                <div className="hidden md:block col-span-2 text-right tabular-nums">
                  <span className="text-sm font-medium text-black">
                    {formatCurrency(project.quotedAmount, settings.currency)}
                  </span>
                  {fin.calculatedRemaining > 0 && (
                    <span className="block text-[11px] text-amber-600">
                      {formatCurrency(fin.calculatedRemaining, settings.currency)} due
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
