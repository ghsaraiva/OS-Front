import { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { useAuth } from '../context/AuthContext';

export interface Orcamento {
  id: string;
  user_id: string;
  nome_cliente: string;
  estado: string;
  cidade: string;
  observacao: string;
  estrutura: string;
  padrao: string;
  consumo_mes: number;
  valor_tarifa: number;
  mao_obra: number;
  equipamento_local: number;
  lucro_liquido_perc: number;
  situacao: string;
  situacao_venda: string;
  created: string;
  expand?: {
    user_id: {
      name: string;
    }
  };
}

export const useOrcamentos = () => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  const fetchOrcamentos = async () => {
    try {
      setLoading(true);
      
      let filter = '';
      if (!isAdmin && user?.id) {
        filter = `user_id = "${user.id}"`;
      }

      const records = await pb.collection('orcamentos').getFullList<Orcamento>({
        sort: '-created',
        filter: filter,
        expand: 'user_id',
      });

      setOrcamentos(records);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createInitialBudget = async (formData: any) => {
    try {
      setLoading(true);
      if (!user) throw new Error('User not authenticated');

      const data = {
        ...formData,
        user_id: user.id,
        situacao: 'Aberto',
        situacao_venda: 'Pendente'
      };

      const record = await pb.collection('orcamentos').create(data);
      
      await fetchOrcamentos();
      return { success: true, data: record };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getOrcamentoById = async (id: string) => {
    try {
      setLoading(true);
      const record = await pb.collection('orcamentos').getOne<Orcamento>(id, {
        expand: 'user_id',
      });
      return { success: true, data: record };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrcamentos();
  }, [user, isAdmin]);

  return { orcamentos, loading, error, fetchOrcamentos, createInitialBudget, getOrcamentoById };
};
