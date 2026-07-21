import { NavLink, useLocation } from 'react-router-dom';
import { format, addMonths } from 'date-fns';
import { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import ConvoysModal from './ConvoysModal';

function Header() {
  const location = useLocation();
  const [showConvoysModal, setShowConvoysModal] = useState(false);
  const { 
    kpi, monthKpi, yearKpi,
    weekDays, weekOffset, changeWeek, 
    holidayYear, changeHolidayYearWithKpi, 
    planMonthOffset, changePlanMonth,
    fetchMonthKpi, fetchYearKpi,
    logout
  } = useStore();

  // Fetch appropriate KPI when route changes
  useEffect(() => {
    if (location.pathname === '/plan') {
      fetchMonthKpi(planMonthOffset);
    } else if (location.pathname === '/holidays') {
      fetchYearKpi(holidayYear);
    }
  }, [location.pathname]);

  // Get current KPI based on route
  const getCurrentKpi = () => {
    if (location.pathname === '/plan') return monthKpi;
    if (location.pathname === '/holidays') return yearKpi;
    return kpi;
  };

  const currentKpi = getCurrentKpi();

  const getNavigation = () => {
    if (location.pathname === '/') {
      const weekLabel = weekDays.length > 0 
        ? `${weekDays[0].display} — ${weekDays[weekDays.length - 1].display}`
        : 'Loading...';
      
      return (
        <div className="flex items-center gap-4">
          <button 
            onClick={() => changeWeek(-1)}
            className="bg-primary-blue text-white px-5 py-2 rounded font-semibold text-sm hover:bg-slate-600 transition"
          >
            ◀ Previous
          </button>
          <span className="text-white font-semibold text-sm min-w-[200px] text-center">
            {weekLabel}
          </span>
          <button 
            onClick={() => changeWeek(1)}
            className="bg-primary-blue text-white px-5 py-2 rounded font-semibold text-sm hover:bg-slate-600 transition"
          >
            Next ▶
          </button>
        </div>
      );
    }
    
    if (location.pathname === '/plan') {
      const targetDate = addMonths(new Date(), planMonthOffset);
      const monthLabel = format(targetDate, 'MMMM yyyy');
      
      return (
        <div className="flex items-center gap-4">
          <button 
            onClick={() => changePlanMonth(-1)}
            className="bg-primary-blue text-white px-5 py-2 rounded font-semibold text-sm hover:bg-slate-600 transition"
          >
            ◀ Previous
          </button>
          <span className="text-white font-semibold text-sm min-w-[150px] text-center">
            {monthLabel}
          </span>
          <button 
            onClick={() => changePlanMonth(1)}
            className="bg-primary-blue text-white px-5 py-2 rounded font-semibold text-sm hover:bg-slate-600 transition"
          >
            Next ▶
          </button>
        </div>
      );
    }
    
    if (location.pathname === '/holidays') {
      return (
        <div className="flex items-center gap-4">
          <button 
            onClick={() => changeHolidayYearWithKpi(-1)}
            className="bg-primary-blue text-white px-5 py-2 rounded font-semibold text-sm hover:bg-slate-600 transition"
          >
            ◀ Previous
          </button>
          <span className="text-white font-semibold text-sm min-w-[100px] text-center">
            {holidayYear}
          </span>
          <button 
            onClick={() => changeHolidayYearWithKpi(1)}
            className="bg-primary-blue text-white px-5 py-2 rounded font-semibold text-sm hover:bg-slate-600 transition"
          >
            Next ▶
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <header className="bg-primary-dark min-h-16 px-3 md:px-8 py-2 md:py-0 flex flex-col md:flex-row items-center md:justify-between gap-3 md:gap-0 border-b-[3px] border-accent-gold">
      {/* Logo Section */}
      <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center">
        <img src="https://forklift.olt.mn/logo.png" alt="OT Logistic" className="w-10 h-10 md:w-14 md:h-14 rounded object-contain" />
        <div className="text-white text-lg md:text-xl font-bold tracking-tight">
          OT <span className="text-accent-gold">Logistic</span>
        </div>
        <div className="hidden lg:block text-gray-400 text-xs font-medium uppercase tracking-wider ml-5 pl-5 border-l border-slate-600">
          Logistics Management System
        </div>
        
        {/* Navigation Tabs */}
        <nav className="flex gap-1 md:ml-6 md:pl-6 md:border-l border-slate-600">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded text-xs font-semibold transition border ${
                isActive
                  ? 'bg-accent-gold border-accent-gold text-primary-dark'
                  : 'bg-transparent border-slate-600 text-gray-400 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            Weekly
          </NavLink>
          <NavLink
            to="/plan"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded text-xs font-semibold transition border ${
                isActive
                  ? 'bg-accent-gold border-accent-gold text-primary-dark'
                  : 'bg-transparent border-slate-600 text-gray-400 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            📋 Plan
          </NavLink>
          <NavLink
            to="/holidays"
            className={({ isActive }) =>
              `px-4 py-1.5 rounded text-xs font-semibold transition border ${
                isActive
                  ? 'bg-accent-gold border-accent-gold text-primary-dark'
                  : 'bg-transparent border-slate-600 text-gray-400 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            🎉 Holidays
          </NavLink>
        </nav>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 md:gap-6 flex-wrap justify-center">
        {/* KPIs */}
        <div className="flex items-center gap-4 md:mr-8 md:pr-8 md:border-r border-slate-600">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-accent-gold">{currentKpi.total}</span>
            <span className="text-[9px] text-gray-400 uppercase tracking-wide">Dispatched</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-green-500">{currentKpi.returned}</span>
            <span className="text-[9px] text-gray-400 uppercase tracking-wide">Returned</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-bold text-white">{currentKpi.avgHours}</span>
            <span className="text-[9px] text-gray-400 uppercase tracking-wide">Avg Hrs</span>
          </div>
        </div>

        {/* Navigation Controls */}
        {getNavigation()}

        {/* Config Button */}
        <button
          onClick={() => setShowConvoysModal(true)}
          className="ml-4 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded border border-slate-600 hover:border-slate-500 transition uppercase tracking-wide"
        >
          ⚙ Config
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded border border-slate-600 hover:border-slate-500 transition uppercase tracking-wide"
        >
          Logout
        </button>
      </div>

      {/* Convoys Modal */}
      {showConvoysModal && <ConvoysModal onClose={() => setShowConvoysModal(false)} />}
    </header>
  );
}

export default Header;
