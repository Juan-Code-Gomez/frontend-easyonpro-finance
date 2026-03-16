import api from './api';

export const debtService = {
  getDebts: async (status) => {
    const params = status ? { status } : {};
    const { data } = await api.get('/debts', { params });
    return data;
  },
  createDebt: async (payload) => {
    const { data } = await api.post('/debts', payload);
    return data;
  },
  addPayment: async (id, payload) => {
    const { data } = await api.post(`/debts/${id}/payments`, payload);
    return data;
  },
  updateDebt: async (id, payload) => {
    const { data } = await api.put(`/debts/${id}`, payload);
    return data;
  },
  deleteDebt: async (id) => {
    const { data } = await api.delete(`/debts/${id}`);
    return data;
  },
};

export const financingService = {
  getFinancings: async (status) => {
    const params = status ? { status } : {};
    const { data } = await api.get('/financings', { params });
    return data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/financings/${id}`);
    return data;
  },
  calculate: async (capital, interestRate, installments) => {
    const { data } = await api.post('/financings/calculate', { capital, interestRate, installments });
    return data;
  },
  createFinancing: async (payload) => {
    const { data } = await api.post('/financings', payload);
    return data;
  },
  addPayment: async (id, payload) => {
    const { data } = await api.post(`/financings/${id}/payments`, payload);
    return data;
  },
  updateStatus: async (id, status) => {
    const { data } = await api.put(`/financings/${id}/status`, { status });
    return data;
  },
  deleteFinancing: async (id) => {
    const { data } = await api.delete(`/financings/${id}`);
    return data;
  },
};
