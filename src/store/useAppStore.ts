import { create } from 'zustand';
import { pb } from '../lib/pocketbase';
import { Orcamento } from '../hooks/useBudgets';
import api from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  tipo_acesso: 'admin' | 'vendedor';
  avatar?: string;
  created?: string;
}

export interface Cidade {
  id: string;
  cidade: string;
  estado: string;
  mediacalc: number;
  latitude: number;
  longitude: number;
  janeirocalc: number;
  fevereirocalc: number;
  marcocalc: number;
  abrilcalc: number;
  maiocalc: number;
  junhocalc: number;
  julhocalc: number;
  agostocalc: number;
  setembrocalc: number;
  outubrocalc: number;
  novembrocalc: number;
  dezembrocalc: number;
}

interface AppState {
  users: User[];
  budgets: Orcamento[];
  cities: Cidade[];
  isLoading: boolean;
  error: string | null;
  isSubscribed: boolean;

  // Actions
  initApp: () => Promise<void>;
  setBudgets: (budgets: Orcamento[]) => void;
  addBudget: (budget: Orcamento) => void;
  updateBudgetInStore: (budget: Orcamento) => void;
  fetchBudgets: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  users: [],
  budgets: [],
  cities: [],
  isLoading: false,
  error: null,
  isSubscribed: false,

  initApp: async () => {
    // Prevent multiple initializations/subscriptions
    if (get().isSubscribed) return;

    set({ isLoading: true, error: null });
    try {
      const isAdmin = pb.authStore.model?.tipo_acesso === 'admin';

      const budgetsPromise = api.get<Orcamento[]>('/budgets').then(res => res.data);
      const usersPromise = isAdmin 
        ? api.get<User[]>('/users').then(res => res.data)
        : Promise.resolve([] as User[]);

      const [users, budgets] = await Promise.all([usersPromise, budgetsPromise]);

      set({ users, budgets, cities: [], isLoading: false, isSubscribed: true });

      // Configurar Realtime Subscriptions
      pb.collection('orcamentos').subscribe('*', function () {
        get().fetchBudgets();
      });

      pb.collection('users').subscribe('*', function () {
        get().fetchUsers();
      });

    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erro desconhecido', isLoading: false });
    }
  },

  setBudgets: (budgets) => set({ budgets }),

  addBudget: (budget) => set((state) => ({ 
    budgets: [budget, ...state.budgets] 
  })),

  updateBudgetInStore: (updatedBudget) => set((state) => ({
    budgets: state.budgets.map((b) => b.id === updatedBudget.id ? updatedBudget : b)
  })),

  fetchBudgets: async () => {
    try {
      const response = await api.get<Orcamento[]>('/budgets');
      set({ budgets: response.data });
    } catch {
      // Fetch fail silenced
    }
  },

  fetchUsers: async () => {
    const isAdmin = pb.authStore.model?.tipo_acesso === 'admin';
    if (!isAdmin) return;

    try {
      const response = await api.get<User[]>('/users');
      set({ users: response.data });
    } catch {
      // Fetch fail silenced
    }
  },
}));
