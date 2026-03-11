import api from './api';

export const transactionService = {
  getSummary: async (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const { data } = await api.get('/transactions/summary', { params });
    return data;
  },

  getTransactions: async (filters = {}) => {
    const { data } = await api.get('/transactions', { params: filters });
    return data;
  },

  createTransaction: async (payload) => {
    const { data } = await api.post('/transactions', payload);
    return data;
  },

  updateTransaction: async (id, payload) => {
    const { data } = await api.put(`/transactions/${id}`, payload);
    return data;
  },

  deleteTransaction: async (id) => {
    const { data } = await api.delete(`/transactions/${id}`);
    return data;
  },
};

export const categoryService = {
  getCategories: async (type) => {
    const params = type ? { type } : {};
    const { data } = await api.get('/categories', { params });
    return data;
  },

  createCategory: async (payload) => {
    const { data } = await api.post('/categories', payload);
    return data;
  },

  deleteCategory: async (id) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },
};
