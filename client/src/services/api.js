import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Convoys
export const convoyApi = {
  getAll: () => api.get('/convoys'),
  getById: (id) => api.get(`/convoys/${id}`),
  create: (data) => api.post('/convoys', data),
  update: (id, data) => api.put(`/convoys/${id}`, data),
  delete: (id) => api.delete(`/convoys/${id}`),
  reorder: (convoyOrders) => api.put('/convoys/reorder', { convoyOrders }),
  seed: () => api.post('/convoys/seed')
};

// Dispatches
export const dispatchApi = {
  getByDate: (date) => api.get(`/dispatches/${date}`),
  getByRange: (startDate, endDate) => api.get('/dispatches/range', { params: { startDate, endDate } }),
  update: (date, rows) => api.put(`/dispatches/${date}`, { rows }),
  updateRow: (date, rowIndex, data) => api.patch(`/dispatches/${date}/row/${rowIndex}`, data),
  getKpi: (startDate, endDate) => api.get('/dispatches/kpi/range', { params: { startDate, endDate } })
};

// Plans
export const planApi = {
  getByMonth: (year, month) => api.get(`/plans/month/${year}/${month}`),
  getByRange: (startDate, endDate) => api.get('/plans/range', { params: { startDate, endDate } }),
  getByDate: (date) => api.get(`/plans/${date}`),
  update: (date, targetCount) => api.put(`/plans/${date}`, { targetCount }),
  getMonthlyTarget: (year, month) => api.get(`/plans/monthly/${year}/${month}`),
  setMonthlyTarget: (year, month, target) => api.put(`/plans/monthly/${year}/${month}`, { monthlyTarget: target })
};

// Holidays
export const holidayApi = {
  getByYear: (year) => api.get(`/holidays/year/${year}`),
  getAll: () => api.get('/holidays'),
  create: (data) => api.post('/holidays', data),
  delete: (id) => api.delete(`/holidays/${id}`),
  deleteRange: (startDate, endDate, name) => api.delete('/holidays/range', { data: { startDate, endDate, name } })
};

// Incidents
export const incidentApi = {
  getByMonth: (year, month) => api.get(`/incidents/month/${year}/${month}`),
  getAll: () => api.get('/incidents'),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
  delete: (id) => api.delete(`/incidents/${id}`)
};

// Shifts
export const shiftApi = {
  getAll: () => api.get('/shifts'),
  update: (shiftType, convoys) => api.put(`/shifts/${shiftType}`, { convoys }),
  updateAll: (shifts) => api.put('/shifts', shifts),
  addConvoy: (shiftType, convoyName) => api.post(`/shifts/${shiftType}/convoy`, { convoyName }),
  removeConvoy: (shiftType, convoyName) => api.delete(`/shifts/${shiftType}/convoy/${convoyName}`)
};

export default api;
