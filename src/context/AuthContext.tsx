import React, { createContext, useContext, useEffect, useState } from 'react';
import { pb, UserRecord } from '../lib/pocketbase';

interface AuthContextType {
  user: UserRecord | null;
  isValid: boolean;
  isAdmin: boolean;
  isAssociado: boolean;
  isVendedor: boolean;
  primeiroAcesso: boolean;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(pb.authStore.model as UserRecord | null);
  const [isValid, setIsValid] = useState(pb.authStore.isValid);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const validateAuth = async () => {
      // Se houver credencial no localStorage, verifica ativamente com o PocketBase
      if (pb.authStore.isValid && pb.authStore.token) {
        try {
          const authData = await pb.collection('users').authRefresh();
          if (isMounted) {
            setUser(authData.record as unknown as UserRecord);
            setIsValid(true);
          }
        } catch (err) {
          console.warn('Sessão expirada ou inválida no PocketBase:', err);
          pb.authStore.clear();
          if (isMounted) {
            setUser(null);
            setIsValid(false);
          }
        }
      } else {
        pb.authStore.clear();
        if (isMounted) {
          setUser(null);
          setIsValid(false);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    validateAuth();

    // Listen for auth changes (login, logout, refresh)
    const removeListener = pb.authStore.onChange((token, model) => {
      if (isMounted) {
        setUser(model as unknown as UserRecord | null);
        setIsValid(!!token && !!model);
      }
    });

    return () => {
      isMounted = false;
      removeListener();
    };
  }, []);

  const signOut = () => {
    pb.authStore.clear();
  };

  const isAdmin = user?.tipo_acesso === 'admin';
  const isAssociado = user?.tipo_acesso === 'associado';
  const isVendedor = user?.tipo_acesso === 'vendedor';
  const primeiroAcesso = user?.primeiro_acesso === true;

  return (
    <AuthContext.Provider value={{ user, isValid, isAdmin, isAssociado, isVendedor, primeiroAcesso, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
