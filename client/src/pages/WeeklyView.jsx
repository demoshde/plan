import { useEffect } from 'react';
import useStore from '../store/useStore';
import DayColumn from '../components/DayColumn';
import Sidebar from '../components/Sidebar';

function WeeklyView() {
  const { weekDays, dispatches, plans, fetchWeekData, fetchConvoys, fetchShifts, loading } = useStore();

  useEffect(() => {
    fetchConvoys();
    fetchShifts();
    fetchWeekData();
  }, []);

  if (loading && weekDays.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-0">
      {/* Main Board */}
      <div className="flex-1 overflow-x-auto pt-6 pr-4 pb-6 pl-8">
        <div className="grid grid-cols-6 gap-2 pb-[50px]">
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
      </div>

      {/* Sidebar */}
      <Sidebar />
    </div>
  );
}

export default WeeklyView;
