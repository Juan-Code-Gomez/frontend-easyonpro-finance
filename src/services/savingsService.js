import api from './api';

export const savingsService = {
  getGoals: async () => {
    const { data } = await api.get('/savings');
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/savings/${id}`);
    return data;
  },
  createGoal: async (payload) => {
    const { data } = await api.post('/savings', payload);
    return data;
  },
  addDeposit: async (id, payload) => {
    const { data } = await api.post(`/savings/${id}/deposits`, payload);
    return data;
  },
  updateGoal: async (id, payload) => {
    const { data } = await api.put(`/savings/${id}`, payload);
    return data;
  },
  deleteGoal: async (id) => {
    const { data } = await api.delete(`/savings/${id}`);
    return data;
  },
};
