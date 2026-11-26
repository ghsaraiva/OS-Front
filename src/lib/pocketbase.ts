import PocketBase from 'pocketbase';

const PB_URL = import.meta.env.VITE_POCKETBASE_URL ;
export const pb = new PocketBase(PB_URL);

// Disable auto-cancellation globally (recommended for React environments)
pb.autoCancellation(false);

// Trata automaticamente respostas 401 do PocketBase (sessão expirada durante o uso)
pb.afterSend = function (response, data) {
  if (response.status === 401 && !response.url.includes('/auth-with-password') && !response.url.includes('/auth-refresh')) {
    pb.authStore.clear();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return data;
};

// Types for PocketBase collections
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  tipo_acesso: 'admin' | 'vendedor' | 'associado';
  primeiro_acesso: boolean;
  avatar?: string;
  created: string;
  updated: string;
}

export interface OrcamentoRecord {
  id: string;
  codigo: string;
  user_id: string;
  nome_cliente: string;
  telefone_cliente?: string;
  email_cliente?: string;
  estado: string;
  cidade: string;
  id_cidade?: string;
  situacao: string;
  created: string;
  updated: string;
  // Adicione outros campos conforme necessário para bater com o schema do PB
  [key: string]: unknown;
}
