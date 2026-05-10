import React, { createContext, useContext, useEffect, useState } from 'react';
import { pb, UserRecord } from '../lib/pocketbase';

interface AuthContextType {
  user: UserRecord | null;
  isValid: boolean;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(pb.authStore.model as UserRecord | null);
  const [isValid, setIsValid] = useState(pb.authStore.isValid);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // PocketBase authStore is already initialized with stored state if present
    setLoading(false);

    // Listen for auth changes (login, logout, refresh)
    const removeListener = pb.authStore.onChange((token, model) => {
      setUser(model as UserRecord | null);
      setIsValid(!!token && !!model);
    });

    return () => removeListener();
  }, []);

  const signOut = () => {
    pb.authStore.clear();
  };

  const isAdmin = user?.tipo_acesso === 'admin';

  return (
    <AuthContext.Provider value={{ user, isValid, isAdmin, loading, signOut }}>
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
