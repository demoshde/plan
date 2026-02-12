import { useEffect, useState } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSunday, isToday, getDay, isSaturday, getWeek } from 'date-fns';
import useStore from '../store/useStore';
import { dispatchApi, planApi, incidentApi, holidayApi } from '../services/api';

function PlanView() {
  const { planMonthOffset } = useStore();
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [dailyPlans, setDailyPlans] = useState({});
  const [actualData, setActualData] = useState({});
  const [kpi, setKpi] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [loading, setLoading] = useState(true);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ date: '', description: '', details: '' });
  const [editingIncident, setEditingIncident] = useState(null);

  const targetDate = addMonths(new Date(), planMonthOffset);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  // Calculate visible calendar range (including padding days from other months)
  const getVisibleDateRange = () => {
    const firstDay = getDay(monthStart); // 0=Sun, 1=Mon, ..., 6=Sat
    const adjustedFirstDay = (firstDay + 1) % 7; // Convert to Saturday-start
    
    // Days from previous month
    const prevMonthDays = adjustedFirstDay;
    const visibleStart = new Date(monthStart);
    visibleStart.setDate(visibleStart.getDate() - prevMonthDays);
    
    // Days remaining after current month to fill week
    const daysInMonth = monthEnd.getDate();
    const totalDaysSoFar = prevMonthDays + daysInMonth;
    const remainingDays = totalDaysSoFar % 7 === 0 ? 0 : 7 - (totalDaysSoFar % 7);
    const visibleEnd = new Date(monthEnd);
    visibleEnd.setDate(visibleEnd.getDate() + remainingDays);
    
    return { visibleStart, visibleEnd };
  };

  useEffect(() => {
    fetchMonthData();
  }, [planMonthOffset]);

  const fetchMonthData = async () => {
    setLoading(true);
    try {
      const { visibleStart, visibleEnd } = getVisibleDateRange();
      const startDate = format(visibleStart, 'yyyy-MM-dd');
      const endDate = format(visibleEnd, 'yyyy-MM-dd');

      const [plansRes, targetRes, dispatchRes, incidentsRes, holidaysRes] = await Promise.all([
        planApi.getByRange(startDate, endDate),
        planApi.getMonthlyTarget(year, month),
        dispatchApi.getByRange(startDate, endDate),
        incidentApi.getByMonth(year, month),
        holidayApi.getByYear(year)
      ]);

      // Process daily plans
      const plans = {};
      const plansData = Array.isArray(plansRes.data) ? plansRes.data : [];
      plansData.forEach(p => {
        plans[p.date] = p.targetCount;
      });
      setDailyPlans(plans);
      setMonthlyTarget(targetRes.data.monthlyTarget || 0);

      // Process actual dispatch data
      const actuals = {};
      let total = 0, returned = 0, totalMinutes = 0, tripsWithTime = 0, overtime = 0;
      let sgc = 0, kbtl = 0, te = 0;
      let peakDay = 0;

      dispatchRes.data.forEach(d => {
        const dayCount = d.rows.filter(r => r.convoyName).length;
        actuals[d.date] = dayCount;
        
        // Check if date belongs to current month using string comparison
        const [dispatchYear, dispatchMonth] = d.date.split('-').map(Number);
        const isCurrentMonth = dispatchYear === year && dispatchMonth === month;
        
        if (isCurrentMonth && dayCount > peakDay) peakDay = dayCount;
        
        d.rows.forEach(row => {
          if (row.convoyName) {
            // Only count in KPI totals if in current month
            if (isCurrentMonth) {
              total++;
              if (row.returned) returned++;
              if (row.convoyName.includes('SGC')) sgc++;
              else if (row.convoyName.includes('KBTL')) kbtl++;
              else if (row.convoyName.includes('TE')) te++;
            }
            
            if (row.startTime && row.endTime && isCurrentMonth) {
              const [h1, m1] = row.startTime.split(':').map(Number);
              const [h2, m2] = row.endTime.split(':').map(Number);
              let startMin = h1 * 60 + m1;
              let endMin = h2 * 60 + m2;
              if (endMin < startMin) endMin += 24 * 60;
              const diff = endMin - startMin;
              totalMinutes += diff;
              tripsWithTime++;
              if (diff > 12 * 60) overtime++;
            }
          }
        });
      });

      setActualData(actuals);
      
      const avgMinutes = tripsWithTime > 0 ? Math.round(totalMinutes / tripsWithTime) : 0;
      const avgH = Math.floor(avgMinutes / 60);
      const avgM = avgMinutes % 60;
      
      const daysInMonth = monthEnd.getDate();
      const today = new Date();
      const daysLeft = today.getMonth() === targetDate.getMonth() && today.getFullYear() === targetDate.getFullYear()
        ? daysInMonth - today.getDate()
        : daysInMonth;

      // Count days with actuals in current month only
      const daysWithActuals = Object.keys(actuals).filter(dateKey => {
        const [yr, mo] = dateKey.split('-').map(Number);
        return yr === year && mo === month && actuals[dateKey] > 0;
      }).length;

      setKpi({
        total,
        returned,
        pending: total - returned,
        avgHours: `${avgH}:${avgM.toString().padStart(2, '0')}`,
        overtime,
        sgc,
        kbtl,
        te,
        peakDay,
        dailyAvg: daysWithActuals > 0 ? Math.round(total / daysWithActuals) : 0,
        daysLeft
      });

      setIncidents(incidentsRes.data);

      // Process holidays
      const holidayMap = {};
      holidaysRes.data.forEach(h => {
        holidayMap[h.date] = h;
      });
      setHolidays(holidayMap);

    } catch (error) {
      console.error('Error fetching month data:', error);
    }
    setLoading(false);
  };

  const handleMonthlyTargetChange = async (value) => {
    setMonthlyTarget(value);
    await planApi.setMonthlyTarget(year, month, value);
  };

  const handleDailyPlanChange = async (date, value) => {
    setDailyPlans(prev => ({ ...prev, [date]: value }));
    await planApi.update(date, value);
  };

  const saveIncident = async () => {
    if (editingIncident) {
      await incidentApi.update(editingIncident._id, incidentForm);
    } else {
      await incidentApi.create(incidentForm);
    }
    setShowIncidentModal(false);
    setEditingIncident(null);
    setIncidentForm({ date: '', description: '', details: '' });
    fetchMonthData();
  };

  const deleteIncident = async (id) => {
    await incidentApi.delete(id);
    fetchMonthData();
  };

  // Generate calendar grid (Saturday start)
  const generateCalendarWeeks = () => {
    const daysInMonth = monthEnd.getDate();
    const firstDay = getDay(monthStart); // 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to Saturday-start: Sat=0, Sun=1, Mon=2, ..., Fri=6
    const adjustedFirstDay = (firstDay + 1) % 7;
    
    const weeks = [];
    let currentWeek = [];
    
    // Previous month days for padding
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      currentWeek.push({
        date: new Date(prevYear, prevMonth - 1, day),
        isOtherMonth: true,
        day
      });
    }
    
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      currentWeek.push({
        date: new Date(year, month - 1, d),
        isOtherMonth: false,
        day: d
      });
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Next month padding
    if (currentWeek.length > 0) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      let nextDay = 1;
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(nextYear, nextMonth - 1, nextDay),
          isOtherMonth: true,
          day: nextDay
        });
        nextDay++;
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const weeks = generateCalendarWeeks();

  // Incidents map by date
  const incidentMap = {};
  incidents.forEach(inc => {
    if (!incidentMap[inc.date]) incidentMap[inc.date] = [];
    incidentMap[inc.date].push(inc);
  });

  const completion = monthlyTarget > 0 ? Math.round((kpi.total / monthlyTarget) * 100) : 0;
  const diff = kpi.total - monthlyTarget;

  return (
    <div className="p-3">
      <div className="grid gap-3" style={{ gridTemplateColumns: '280px 1fr 240px' }}>
        {/* Left Panel - KPIs */}
        <div className="flex flex-col gap-3.5">
          {/* Hero KPI Card */}
          <div className="rounded-2xl p-5 text-white shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
            <div className="absolute -top-1/2 -right-1/2 w-full h-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />
            
            <div className="flex items-center justify-center gap-6 relative z-10">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider opacity-80">🎯 Target</span>
                <input
                  type="number"
                  value={monthlyTarget}
                  onChange={(e) => handleMonthlyTargetChange(parseInt(e.target.value) || 0)}
                  className="w-[100px] p-2.5 border-2 border-white/25 rounded-xl bg-white/10 text-[32px] font-extrabold text-white text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="w-0.5 h-[60px] bg-gradient-to-b from-transparent via-white/30 to-transparent" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider opacity-80">📦 Actual</span>
                <span className="text-[48px] font-extrabold leading-none" style={{ color: '#d4a843', textShadow: '0 2px 10px rgba(212,175,55,0.3)' }}>{kpi.total || 0}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
              <div className="h-2 bg-white/15 rounded overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded transition-all duration-500"
                  style={{ width: `${Math.min(completion, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-bold text-green-400">{completion}%</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${diff >= 0 ? 'bg-green-400 text-slate-900' : 'bg-red-400 text-white'}`}>
                  {diff >= 0 ? '+' : ''}{diff}
                </span>
              </div>
            </div>

            <div className="flex justify-around mt-4 pt-4 border-t border-white/10 relative z-10">
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">{kpi.dailyAvg || 0}</span>
                <span className="text-[9px] uppercase tracking-wide opacity-70">Daily Avg</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">{kpi.peakDay || 0}</span>
                <span className="text-[9px] uppercase tracking-wide opacity-70">Peak Day</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-bold">{kpi.daysLeft || 0}</span>
                <span className="text-[9px] uppercase tracking-wide opacity-70">Days Left</span>
              </div>
            </div>
          </div>

          {/* Performance Cards */}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">📊 Performance</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm border text-center">
              <div className="text-2xl font-bold text-green-500">{kpi.returned || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase">Returned</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border text-center">
              <div className="text-2xl font-bold text-purple-500">{kpi.pending || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase">Overnight</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border text-center">
              <div className="text-2xl font-bold text-blue-500">{kpi.avgHours || '0:00'}</div>
              <div className="text-[10px] text-gray-500 uppercase">Avg Duration</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border text-center">
              <div className="text-2xl font-bold text-red-500">{kpi.overtime || 0}</div>
              <div className="text-[10px] text-gray-500 uppercase">Overtime 12+</div>
            </div>
          </div>

          {/* Fleet Panel */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-3 font-semibold text-sm">
              🚚 Fleet Utilization
            </div>
            <div className="p-4 space-y-3">
              {[
                { name: 'SGC', color: '#00BFFF', count: kpi.sgc || 0 },
                { name: 'KBTL', color: '#FF6600', count: kpi.kbtl || 0 },
                { name: 'TE', color: '#FFD700', count: kpi.te || 0 }
              ].map(fleet => (
                <div key={fleet.name} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ background: fleet.color }} />
                  <span className="text-sm font-medium text-gray-700 flex-1">{fleet.name} Fleet</span>
                  <span className="font-bold" style={{ color: fleet.color }}>{fleet.count}</span>
                  <span className="text-xs text-gray-400">
                    {kpi.total > 0 ? Math.round((fleet.count / kpi.total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4 font-semibold flex justify-between items-center">
            <span>📅 {format(targetDate, 'MMMM yyyy')}</span>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Holiday
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Today
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-0 h-0 border-l-0 border-r-[10px] border-b-[10px] border-transparent border-r-red-600" /> Incident
              </span>
            </div>
          </div>

          <div className="p-0.5">
            {/* Week headers - Saturday start, no Sunday */}
            <div className="grid bg-gray-200" style={{ gridTemplateColumns: 'repeat(6, 1fr) 120px', gap: '2px', padding: '2px' }}>
              {['SAT', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'TOTAL'].map((day, i) => (
                <div 
                  key={day} 
                  className={`text-center py-3.5 font-bold text-xs uppercase tracking-wide ${
                    day === 'TOTAL' ? 'bg-emerald-800 text-white' : 
                    'bg-slate-800 text-white'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            {weeks.map((week, weekIdx) => {
              let weekPlan = 0;
              let weekActual = 0;
              // Track the Friday of this week for week number
              const fridayOfWeek = week.find(d => getDay(d.date) === 5);
              const weekNum = fridayOfWeek ? getWeek(fridayOfWeek.date, { weekStartsOn: 6 }) : weekIdx + 1;
              
              week.forEach(dayInfo => {
                if (dayInfo && !isSunday(dayInfo.date)) {
                  const dateKey = format(dayInfo.date, 'yyyy-MM-dd');
                  weekPlan += dailyPlans[dateKey] || 0;
                  weekActual += actualData[dateKey] || 0;
                }
              });

              return (
                <div key={weekIdx} className="grid bg-gray-200" style={{ gridTemplateColumns: 'repeat(6, 1fr) 120px', gap: '2px', padding: '0 2px 2px 2px' }}>
                  {week.filter(dayInfo => !isSunday(dayInfo.date)).map((dayInfo, dayIdx) => {
                    const dateKey = format(dayInfo.date, 'yyyy-MM-dd');
                    const isTodayDate = isToday(dayInfo.date);
                    const isSat = isSaturday(dayInfo.date);
                    const holiday = holidays[dateKey];
                    const actual = actualData[dateKey] || 0;
                    const plan = dailyPlans[dateKey] || 0;
                    const dayDiff = actual - plan;
                    const hasIncident = incidentMap[dateKey]?.length > 0;
                    const isDisabled = holiday;

                    return (
                      <div 
                        key={dayIdx}
                        className={`min-h-[150px] min-w-[150px] p-3 flex flex-col items-center justify-center relative transition-colors
                          ${dayInfo.isOtherMonth ? 'bg-slate-100' : 'bg-white'}
                          ${isSat && !dayInfo.isOtherMonth ? 'bg-blue-50' : ''}
                          ${holiday ? 'bg-gradient-to-br from-amber-100 to-amber-200' : ''}
                          ${isTodayDate ? 'bg-blue-100 ring-2 ring-blue-500' : ''}
                          ${!isDisabled && !dayInfo.isOtherMonth ? 'hover:bg-blue-50' : ''}
                        `}
                      >
                        {/* Incident triangle */}
                        {hasIncident && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-l-0 border-r-[20px] border-b-[20px] border-transparent border-r-red-600" />
                        )}

                        {/* Day number */}
                        <span className={`absolute top-2 right-2.5 text-sm font-semibold
                          ${dayInfo.isOtherMonth ? 'text-gray-400' : ''}
                          ${isSat && !dayInfo.isOtherMonth ? 'text-blue-500' : ''}
                          ${!isSat && !dayInfo.isOtherMonth ? 'text-gray-400' : ''}
                          ${isTodayDate ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' : ''}
                        `}>
                          {dayInfo.day}
                        </span>

                        {/* Holiday flag */}
                        {holiday && (
                          <span className="absolute top-1.5 left-2 text-2xl">{holiday.country}</span>
                        )}

                        {/* Plan input */}
                        {!isDisabled && (
                          <>
                            <input
                              type="number"
                              value={plan || ''}
                              onChange={(e) => handleDailyPlanChange(dateKey, parseInt(e.target.value) || 0)}
                              className="w-[70px] p-2.5 border-none bg-transparent text-center text-[28px] font-bold text-emerald-600 focus:outline-none focus:shadow-[0_0_0_2px_rgba(5,150,105,0.2)] rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-transparent"
                              min="0"
                              placeholder="—"
                            />
                            {!dayInfo.isOtherMonth && (plan > 0 || actual > 0) && (
                              <div className={`text-[10px] mt-1 ${dayDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                Actual: {actual} ({dayDiff >= 0 ? '+' : ''}{dayDiff})
                              </div>
                            )}
                          </>
                        )}
                        {holiday && (
                          <div className="text-[10px] bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-lg mt-1 truncate max-w-[90px] font-medium" title={holiday.name}>
                            {holiday.name}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Week total */}
                  <div className="bg-slate-50 min-h-[150px] py-2.5 px-2.5 flex flex-col items-center justify-center border-l border-slate-200">
                    <span className="text-[10px] bg-slate-700 text-white px-2 py-0.5 rounded font-semibold mb-2 uppercase tracking-wide">
                      Week {weekNum}
                    </span>
                    <div className="w-full space-y-1.5">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">Plan</span>
                        <span className="font-semibold text-slate-700 text-sm">{weekPlan}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">Actual</span>
                        <span className="font-semibold text-slate-700 text-sm">{weekActual}</span>
                      </div>
                      <div className="flex justify-between items-center pt-0.5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">Diff</span>
                        <span className={`font-semibold text-sm ${
                          weekActual - weekPlan >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {weekActual - weekPlan >= 0 ? '+' : ''}{weekActual - weekPlan}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incidents Panel */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden h-fit">
          <div className="bg-slate-800 text-white px-4 py-3 text-sm flex justify-between items-center">
            <span className="font-semibold uppercase tracking-wide text-xs">Incidents</span>
            <button 
              onClick={() => {
                setEditingIncident(null);
                setIncidentForm({ date: '', description: '', details: '' });
                setShowIncidentModal(true);
              }}
              className="text-[10px] bg-slate-600 px-2.5 py-1 rounded font-semibold hover:bg-slate-500 transition uppercase tracking-wide"
            >
              + Add
            </button>
          </div>
          <div>
            {incidents.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-6 uppercase tracking-wide">No incidents recorded</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {incidents.map(incident => (
                  <div key={incident._id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-medium w-[70px] shrink-0">{incident.date}</span>
                    <span className="text-xs text-slate-700 flex-1 truncate" title={incident.description}>{incident.description}</span>
                    <button 
                      onClick={() => {
                        setEditingIncident(incident);
                        setIncidentForm({ date: incident.date, description: incident.description, details: incident.details || '' });
                        setShowIncidentModal(true);
                      }}
                      className="text-slate-300 hover:text-blue-600 text-[10px] w-4 h-4 flex items-center justify-center"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button 
                      onClick={() => deleteIncident(incident._id)}
                      className="text-slate-300 hover:text-red-600 text-[10px] w-4 h-4 flex items-center justify-center"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowIncidentModal(false); setEditingIncident(null); }}>
          <div className="bg-white rounded-lg w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-800 text-white px-5 py-3.5 rounded-t-lg flex justify-between items-center">
              <span className="font-semibold text-sm uppercase tracking-wide">{editingIncident ? 'Edit Incident' : 'Add Incident'}</span>
              <button onClick={() => { setShowIncidentModal(false); setEditingIncident(null); }} className="text-xl opacity-70 hover:opacity-100">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Date</label>
                <input
                  type="date"
                  value={incidentForm.date}
                  onChange={(e) => setIncidentForm({ ...incidentForm, date: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Description</label>
                <input
                  type="text"
                  value={incidentForm.description}
                  onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                  placeholder="Brief summary..."
                  className="w-full p-2.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Details</label>
                <textarea
                  value={incidentForm.details}
                  onChange={(e) => setIncidentForm({ ...incidentForm, details: e.target.value })}
                  placeholder="Full details..."
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 bg-slate-50 rounded-b-lg flex justify-end gap-2">
              <button 
                onClick={() => { setShowIncidentModal(false); setEditingIncident(null); }}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-600 hover:bg-slate-100 uppercase tracking-wide"
              >
                Cancel
              </button>
              <button 
                onClick={saveIncident}
                className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700 uppercase tracking-wide transition"
              >
                {editingIncident ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanView;
