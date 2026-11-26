import { create } from 'zustand';
import { pb } from '../lib/pocketbase';
import { Orcamento } from '../hooks/useBudgets';
import api from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  tipo_acesso: 'admin' | 'vendedor' | 'associado';
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
  loadedForUserId: string | null;

  // Actions
  initApp: () => Promise<void>;
  setBudgets: (budgets: Orcamento[]) => void;
  addBudget: (budget: Orcamento) => void;
  updateBudgetInStore: (budget: Orcamento) => void;
  fetchBudgets: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

// Como manter a lista atualizada para o usuário logado; trocado a cada initApp.
let pararAtualizacao: (() => void) | null = null;

// Só o admin acessa a coleção orcamentos direto no PocketBase, então só ele recebe realtime.
function assinarRealtime(get: () => AppState) {
  pb.collection('orcamentos').subscribe('*', () => get().fetchBudgets());
  pb.collection('users').subscribe('*', () => get().fetchUsers());
  return () => {
    pb.collection('orcamentos').unsubscribe('*').catch(() => {});
    pb.collection('users').unsubscribe('*').catch(() => {});
  };
}

// Associado e vendedor leem pelo backend: recarrega ao voltar para a aba e a cada minuto.
function recarregarPeriodicamente(get: () => AppState) {
  const recarregar = () => {
    if (document.visibilityState === 'visible') get().fetchBudgets();
  };
  const intervalo = window.setInterval(recarregar, 60_000);
  document.addEventListener('visibilitychange', recarregar);
  return () => {
    window.clearInterval(intervalo);
    document.removeEventListener('visibilitychange', recarregar);
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  users: [],
  budgets: [],
  cities: [],
  isLoading: false,
  error: null,
  isSubscribed: false,
  loadedForUserId: null,

  initApp: async () => {
    // Carrega uma vez por usuário logado. Ao trocar de usuário na mesma aba (sair e entrar com outro),
    // os dados do anterior são descartados: o admin precisa da lista de usuários e o
    // associado/vendedor não pode continuar vendo os orçamentos carregados para o admin.
    const userId = pb.authStore.model?.id ?? null;
    if (get().loadedForUserId === userId) return;

    pararAtualizacao?.();
    pararAtualizacao = null;

    set({ users: [], budgets: [], isLoading: true, error: null, isSubscribed: false, loadedForUserId: userId });
    try {
      const isAdmin = pb.authStore.model?.tipo_acesso === 'admin';

      const budgetsPromise = api.get<Orcamento[]>('/budgets').then(res => res.data);
      const usersPromise = isAdmin 
        ? api.get<User[]>('/users').then(res => res.data)
        : Promise.resolve([] as User[]);

      const [users, budgets] = await Promise.all([usersPromise, budgetsPromise]);
      // Outro usuário entrou enquanto carregava: descarta este resultado
      if (get().loadedForUserId !== userId) return;

      set({ users, budgets, cities: [], isLoading: false, isSubscribed: true });

      pararAtualizacao = isAdmin ? assinarRealtime(get) : recarregarPeriodicamente(get);

    } catch (err: unknown) {
      // Libera uma nova tentativa na próxima chamada
      set({ error: err instanceof Error ? err.message : 'Erro desconhecido', isLoading: false, loadedForUserId: null });
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
