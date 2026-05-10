import { useState, useEffect } from 'react';
import { pb, UserRecord } from '../lib/pocketbase';

export const useUsers = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // PocketBase List Users
      const records = await pb.collection('users').getFullList<UserRecord>({
        sort: '-created',
      });

      setUsers(records);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (
    email: string, 
    password: string, 
    passwordConfirm: string, 
    name: string, 
    tipo_acesso: 'admin' | 'vendedor'
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

      await pb.collection('users').create(data);

      await fetchUsers();
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, fetchUsers, createUser };
};
