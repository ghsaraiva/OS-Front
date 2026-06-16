import { create } from 'zustand';
import { pb } from '../lib/pocketbase';
import { Orcamento } from '../hooks/useBudgets';

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
      const [users, budgets] = await Promise.all([
        pb.collection('users').getFullList<User>(),
        pb.collection('orcamentos').getFullList<Orcamento>({
          sort: '-created',
          expand: 'user_id',
        }),
      ]);

      set({ users, budgets, cities: [], isLoading: false, isSubscribed: true });

      // Configurar Realtime Subscriptions
      pb.collection('orcamentos').subscribe('*', function (e) {
        get().fetchBudgets();
      });

      pb.collection('users').subscribe('*', function (e) {
        get().fetchUsers();
      });

    } catch (err: unknown) {
      console.error('Error initializing app:', err);
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
      const budgets = await pb.collection('orcamentos').getFullList<Orcamento>({
        sort: '-created',
        expand: 'user_id',
      });
      set({ budgets });
    } catch (err: unknown) {
      console.error('Error fetching budgets:', err);
    }
  },

  fetchUsers: async () => {
    try {
      const users = await pb.collection('users').getFullList<User>();
      set({ users });
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
    }
  },
}));
