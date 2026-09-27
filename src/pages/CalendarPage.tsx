import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Camera,
  Sliders,
  Image,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { CalendarEventItem } from '../types';
import { usePhotoFlowStore } from '../stores/usePhotoFlowStore';
import { buildCalendarEvents } from '../utils/calculations';
import { formatShortDate, todayIsoDate } from '../utils/format';

export const CalendarPage: React.FC = () => {
  const projects = usePhotoFlowStore((s) => s.projects);
  const tasks = usePhotoFlowStore((s) => s.tasks);
  const calendarMonth = usePhotoFlowStore((s) => s.calendarMonth);
  const setCalendarMonth = usePhotoFlowStore((s) => s.setCalendarMonth);
  const selectedCalendarDate = usePhotoFlowStore((s) => s.selectedCalendarDate);
  const setSelectedCalendarDate = usePhotoFlowStore((s) => s.setSelectedCalendarDate);
  const setSelectedProjectId = usePhotoFlowStore((s) => s.setSelectedProjectId);
  const toggleTaskStatus = usePhotoFlowStore((s) => s.toggleTaskStatus);

  const [datePopupOpen, setDatePopupOpen] = useState(false);

  const allEvents = useMemo(
    () => buildCalendarEvents(projects, tasks),
    [projects, tasks]
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEventItem[]> = {};
    for (const ev of allEvents) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [allEvents]);

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    // Shift weekday index so Monday = 0, Tuesday = 1, ..., Sunday = 6
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ dateIso: string; dayNumber: number; inCurrentMonth: boolean }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      cells.push({
        dateIso: `${y}-${m}-${dayStr}`,
        dayNumber: d.getDate(),
        inCurrentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      cells.push({
        dateIso: `${y}-${m}-${dayStr}`,
        dayNumber: day,
        inCurrentMonth: true,
      });
    }

    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      cells.push({
        dateIso: `${y}-${m}-${dayStr}`,
        dayNumber: day,
        inCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month]);

  const monthTitle = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const selectedDayEvents = eventsByDate[selectedCalendarDate] || [];
  const today = todayIsoDate();

  const handleDateClick = (dateIso: string) => {
    setSelectedCalendarDate(dateIso);
    setDatePopupOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-6 h-6 text-black stroke-[1.75]" />
          <h1 className="text-2xl font-semibold tracking-tight text-black">{monthTitle}</h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
            className="p-1.5 rounded-md text-neutral-500 hover:text-black hover:bg-neutral-100 cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const now = new Date();
              setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelectedCalendarDate(todayIsoDate());
            }}
            className="px-2.5 py-1 rounded-md text-xs text-neutral-600 hover:text-black hover:bg-neutral-100 cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
            className="p-1.5 rounded-md text-neutral-500 hover:text-black hover:bg-neutral-100 cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Apple Calendar Style Grid — Week Starts on Monday */}
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-7 pb-3 border-b border-neutral-100">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-neutral-400"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-3 sm:gap-y-4 pt-4">
          {calendarDays.map((cell) => {
            const dayEvents = eventsByDate[cell.dateIso] || [];
            const hasActivity = dayEvents.length > 0;
            const isToday = cell.dateIso === today;

            return (
              <div
                key={cell.dateIso}
                className="flex items-center justify-center py-1"
              >
                <button
                  type="button"
                  onClick={() => handleDateClick(cell.dateIso)}
                  className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border inline-flex items-center justify-center text-sm tabular-nums transition-all cursor-pointer ${
                    isToday
                      ? 'bg-black text-white border-black font-semibold shadow-xs'
                      : cell.inCurrentMonth
                        ? 'bg-white text-black border-neutral-200 hover:border-black hover:bg-neutral-50'
                        : 'bg-white text-neutral-300 border-neutral-100 hover:border-neutral-300'
                  }`}
                >
                  <span>{cell.dayNumber}</span>

                  {/* Single dot at top-right of the circle when the date has tasks/events */}
                  {hasActivity && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                      aria-label={`${dayEvents.length} scheduled`}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Info Popup (opens when clicking on a date, closes only via close button) */}
      {datePopupOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-black" />
                <h2 className="text-sm font-semibold text-black">
                  {formatShortDate(selectedCalendarDate)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDatePopupOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto">
              {selectedDayEvents.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center">
                  Nothing scheduled for this date
                </p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {selectedDayEvents.map((ev) => {
                    const isTask = ev.type === 'task';
                    const taskObj = isTask ? tasks.find((t) => t.id === ev.taskId) : undefined;
                    const taskDone = taskObj?.status === 'Done';

                    return (
                      <div
                        key={ev.id}
                        onClick={() => {
                          if (ev.projectId) {
                            setDatePopupOpen(false);
                            setSelectedProjectId(ev.projectId);
                          }
                        }}
                        className={`py-2.5 flex items-center justify-between gap-3 text-sm ${
                          ev.projectId ? 'hover:bg-neutral-50 cursor-pointer px-2 rounded-lg' : 'px-1'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isTask && taskObj ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskStatus(taskObj.id);
                              }}
                              className="shrink-0 cursor-pointer"
                              aria-label={taskDone ? 'Mark undone' : 'Mark done'}
                            >
                              {taskDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Circle className="w-4 h-4 text-neutral-300 hover:text-black transition-colors" />
                              )}
                            </button>
                          ) : ev.type === 'shoot' ? (
                            <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : ev.type === 'editing' ? (
                            <Sliders className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <Image className="w-4 h-4 text-purple-600 shrink-0" />
                          )}

                          <span
                            className={`truncate ${
                              taskDone ? 'line-through text-neutral-400' : 'text-black font-medium'
                            }`}
                          >
                            {ev.title}
                          </span>
                        </div>

                        <span className="text-xs text-neutral-400 capitalize shrink-0">
                          {ev.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
