import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import axios from "axios";

export interface Orcamento {
  id: string;
  user_id: string;
  id_cidade: string;
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

  // Dados Técnicos
  potencia_painel?: number;
  qtd_paineis?: number;
  peso_painel?: number;
  marca_painel?: string;
  kwp_minimo?: number;
  kwp_sistema?: number;

  // Inversores
  qtd_inversores?: number;
  potencia_inversor?: number;
  modelo_inversor?: string;
  marca_inversor?: string;
  tensao_inversor?: string;

  // Valores de Entrada
  valor_kit?: number;
  porcentagem_kit?: number;
  valor_homologacao?: number;

  // Retornos de Cálculo
  valor_kit_final?: number;
  lucro_equipamento?: number;
  valor_mao_obra_final?: number;
  valor_equip_local_final?: number;
  seguro?: number;
  custo_projeto?: number;
  imposto?: number;
  margem_seguranca?: number;
  lucro_liquido_previsto?: number;
  preco_final_venda?: number;

  // Sistema e Geração
  area_estimada?: number;
  geracao_mes?: number;
  geracao_ano?: number;
  valor_pago_mes?: number;
  valor_pago_ano?: number;
  porcentagem_reducao?: number;
  tempo_retorno?: string;

  // Garantias e Suporte
  garantia_fabrica_modulo?: string;
  garantia_eficiencia_modulo?: string;
  garantia_inversor?: string;
  garantia_instalacao?: string;
  garantia_estrutura?: string;
  monitoramento_inversor?: string;
  material_estrutura?: string;

  // Características da Estrutura
  caracteristica_estrutura_1?: string;
  caracteristica_estrutura_2?: string;
  caracteristica_estrutura_3?: string;
  caracteristica_estrutura_4?: string;
  caracteristica_estrutura_5?: string;

  // Composição do Kit
  composicao_1?: string;
  composicao_2?: string;
  composicao_3?: string;
  composicao_4?: string;
  composicao_5?: string;

  situacao: string;
  created: string;
  expand?: {
    user_id: {
      name: string;
    };
  };
}

export const useBudgets = () => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  const fetchOrcamentos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Orcamento[]>("/budgets");
      setOrcamentos(response.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createInitialBudget = async (
    formData: Record<string, unknown>,
  ): Promise<
    { success: true; data: Orcamento } | { success: false; error: string }
  > => {
    try {
      setLoading(true);
      if (!user) throw new Error("User not authenticated");

      const payload = {
        ...formData,
        user_id: user.id,
      };

      const response = await api.post<Orcamento>(
        "/criar-solicitacao",
        payload,
      );

      await fetchOrcamentos();
      return { success: true, data: response.data };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return {
          success: false,
          error: err.response?.data?.error || err.message,
        };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao criar orçamento",
      };
    } finally {
      setLoading(false);
    }
  };

  const getOrcamentoById = async (
    id: string,
  ): Promise<
    { success: true; data: Orcamento } | { success: false; error: string }
  > => {
    try {
      setLoading(true);
      const response = await api.get<Orcamento>(`/budgets/${id}`);
      return { success: true, data: response.data };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return {
          success: false,
          error: err.response?.data?.error || err.message,
        };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao buscar orçamento",
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrcamentos();
  }, [user, isAdmin, fetchOrcamentos]);

  return {
    orcamentos,
    loading,
    error,
    fetchOrcamentos,
    createInitialBudget,
    getOrcamentoById,
  };
};
