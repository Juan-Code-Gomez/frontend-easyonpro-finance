import api from './api';

export const alertService = {
  getAlerts: async () => {
    const { data } = await api.get('/alerts');
    return data;
  },
  markRead: async (id) => {
    const { data } = await api.patch(`/alerts/${id}/read`);
    return data;
  },
  markAllRead: async () => {
    const { data } = await api.patch('/alerts/read-all');
    return data;
  },
  deleteAlert: async (id) => {
    const { data } = await api.delete(`/alerts/${id}`);
    return data;
  },
  getBudgets: async (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const { data } = await api.get('/alerts/budgets', { params });
    return data;
  },
  createBudget: async (payload) => {
    const { data } = await api.post('/alerts/budgets', payload);
    return data;
  },
  deleteBudget: async (id) => {
    const { data } = await api.delete(`/alerts/budgets/${id}`);
    return data;
  },
};
