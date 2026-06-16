import axios from 'axios';
import { pb } from '../lib/pocketbase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api/calculos',
});

// Adiciona o token do PocketBase nas requisições para o backend
api.interceptors.request.use((config) => {
  const token = pb.authStore.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
