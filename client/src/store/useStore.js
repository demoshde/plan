import { create } from 'zustand';
import { convoyApi, dispatchApi, planApi, holidayApi, incidentApi, shiftApi } from '../services/api';
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isSunday, startOfMonth, endOfMonth, addMonths, startOfYear, endOfYear } from 'date-fns';

const useStore = create((set, get) => ({
  // Auth State
  isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
  
  // Auth Actions
  login: (username, password) => {
    const storedPassword = localStorage.getItem('appPassword') || 'pass123';
    if (username === 'olt' && password === storedPassword) {
      localStorage.setItem('isAuthenticated', 'true');
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  
  logout: () => {
    localStorage.removeItem('isAuthenticated');
    set({ isAuthenticated: false });
  },

  changePassword: (currentPassword, newPassword) => {
    const storedPassword = localStorage.getItem('appPassword') || 'pass123';
    if (currentPassword === storedPassword) {
      localStorage.setItem('appPassword', newPassword);
      return true;
    }
    return false;
  },

  // State
  convoys: [],
  dispatches: {},
  weekOffset: 0,
  weekDays: [],
  kpi: { total: 0, returned: 0, avgHours: '0:00' },
  monthKpi: { total: 0, returned: 0, avgHours: '0:00' },
  yearKpi: { total: 0, returned: 0, avgHours: '0:00' },
  shifts: { day: [], night: [] },
  holidays: [],
  incidents: [],
  plans: {},
  monthlyTarget: 0,
  planMonthOffset: 0,
  holidayYear: new Date().getFullYear(),
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Get week days based on offset (Saturday start)
  getWeekDays: (offset = 0) => {
    const today = new Date();
    const start = startOfWeek(addWeeks(today, offset), { weekStartsOn: 6 });
    const end = endOfWeek(addWeeks(today, offset), { weekStartsOn: 6 });
    
    const days = eachDayOfInterval({ start, end })
      .filter(day => !isSunday(day))
      .map(day => ({
        dateKey: format(day, 'yyyy-MM-dd'),
        display: format(day, 'EEE dd MMM').toUpperCase(),
        date: day
      }));
    
    return days;
  },

  // Fetch convoys
  fetchConvoys: async () => {
    try {
      const response = await convoyApi.getAll();
      set({ convoys: response.data });
    } catch (error) {
      console.error('Error fetching convoys:', error);
      // Seed if empty
      try {
        await convoyApi.seed();
        const response = await convoyApi.getAll();
        set({ convoys: response.data });
      } catch (seedError) {
        console.error('Error seeding convoys:', seedError);
      }
    }
  },

  // Update convoy
  updateConvoy: async (id, data) => {
    try {
      await convoyApi.update(id, data);
      await get().fetchConvoys();
    } catch (error) {
      console.error('Error updating convoy:', error);
    }
  },

  // Reorder convoys (drag & drop)
  reorderConvoys: async (sourceIndex, destIndex) => {
    const { convoys } = get();
    const newConvoys = [...convoys];
    const [moved] = newConvoys.splice(sourceIndex, 1);
    newConvoys.splice(destIndex, 0, moved);

    // Update order field
    const convoyOrders = newConvoys.map((c, idx) => ({
      id: c._id,
      order: idx + 1
    }));

    // Optimistic update
    set({ convoys: newConvoys });

    try {
      await convoyApi.reorder(convoyOrders);
    } catch (error) {
      console.error('Error reordering convoys:', error);
      await get().fetchConvoys();
    }
  },

  // Change week
  changeWeek: (direction) => {
    const newOffset = get().weekOffset + direction;
    const weekDays = get().getWeekDays(newOffset);
    set({ weekOffset: newOffset, weekDays });
    get().fetchWeekData();
  },

  // Fetch week data
  fetchWeekData: async () => {
    const { weekOffset, getWeekDays } = get();
    const weekDays = getWeekDays(weekOffset);
    set({ weekDays, loading: true });

    try {
      const startDate = weekDays[0].dateKey;
      const endDate = weekDays[weekDays.length - 1].dateKey;
      
      // Get year/month from start date for plans
      const startDateObj = new Date(startDate);
      const year = startDateObj.getFullYear();
      const month = startDateObj.getMonth() + 1;
      
      const [dispatchRes, kpiRes, plansRes] = await Promise.all([
        dispatchApi.getByRange(startDate, endDate),
        dispatchApi.getKpi(startDate, endDate),
        planApi.getByMonth(year, month)
      ]);

      const dispatches = {};
      dispatchRes.data.forEach(d => {
        dispatches[d.date] = d;
      });

      // Process daily plans
      const plans = {};
      plansRes.data.forEach(p => {
        plans[p.date] = p.targetCount;
      });

      // Initialize empty days
      weekDays.forEach(day => {
        if (!dispatches[day.dateKey]) {
          dispatches[day.dateKey] = {
            date: day.dateKey,
            rows: Array.from({ length: 20 }, (_, i) => ({
              convoyName: '',
              startTime: '',
              endTime: '',
              totalHours: '',
              returned: false,
              order: i
            }))
          };
        }
      });

      set({ dispatches, kpi: kpiRes.data, plans, loading: false });
    } catch (error) {
      console.error('Error fetching week data:', error);
      set({ loading: false, error: error.message });
    }
  },

  // Update dispatch row
  updateDispatchRow: async (date, rowIndex, field, value) => {
    const { dispatches } = get();
    const dispatch = { ...dispatches[date] };
    dispatch.rows = [...dispatch.rows];
    dispatch.rows[rowIndex] = { ...dispatch.rows[rowIndex], [field]: value };

    // Calculate total hours if start and end are set
    if (field === 'startTime' || field === 'endTime') {
      const row = dispatch.rows[rowIndex];
      if (row.startTime && row.endTime) {
        const [h1, m1] = row.startTime.split(':').map(Number);
        const [h2, m2] = row.endTime.split(':').map(Number);
        let startMin = h1 * 60 + m1;
        let endMin = h2 * 60 + m2;
        if (endMin < startMin) endMin += 24 * 60;
        const diff = endMin - startMin;
        const hh = Math.floor(diff / 60).toString().padStart(2, '0');
        const mm = (diff % 60).toString().padStart(2, '0');
        dispatch.rows[rowIndex].totalHours = `${hh}:${mm}`;
      } else {
        // Clear total hours if start or end time is missing
        dispatch.rows[rowIndex].totalHours = '';
      }
    }

    set({ dispatches: { ...dispatches, [date]: dispatch } });

    try {
      await dispatchApi.update(date, dispatch.rows);
      await get().fetchWeekData();
    } catch (error) {
      console.error('Error updating dispatch:', error);
    }
  },

  // Add convoy to first empty row in a day (from sidebar drag)
  addConvoyToDay: async (date, convoyName) => {
    const { dispatches } = get();
    const dispatch = { ...dispatches[date] };
    dispatch.rows = [...dispatch.rows];
    
    // Find first empty row
    const emptyRowIndex = dispatch.rows.findIndex(row => !row.convoyName);
    if (emptyRowIndex === -1) {
      console.warn('No empty rows available');
      return;
    }
    
    dispatch.rows[emptyRowIndex] = { 
      ...dispatch.rows[emptyRowIndex], 
      convoyName 
    };

    set({ dispatches: { ...dispatches, [date]: dispatch } });

    try {
      await dispatchApi.update(date, dispatch.rows);
      await get().fetchWeekData();
    } catch (error) {
      console.error('Error adding convoy to day:', error);
    }
  },

  // Toggle returned status
  toggleReturned: async (date, rowIndex) => {
    const { dispatches } = get();
    const currentValue = dispatches[date]?.rows[rowIndex]?.returned || false;
    await get().updateDispatchRow(date, rowIndex, 'returned', !currentValue);
  },

  // Reorder rows (drag & drop)
  reorderRows: async (date, sourceIndex, destIndex) => {
    const { dispatches } = get();
    const dispatch = { ...dispatches[date] };
    const rows = [...dispatch.rows];
    const [moved] = rows.splice(sourceIndex, 1);
    rows.splice(destIndex, 0, moved);
    
    // Update order
    rows.forEach((row, idx) => {
      row.order = idx;
    });
    
    dispatch.rows = rows;
    set({ dispatches: { ...dispatches, [date]: dispatch } });

    try {
      await dispatchApi.update(date, dispatch.rows);
    } catch (error) {
      console.error('Error reordering:', error);
    }
  },

  // Shifts
  fetchShifts: async () => {
    try {
      const response = await shiftApi.getAll();
      set({ shifts: response.data });
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  },

  addConvoyToShift: async (shiftType, convoyName) => {
    try {
      await shiftApi.addConvoy(shiftType, convoyName);
      await get().fetchShifts();
    } catch (error) {
      console.error('Error adding convoy to shift:', error);
    }
  },

  removeConvoyFromShift: async (shiftType, convoyName) => {
    try {
      await shiftApi.removeConvoy(shiftType, convoyName);
      await get().fetchShifts();
    } catch (error) {
      console.error('Error removing convoy from shift:', error);
    }
  },

  // Reorder convoy within or between shifts
  reorderShiftConvoy: async (srcShift, srcIndex, destShift, destIndex) => {
    const { shifts } = get();
    const newShifts = {
      day: [...shifts.day],
      night: [...shifts.night]
    };

    // Remove from source
    const [moved] = newShifts[srcShift].splice(srcIndex, 1);

    // Adjust destination index if moving within same shift
    let insertIdx = destIndex;
    if (srcShift === destShift && srcIndex < destIndex) {
      insertIdx--;
    }

    // Insert at destination
    newShifts[destShift].splice(insertIdx, 0, moved);

    // Update local state immediately
    set({ shifts: newShifts });

    // Save to server
    try {
      await shiftApi.updateAll(newShifts);
    } catch (error) {
      console.error('Error reordering shift convoy:', error);
      // Revert on error
      await get().fetchShifts();
    }
  },

  // Holidays
  fetchHolidays: async (year) => {
    try {
      const response = await holidayApi.getByYear(year || get().holidayYear);
      set({ holidays: response.data });
    } catch (error) {
      console.error('Error fetching holidays:', error);
    }
  },

  addHoliday: async (data) => {
    try {
      await holidayApi.create(data);
      await get().fetchHolidays();
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  },

  deleteHoliday: async (id) => {
    try {
      await holidayApi.delete(id);
      await get().fetchHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  },

  changeHolidayYear: (direction) => {
    const newYear = get().holidayYear + direction;
    set({ holidayYear: newYear });
    get().fetchHolidays(newYear);
  },

  // Incidents
  fetchIncidents: async (year, month) => {
    try {
      const response = await incidentApi.getByMonth(year, month);
      set({ incidents: response.data });
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  },

  addIncident: async (data) => {
    try {
      await incidentApi.create(data);
    } catch (error) {
      console.error('Error adding incident:', error);
    }
  },

  updateIncident: async (id, data) => {
    try {
      await incidentApi.update(id, data);
    } catch (error) {
      console.error('Error updating incident:', error);
    }
  },

  deleteIncident: async (id) => {
    try {
      await incidentApi.delete(id);
    } catch (error) {
      console.error('Error deleting incident:', error);
    }
  },

  // Plans
  fetchMonthlyPlans: async (year, month) => {
    try {
      const [plansRes, targetRes] = await Promise.all([
        planApi.getByMonth(year, month),
        planApi.getMonthlyTarget(year, month)
      ]);
      
      const plans = {};
      plansRes.data.forEach(p => {
        plans[p.date] = p.targetCount;
      });
      
      set({ 
        plans, 
        monthlyTarget: targetRes.data.monthlyTarget || 0 
      });
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  },

  updateDailyPlan: async (date, targetCount) => {
    try {
      await planApi.update(date, targetCount);
      const { plans } = get();
      set({ plans: { ...plans, [date]: targetCount } });
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  },

  updateMonthlyTarget: async (year, month, target) => {
    try {
      await planApi.setMonthlyTarget(year, month, target);
      set({ monthlyTarget: target });
    } catch (error) {
      console.error('Error updating monthly target:', error);
    }
  },

  changePlanMonth: (direction) => {
    const newOffset = get().planMonthOffset + direction;
    set({ planMonthOffset: newOffset });
    get().fetchMonthKpi(newOffset);
  },

  fetchMonthKpi: async (offset) => {
    try {
      const targetDate = addMonths(new Date(), offset);
      const startDate = format(startOfMonth(targetDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(targetDate), 'yyyy-MM-dd');
      const res = await dispatchApi.getKpi(startDate, endDate);
      set({ monthKpi: res.data });
    } catch (error) {
      console.error('Error fetching month KPI:', error);
    }
  },

  fetchYearKpi: async (year) => {
    try {
      const targetDate = new Date(year, 0, 1);
      const startDate = format(startOfYear(targetDate), 'yyyy-MM-dd');
      const endDate = format(endOfYear(targetDate), 'yyyy-MM-dd');
      const res = await dispatchApi.getKpi(startDate, endDate);
      set({ yearKpi: res.data });
    } catch (error) {
      console.error('Error fetching year KPI:', error);
    }
  },

  changeHolidayYearWithKpi: (direction) => {
    const newYear = get().holidayYear + direction;
    set({ holidayYear: newYear });
    get().fetchYearKpi(newYear);
  }
}));

export default useStore;
