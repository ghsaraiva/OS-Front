import PocketBase from 'pocketbase';

const PB_URL = 'http://150.136.18.45';
export const pb = new PocketBase(PB_URL);

// Disable auto-cancellation globally (recommended for React environments)
pb.autoCancellation(false);

// Types for PocketBase collections
export interface UserRecord {
  id: string;
  email: string;
  name: string;
  tipo_acesso: 'admin' | 'vendedor';
  avatar?: string;
  created: string;
  updated: string;
}

export interface OrcamentoRecord {
  id: string;
  codigo: string;
  user_id: string;
  nome_cliente: string;
  estado: string;
  cidade: string;
  situacao: string;
  created: string;
  updated: string;
  // Adicione outros campos conforme necessário para bater com o schema do PB
  [key: string]: any;
}
