import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para agregar JWT token automáticamente
api.interceptors.request.use((config) => {
  // El token se inyectará desde el store de autenticación (Fase 1)
  return config;
});

export default api;
