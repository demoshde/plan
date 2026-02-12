import { useEffect, useState } from 'react';
import { format, eachMonthOfInterval, startOfYear, endOfYear, eachDayOfInterval, startOfMonth, endOfMonth, isSunday, getDay, isToday } from 'date-fns';
import useStore from '../store/useStore';

function HolidaysView() {
  const { holidays, holidayYear, fetchHolidays, addHoliday, deleteHoliday } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    country: '🇲🇳',
    startDate: '',
    endDate: '',
    isRange: false,
    name: ''
  });

  useEffect(() => {
    fetchHolidays(holidayYear);
  }, [holidayYear]);

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(holidayYear, 0, 1)),
    end: endOfYear(new Date(holidayYear, 0, 1))
  });

  const handleSubmit = async () => {
    await addHoliday({
      startDate: form.startDate,
      endDate: form.isRange ? form.endDate : form.startDate,
      name: form.name,
      country: form.country
    });
    setShowModal(false);
    setForm({ country: '🇲🇳', startDate: '', endDate: '', isRange: false, name: '' });
  };

  const holidayMap = {};
  holidays.forEach(h => {
    if (!holidayMap[h.date]) holidayMap[h.date] = [];
    holidayMap[h.date].push(h);
  });

  // Group holidays by country and then by name
  const byCountry = { '🇲🇳': {}, '🇨🇳': {} };
  holidays.forEach(h => {
    const flag = h.country || '🇲🇳';
    if (!byCountry[flag]) byCountry[flag] = {};
    if (!byCountry[flag][h.name]) {
      byCountry[flag][h.name] = { dates: [], ids: [] };
    }
    byCountry[flag][h.name].dates.push(h.date);
    byCountry[flag][h.name].ids.push(h._id);
  });

  // Calculate shipping days for a month
  const getShippingDays = (month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    let count = 0;
    days.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const isSun = isSunday(day);
      const isHoliday = holidayMap[dateKey];
      if (!isSun && !isHoliday) count++;
    });
    return count;
  };

  return (
    <div className="p-3">
      <div className="grid gap-3" style={{ gridTemplateColumns: '220px 1fr' }}>
        {/* Left Panel - Holiday List grouped by country */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-3 font-semibold text-sm flex justify-between items-center">
            <span>🎉 Holidays</span>
            <button 
              onClick={() => setShowModal(true)}
              className="text-xs bg-green-500 px-2.5 py-1 rounded font-semibold hover:bg-green-400 transition"
            >
              + Add
            </button>
          </div>
          <div className="p-3 max-h-[calc(100vh-160px)] overflow-y-auto">
            {/* Mongolia */}
            {Object.keys(byCountry['🇲🇳']).length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-2 pb-1.5 border-b-2 border-slate-800 flex items-center gap-1.5">
                  <span className="text-red-500">●</span> MONGOLIA
                </div>
                {Object.entries(byCountry['🇲🇳']).map(([name, data]) => {
                  const dates = data.dates.sort();
                  const startDate = dates[0];
                  const endDate = dates[dates.length - 1];
                  const dateDisplay = startDate === endDate 
                    ? format(new Date(startDate), 'MMM d')
                    : `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d')}`;

                  return (
                    <div key={name} className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-lg mb-1.5 hover:bg-gray-100">
                      <span className="text-xs font-semibold text-gray-500 min-w-[90px]">{dateDisplay}</span>
                      <span className="flex-1 text-sm text-gray-800">{name}</span>
                      <button 
                        onClick={() => data.ids.forEach(id => deleteHoliday(id))}
                        className="text-gray-300 hover:text-red-500 text-lg"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* China */}
            {Object.keys(byCountry['🇨🇳']).length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] font-bold text-red-700 uppercase tracking-wide mb-2 pb-1.5 border-b-2 border-red-700 flex items-center gap-1.5">
                  <span className="text-red-500">●</span> CHINA
                </div>
                {Object.entries(byCountry['🇨🇳']).map(([name, data]) => {
                  const dates = data.dates.sort();
                  const startDate = dates[0];
                  const endDate = dates[dates.length - 1];
                  const dateDisplay = startDate === endDate 
                    ? format(new Date(startDate), 'MMM d')
                    : `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d')}`;

                  return (
                    <div key={name} className="flex items-center gap-2.5 py-2 px-3 bg-gray-50 rounded-lg mb-1.5 hover:bg-gray-100">
                      <span className="text-xs font-semibold text-gray-500 min-w-[90px]">{dateDisplay}</span>
                      <span className="flex-1 text-sm text-gray-800">{name}</span>
                      <button 
                        onClick={() => data.ids.forEach(id => deleteHoliday(id))}
                        className="text-gray-300 hover:text-red-500 text-lg"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {Object.keys(byCountry['🇲🇳']).length === 0 && Object.keys(byCountry['🇨🇳']).length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No holidays added</p>
            )}
          </div>
        </div>

        {/* Year Calendar */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4 font-semibold">
            📅 Year Calendar {holidayYear}
          </div>
          <div className="p-4 grid grid-cols-4 gap-4">
            {months.map((month) => {
              const monthStart = startOfMonth(month);
              const monthEnd = endOfMonth(month);
              const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
              const firstDayOfWeek = getDay(monthStart);
              const startPadding = (firstDayOfWeek + 1) % 7;
              const shippingDays = getShippingDays(month);

              return (
                <div key={format(month, 'MM')} className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-100 py-2 px-3 flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-700">{format(month, 'MMM').toUpperCase()}</span>
                    <span className="text-[10px] font-semibold bg-blue-500 text-white px-2 py-0.5 rounded">{shippingDays} days</span>
                  </div>
                  <div className="p-2">
                    {/* Week headers - Saturday start */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {['S', 'S', 'M', 'T', 'W', 'T', 'F'].map((d, i) => (
                        <div key={i} className={`text-center text-[9px] font-bold ${i === 1 ? 'text-red-400' : 'text-gray-400'}`}>
                          {d}
                        </div>
                      ))}
                    </div>
                    {/* Days */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array(startPadding).fill(null).map((_, i) => (
                        <div key={`pad-${i}`} className="h-6" />
                      ))}
                      {days.map((day) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const isSun = isSunday(day);
                        const isTodayDate = isToday(day);
                        const holiday = holidayMap[dateKey]?.[0];
                        const isMongolia = holiday?.country === '🇲🇳';
                        const isChina = holiday?.country === '🇨🇳';

                        return (
                          <div
                            key={dateKey}
                            className={`h-6 flex items-center justify-center text-[11px] rounded relative
                              ${isSun && !holiday ? 'text-red-400' : ''}
                              ${!isSun && !holiday && !isTodayDate ? 'text-gray-600' : ''}
                              ${isTodayDate && !holiday ? 'bg-blue-500 text-white font-bold' : ''}
                              ${isMongolia ? 'bg-blue-400 text-white font-semibold' : ''}
                              ${isChina ? 'bg-red-400 text-white font-semibold' : ''}
                              ${!holiday && !isTodayDate ? 'hover:bg-gray-100' : ''}
                            `}
                            title={holiday ? `${holiday.country} ${holiday.name}` : ''}
                          >
                            {format(day, 'd')}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
              <span className="font-semibold">🎌 Add Holiday / Border Closure</span>
              <button onClick={() => setShowModal(false)} className="text-2xl opacity-70 hover:opacity-100">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full p-3 border rounded-lg text-lg"
                >
                  <option value="🇲🇳">🇲🇳 Mongolia</option>
                  <option value="🇨🇳">🇨🇳 China</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isRange"
                  checked={form.isRange}
                  onChange={(e) => setForm({ ...form, isRange: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isRange" className="text-sm text-gray-600 cursor-pointer">Multiple days (date range)</label>
              </div>
              {form.isRange && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Holiday Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Lunar New Year, National Day..."
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border rounded-lg font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-lg font-semibold hover:shadow-lg transition"
              >
                Add Holiday
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HolidaysView;
