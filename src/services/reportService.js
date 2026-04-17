import api from './api';

export const reportService = {
  getMonthly: async (month, year) => {
    const { data } = await api.get('/reports/monthly', { params: { month, year } });
    return data;
  },
  getYearly: async (year) => {
    const { data } = await api.get('/reports/yearly', { params: { year } });
    return data;
  },
};
