import api from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  forgotPassword: async (email) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token, newPassword) => {
    const { data } = await api.post('/auth/reset-password', { token, newPassword });
    return data;
  },

  getStoredSession: async () => {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user');
    return { token, user: user ? JSON.parse(user) : null };
  },
};
