import axios from 'axios';
import { pb } from '../lib/pocketbase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Adiciona o token do PocketBase nas requisições para o backend
api.interceptors.request.use((config) => {
  const token = pb.authStore.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepta respostas 401 (token expirado/inválido) e redireciona para login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      pb.authStore.clear();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
