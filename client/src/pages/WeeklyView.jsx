import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import DayColumn from '../components/DayColumn';
import Sidebar from '../components/Sidebar';

function WeeklyView() {
  const { weekDays, dispatches, plans, fetchWeekData, fetchConvoys, fetchShifts, loading } = useStore();
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    fetchConvoys();
    fetchShifts();
    fetchWeekData();
  }, []);

  useEffect(() => {
    if (selectedDay > weekDays.length - 1) setSelectedDay(0);
  }, [weekDays.length]);

  if (loading && weekDays.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const activeDay = weekDays[selectedDay];

  return (
    <div className="flex flex-col md:flex-row gap-0">
      {/* Main Board */}
      <div className="flex-1 overflow-x-auto pt-4 md:pt-6 px-3 md:pr-4 md:pl-8 pb-6">
        {/* Desktop: full week grid */}
        <div className="hidden md:grid grid-cols-6 gap-2 pb-[50px]">
          {weekDays.map((day) => (
            <DayColumn
              key={day.dateKey}
              dateKey={day.dateKey}
              display={day.display}
              dispatch={dispatches[day.dateKey]}
              dailyPlan={plans[day.dateKey]}
            />
          ))}
        </div>

        {/* Mobile: one day at a time */}
        <div className="md:hidden pb-[50px]">
          <div className="flex items-center justify-between mb-3 bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
            <button
              onClick={() => setSelectedDay((d) => Math.max(0, d - 1))}
              disabled={selectedDay === 0}
              className="px-3 py-2 rounded bg-primary-blue text-white font-semibold disabled:opacity-30"
              aria-label="Previous day"
            >
              ◀
            </button>
            <div className="flex flex-col items-center">
              <span className="font-bold text-sm text-primary-dark">{activeDay?.display || '—'}</span>
              {weekDays.length > 0 && (
                <span className="text-[10px] text-gray-400">Day {selectedDay + 1} of {weekDays.length}</span>
              )}
            </div>
            <button
              onClick={() => setSelectedDay((d) => Math.min(weekDays.length - 1, d + 1))}
              disabled={selectedDay >= weekDays.length - 1}
              className="px-3 py-2 rounded bg-primary-blue text-white font-semibold disabled:opacity-30"
              aria-label="Next day"
            >
              ▶
            </button>
          </div>
          {activeDay && (
            <DayColumn
              key={activeDay.dateKey}
              dateKey={activeDay.dateKey}
              display={activeDay.display}
              dispatch={dispatches[activeDay.dateKey]}
              dailyPlan={plans[activeDay.dateKey]}
            />
          )}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar />
    </div>
  );
}

export default WeeklyView;
