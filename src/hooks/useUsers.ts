import { useState, useEffect } from 'react';
import { UserRecord } from '../lib/pocketbase';
import api from '../services/api';
import { useAppStore } from '../store/useAppStore';
import axios from 'axios';

export const useUsers = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<UserRecord[]>('/users');
      setUsers(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (
    email: string, 
    password: string, 
    passwordConfirm: string, 
    name: string, 
    tipo_acesso: 'admin' | 'vendedor' | 'associado'
  ) => {
    try {
      setLoading(true);
      
      const data = {
        email,
        password,
        passwordConfirm,
        name,
        tipo_acesso,
        emailVisibility: true,
      };

      await api.post('/users', data);

      // A tela de usuários lê a lista da store; não depender só do realtime para atualizá-la
      await Promise.all([fetchUsers(), useAppStore.getState().fetchUsers()]);
      return { success: true };
    } catch (err: unknown) {
      let msg = "Erro desconhecido";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.error || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, fetchUsers, createUser };
};
