import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.1.12:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar JWT token en cada request automáticamente
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
