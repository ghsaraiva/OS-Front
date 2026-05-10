import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import { useOrcamentos, Orcamento } from '../../hooks/useOrcamentos';
import { 
  User, 
  MapPin, 
  Settings, 
  DollarSign, 
  Calendar, 
  FileText, 
  ArrowLeft,
  Printer
} from 'lucide-react';

export default function DetalhesOrcamento() {
  const { id } = useParams<{ id: string }>();
  const { getOrcamentoById } = useOrcamentos();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetalhes = async () => {
      if (!id) return;
      const result = await getOrcamentoById(id);
      if (result.success) {
        setOrcamento(result.data);
      } else {
        setError(result.error || 'Erro ao carregar detalhes do orçamento.');
      }
      setLoading(false);
    };

    fetchDetalhes();
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !orcamento) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-gray-500 dark:text-gray-400">{error || 'Orçamento não encontrado.'}</p>
        <Link to="/orcamentos/novo" className="text-brand-500 hover:underline flex items-center gap-2">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageMeta title={`Detalhes Orçamento | ${orcamento.nome_cliente}`} description="Visualização detalhada da solicitação de orçamento." />
      <PageBreadcrumb pageTitle="Orçamentos - Detalhes" />

      <div className="space-y-6">
        {/* Header de Ações */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link 
            to="/orcamentos/novo" 
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="size-4" />
            Voltar para Listagem
          </Link>
          <button 
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs"
          >
            <Printer className="size-4" />
            Imprimir Orçamento
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card 1: Informações do Cliente */}
          <ComponentCard title={
            <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
              <User className="size-5 text-brand-500" />
              <span>Dados do Cliente</span>
            </div>
          }>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Nome Completo</p>
                <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">{orcamento.nome_cliente}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Estado</p>
                  <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{orcamento.estado}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Cidade</p>
                  <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{orcamento.cidade}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="size-3" /> Data da Solicitação
                </p>
                <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{new Date(orcamento.created).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Vendedor Associado</p>
                <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{orcamento.expand?.user_id?.name || '---'}</p>
              </div>
            </div>
          </ComponentCard>

          {/* Card 2: Especificações Técnicas */}
          <ComponentCard title={
            <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
              <Settings className="size-5 text-brand-500" />
              <span>Especificações do Local</span>
            </div>
          }>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Estrutura</p>
                  <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{orcamento.estrutura}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Padrão de Entrada</p>
                  <p className="mt-1 text-sm text-gray-800 dark:text-white/90">{orcamento.padrao}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FileText className="size-3" /> Observações
                </p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-400 whitespace-pre-wrap italic">
                  {orcamento.observacao || "Sem observações adicionais."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Situação Atual</p>
                  <span className="mt-1 inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {orcamento.situacao}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status de Venda</p>
                  <p className="mt-1 text-sm text-gray-800 dark:text-white/90 font-medium">{orcamento.situacao_venda}</p>
                </div>
              </div>
            </div>
          </ComponentCard>

          {/* Card 3: Dados Financeiros Iniciais */}
          <ComponentCard className="lg:col-span-2" title={
            <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
              <DollarSign className="size-5 text-brand-500" />
              <span>Dados Financeiros (Base)</span>
            </div>
          }>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Consumo Médio</p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(orcamento.consumo_mes)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Valor Tarifa</p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(orcamento.valor_tarifa)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Mão de Obra</p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(orcamento.mao_obra)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Equip. Local</p>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(orcamento.equipamento_local)}</p>
              </div>
              <div className="p-4 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-100 dark:border-success-500/20">
                <p className="text-xs font-medium uppercase text-success-600 dark:text-success-400">Lucro Desejado</p>
                <p className="mt-1 text-lg font-bold text-success-700 dark:text-success-300">{orcamento.lucro_liquido_perc}%</p>
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
