import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Circle,
  Wallet,
  Clock,
  Camera,
  Sliders,
  AlertCircle,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { CurrencyCode, STAGE_DOT_COLORS } from '../types';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import {
  computeAttentionItems,
  computeDashboardKpis,
} from '../utils/calculations';
import {
  formatCurrency,
  formatShortDate,
  todayIsoDate,
} from '../utils/format';

interface AnimatedNumberProps {
  value: number;
  currency?: CurrencyCode;
  durationMs?: number;
}

/**
 * Animates only the whole number part from 0 to target so decimals never flicker or animate.
 */
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  currency,
  durationMs = 850,
}) => {
  const [displayInt, setDisplayInt] = useState(0);

  const safeTarget = Number.isFinite(value) ? value : 0;
  const sign = safeTarget < 0 ? -1 : 1;
  const absTarget = Math.abs(safeTarget);
  const targetInt = Math.floor(absTarget);
  const staticDecimalPart = Math.round((absTarget - targetInt) * 100) / 100;

  useEffect(() => {
    let rafId = 0;
    const startTime = performance.now();
    setDisplayInt(0);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentInt = Math.round(targetInt * eased);
      setDisplayInt(progress >= 1 ? targetInt : currentInt);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [targetInt, durationMs]);

  const combinedValue = sign * (displayInt + staticDecimalPart);

  if (currency) {
    return <>{formatCurrency(combinedValue, currency)}</>;
  }
  return <>{displayInt}</>;
};

export const DashboardPage: React.FC = () => {
  const projects = usePhotoFlowStore((s) => s.projects);
  const tasks = usePhotoFlowStore((s) => s.tasks);
  const payments = usePhotoFlowStore((s) => s.payments);
  const settings = usePhotoFlowStore((s) => s.settings);

  const setSelectedProjectId = usePhotoFlowStore((s) => s.setSelectedProjectId);
  const setCurrentPage = usePhotoFlowStore((s) => s.setCurrentPage);
  const toggleTaskStatus = usePhotoFlowStore((s) => s.toggleTaskStatus);

  const kpis = useMemo(
    () => computeDashboardKpis(projects, payments),
    [projects, payments]
  );

  const attention = useMemo(
    () => computeAttentionItems(projects, tasks, todayIsoDate()),
    [projects, tasks]
  );

  const upcomingShoots = useMemo(
    () =>
      projects
        .filter((p) => p.shootDate && p.shootDate >= todayIsoDate())
        .sort((a, b) => a.shootDate.localeCompare(b.shootDate))
        .slice(0, 6),
    [projects]
  );

  const totalAttentionCount =
    attention.todaysShoots.length +
    attention.galleryDeadlines.length +
    attention.overdueTasks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="space-y-8 sm:space-y-12"
    >
      {/* Compact Single-Line Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-black">
          Home
        </h1>
        <span className="text-xs text-neutral-400 tabular-nums">
          {formatShortDate(todayIsoDate())}
        </span>
      </div>

      {/* Borderless Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Cleared Revenue */}
        <motion.button
          type="button"
          onClick={() => setCurrentPage('payments')}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.02 }}
          className="group text-left py-1 flex flex-col justify-between gap-2.5 hover:opacity-75 transition-opacity cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-neutral-500 truncate">
              Cleared revenue
            </span>
            <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-black shrink-0 stroke-[1.75]" />
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black tabular-nums truncate">
            <AnimatedNumber
              value={kpis.clearedRevenue}
              currency={settings.currency}
            />
          </p>
        </motion.button>

        {/* Outstanding */}
        <motion.button
          type="button"
          onClick={() => setCurrentPage('payments')}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="group text-left py-1 flex flex-col justify-between gap-2.5 hover:opacity-75 transition-opacity cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-neutral-500 truncate">
              Outstanding
            </span>
            <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-black shrink-0 stroke-[1.75]" />
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black tabular-nums truncate">
            <AnimatedNumber
              value={kpis.outstanding}
              currency={settings.currency}
            />
          </p>
        </motion.button>

        {/* Upcoming Shoots */}
        <motion.button
          type="button"
          onClick={() => setCurrentPage('calendar')}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          className="group text-left py-1 flex flex-col justify-between gap-2.5 hover:opacity-75 transition-opacity cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-neutral-500 truncate">
              Upcoming shoots
            </span>
            <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-black shrink-0 stroke-[1.75]" />
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black tabular-nums">
            <AnimatedNumber value={kpis.upcomingShoots} />
          </p>
        </motion.button>

        {/* In Editing */}
        <motion.button
          type="button"
          onClick={() => setCurrentPage('pipeline')}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.11 }}
          className="group text-left py-1 flex flex-col justify-between gap-2.5 hover:opacity-75 transition-opacity cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-neutral-500 truncate">
              In editing
            </span>
            <Sliders className="w-6 h-6 sm:w-7 sm:h-7 text-black shrink-0 stroke-[1.75]" />
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-black tabular-nums">
            <AnimatedNumber value={kpis.inEditing} />
          </p>
        </motion.button>
      </div>

      {/* Two-Stream Layout: Needs Attention & Upcoming Shoots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-14">
        {/* Stream 1: Needs Attention */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.14 }}
          className="flex flex-col"
        >
          <button
            type="button"
            onClick={() => setCurrentPage('tasks')}
            className="group w-full flex items-center justify-between pb-3 text-left hover:opacity-75 transition-opacity cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-6 h-6 text-black shrink-0 stroke-[1.75]" />
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-black">
                Needs attention
              </h2>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
            </div>
            <span
              className={`text-xs font-semibold tabular-nums ${
                totalAttentionCount > 0 ? 'text-amber-600' : 'text-neutral-400'
              }`}
            >
              {totalAttentionCount}
            </span>
          </button>

          {totalAttentionCount === 0 ? (
            <div className="py-6 flex items-center gap-3 text-neutral-400">
              <CheckCircle2 className="w-6 h-6 text-neutral-300 shrink-0 stroke-[1.75]" />
              <p className="text-xs sm:text-sm text-neutral-400">
                Everything is on track today
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {attention.todaysShoots.map((proj) => (
                <button
                  key={`shoot-${proj.id}`}
                  type="button"
                  onClick={() => setSelectedProjectId(proj.id)}
                  className="w-full py-2.5 flex items-center justify-between gap-4 hover:opacity-75 transition-opacity text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {proj.projectName}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {proj.clientName || proj.serviceType}
                        {proj.shootTime ? ` · ${proj.shootTime}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 shrink-0">
                    Shoot today
                  </span>
                </button>
              ))}

              {attention.galleryDeadlines.map((proj) => (
                <button
                  key={`gal-${proj.id}`}
                  type="button"
                  onClick={() => setSelectedProjectId(proj.id)}
                  className="w-full py-2.5 flex items-center justify-between gap-4 hover:opacity-75 transition-opacity text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {proj.projectName}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        Gallery delivery
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-amber-600 shrink-0 tabular-nums">
                    Due {formatShortDate(proj.galleryDue)}
                  </span>
                </button>
              ))}

              {attention.overdueTasks.slice(0, 5).map((t) => (
                <div
                  key={`task-${t.id}`}
                  onClick={() => {
                    if (t.projectId) {
                      setSelectedProjectId(t.projectId);
                    } else {
                      setCurrentPage('tasks');
                    }
                  }}
                  className="py-2.5 flex items-center justify-between gap-4 hover:opacity-75 transition-opacity cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskStatus(t.id);
                      }}
                      className="shrink-0 cursor-pointer"
                      aria-label="Complete task"
                    >
                      <Circle className="w-4 h-4 text-red-500 hover:text-black transition-colors" />
                    </button>
                    <span className="text-sm font-medium text-black truncate">
                      {t.title}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-red-600 shrink-0 tabular-nums">
                    Due {formatShortDate(t.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Stream 2: Upcoming Shoots */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.18 }}
          className="flex flex-col"
        >
          <button
            type="button"
            onClick={() => setCurrentPage('calendar')}
            className="group w-full flex items-center justify-between pb-3 text-left hover:opacity-75 transition-opacity cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-black shrink-0 stroke-[1.75]" />
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-black">
                Upcoming shoots
              </h2>
              <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
            </div>
            <span className="text-xs font-semibold text-neutral-400 tabular-nums">
              {upcomingShoots.length}
            </span>
          </button>

          {upcomingShoots.length === 0 ? (
            <div className="py-6 flex items-center gap-3 text-neutral-400">
              <Camera className="w-6 h-6 text-neutral-300 shrink-0 stroke-[1.75]" />
              <p className="text-xs sm:text-sm text-neutral-400">
                No upcoming shoots scheduled
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {upcomingShoots.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setSelectedProjectId(proj.id)}
                  className="w-full py-2.5 flex items-center justify-between gap-4 hover:opacity-75 text-left transition-opacity cursor-pointer"
                >
                  {/* Left Tabular Date & Time Column for Instant Visual Scanning */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-14 shrink-0">
                      <p className="text-xs font-semibold text-black tabular-nums leading-tight">
                        {formatShortDate(proj.shootDate)}
                      </p>
                      <p className="text-[11px] text-neutral-400 tabular-nums leading-tight mt-0.5">
                        {proj.shootTime || 'All day'}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {proj.projectName}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {proj.clientName || proj.serviceType}
                        {proj.location ? ` · ${proj.location}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right Stage Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: STAGE_DOT_COLORS[proj.status] }}
                    />
                    <span className="text-xs text-neutral-500 hidden sm:inline">
                      {proj.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
};
