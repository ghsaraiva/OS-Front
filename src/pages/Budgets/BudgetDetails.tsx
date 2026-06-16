import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import { useAppStore } from "../../store/useAppStore";
import { Orcamento } from "../../hooks/useBudgets";
import {
  User,
  Settings,
  DollarSign,
  ArrowLeft,
  Printer,
  Zap,
  Box,
  Cpu,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Bolt,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function BudgetDetails() {
  const { isAdmin } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { budgets, isLoading, updateBudgetInStore } = useAppStore();
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);

  const { addToast } = useToast();
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  useEffect(() => {
    if (id && budgets.length > 0) {
      const found = budgets.find((b) => b.id === id);
      setOrcamento(found || null);
    }
  }, [id, budgets]);

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatInputCurrency = (value: string | number) => {
    if (value === undefined || value === null) return "0,00";
    if (typeof value === "number") value = value.toFixed(2);
    const cleanValue = value.toString().replace(/\D/g, "");
    const amount = (parseInt(cleanValue || "0") / 100).toFixed(2);
    return amount.replace(".", ",");
  };

  const parseCurrencyToNumber = (value: string) => {
    if (!value) return 0;
    const clean = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(clean);
  };

  const handleSavePrice = async () => {
    if (!orcamento) return;
    const newPrice = parseCurrencyToNumber(tempPrice);

    if (isNaN(newPrice) || newPrice <= 0) {
      addToast(
        "error",
        "Valor Inválido",
        "O preço sugerido de venda deve ser maior que zero.",
      );
      return;
    }

    setIsSavingPrice(true);
    try {
      const TAXA_SEGURO = 0.015;
      const TAXA_IMPOSTO = 0.15;

      const seguro = Number((newPrice * TAXA_SEGURO).toFixed(2));
      const kitLicenciado = orcamento.valor_kit_final || 0;
      const imposto = Number(
        (Math.max(newPrice - kitLicenciado, 0) * TAXA_IMPOSTO).toFixed(2),
      );
      const margemSeguranca = orcamento.margem_seguranca || 0;
      const custoDireto =
        (orcamento.valor_kit_final || 0) +
        (orcamento.valor_mao_obra_final || 0) +
        (orcamento.valor_equip_local_final || 0) +
        (orcamento.valor_homologacao || 0);
      const custoProjeto = Number(
        (custoDireto + margemSeguranca + seguro + imposto).toFixed(2),
      );
      const lucroLiquidoPrevisto = Number((newPrice - custoProjeto).toFixed(2));
      const lucroLiquidoPerc = Number(
        ((lucroLiquidoPrevisto / newPrice) * 100).toFixed(2),
      );

      const response = await api.patch<Orcamento>(`/budgets/${orcamento.id}`, {
        preco_final_venda: newPrice,
        seguro,
        imposto,
        custo_projeto: custoProjeto,
        lucro_liquido_previsto: lucroLiquidoPrevisto,
        lucro_liquido_perc: lucroLiquidoPerc,
      });

      const updatedRecord = response.data;

      // Sync local state and store
      setOrcamento(updatedRecord as any);
      updateBudgetInStore(updatedRecord as any);

      addToast(
        "success",
        "Preço Atualizado",
        "O preço de venda e todos os fatiamentos foram recalculados e atualizados!",
      );
      setIsEditingPrice(false);
    } catch (err) {
      addToast(
        "error",
        "Erro ao Salvar",
        "Não foi possível salvar o novo preço de venda.",
      );
    } finally {
      setIsSavingPrice(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto":
        return "success";
      case "Fechado":
        return "error";
      default:
        return "info";
    }
  };

  if (isLoading && !orcamento) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-gray-500 dark:text-gray-400">
          Orçamento não encontrado.
        </p>
        <Link
          to="/budgets/all"
          className="text-brand-500 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </div>
    );
  }

  const isPreenchido =
    orcamento.preco_final_venda !== undefined &&
    orcamento.preco_final_venda > 0;
  if (!isPreenchido) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center px-4">
        <AlertCircle className="size-16 text-warning-500 animate-bounce" />
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-2">
          Orçamento Não Refinado
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Este orçamento ainda não passou pelo refinamento gerencial. Por favor,
          acesse a página gerencial para preenchê-lo antes de tentar visualizar
          ou imprimir.
        </p>
        <div className="flex gap-4 mt-2">
          <Link
            to="/budgets/all"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="size-4" /> Voltar para Listagem
          </Link>
          <Link
            to="/budgets/management"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Ir para Refinamento Gerencial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Detalhes Orçamento | ${orcamento.nome_cliente}`}
        description="Visualização detalhada da solicitação de orçamento solar."
      />
      <PageBreadcrumb pageTitle="Orçamentos - Visualização Detalhada" />

      <div className="space-y-6 print:space-y-4 print:p-0">
        {/* Header de Ações - Escondido na Impressão */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <Link
            to="/budgets/all"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="size-4" />
            Voltar para Listagem
          </Link>
          <div className="flex gap-3">
            {isAdmin && orcamento && (
              <Link
                to={`/budgets/management?id=${orcamento.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/[0.05] dark:bg-white/[0.02] dark:text-white/90 dark:hover:bg-white/[0.05]"
              >
                <TrendingUp className="size-4" />
                Refinar Gerencial
              </Link>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 shadow-theme-xs transition-colors"
            >
              <Printer className="size-4" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Topo do Orçamento: Status e Identificação */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border border-gray-200 rounded-2xl dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-500/10">
              <Bolt className="size-6 text-brand-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Orçamento #{orcamento.id.slice(-6).toUpperCase()}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Criado em{" "}
                {new Date(orcamento.created).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-end">
              <p className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                Situação
              </p>
              <Badge color={getStatusColor(orcamento.situacao)} size="md">
                {orcamento.situacao}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Coluna 1: Dados do Cliente e Local */}
          <div className="space-y-6 lg:col-span-1">
            <ComponentCard
              title={
                <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
                  <User className="size-5 text-brand-500" />
                  <span>1. Dados do Cliente</span>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Nome Completo
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {orcamento.nome_cliente}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase">
                      Cidade
                    </p>
                    <p className="text-sm text-gray-800 dark:text-white/90">
                      {orcamento.cidade}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase">
                      Estado
                    </p>
                    <p className="text-sm text-gray-800 dark:text-white/90">
                      {orcamento.estado
                        ?.toLowerCase()
                        .replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase())}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Responsável
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {orcamento.expand?.user_id?.name || "Sistema"}
                  </p>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard
              title={
                <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
                  <Settings className="size-5 text-brand-500" />
                  <span>Parâmetros Técnicos</span>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase">
                      Estrutura
                    </p>
                    <p className="text-sm text-gray-800 dark:text-white/90">
                      {orcamento.estrutura}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase">
                      Padrão
                    </p>
                    <p className="text-sm text-gray-800 dark:text-white/90">
                      {orcamento.padrao}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Observações
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1 leading-relaxed">
                    {orcamento.observacao || "Nenhuma observação registrada."}
                  </p>
                </div>
              </div>
            </ComponentCard>

            {/* 6. GARANTIAS E SUPORTE (Na coluna lateral para melhor uso de espaço) */}
            <ComponentCard
              title={
                <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
                  <ShieldCheck className="size-5 text-brand-500" />
                  <span>6. Garantias e Suporte</span>
                </div>
              }
            >
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Garantia Fábrica (Módulo)
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {orcamento.garantia_fabrica_modulo || "15 anos"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Garantia Eficiência (Módulo)
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {orcamento.garantia_eficiencia_modulo || "25 anos"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Garantia Inversor
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {orcamento.garantia_inversor || "10 anos"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Garantia Instalação
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {orcamento.garantia_instalacao || "1 ano"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Garantia Estrutura
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {orcamento.garantia_estrutura || "10 anos"}
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Monitoramento
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {orcamento.monitoramento_inversor || "Wi-Fi"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    Material Estrutura
                  </p>
                  <p className="text-sm text-gray-800 dark:text-white/90">
                    {orcamento.material_estrutura || "Alumínio/Aço Galvanizado"}
                  </p>
                </div>
              </div>
            </ComponentCard>
          </div>

          {/* Coluna 2 e 3: Sistema, Equipamentos e Financeiro */}
          <div className="space-y-6 lg:col-span-2">
            {/* 2. Sistema e Viabilidade Financeira */}
            <ComponentCard
              title={
                <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
                  <TrendingUp className="size-5 text-brand-500" />
                  <span>2. Sistema e Viabilidade Financeira</span>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">Sistema:</span>
                    <span className="text-sm font-bold text-brand-600">
                      {orcamento.kwp_sistema?.toFixed(2) || "0,00"} kWp
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">Geração:</span>
                    <span className="text-sm font-bold text-success-600">
                      {(orcamento.geracao_mes || 0)
                        .toFixed(2)
                        .replace(".", ",")}{" "}
                      kWh/mês
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">
                      Quantidade da Composição:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {orcamento.qtd_paineis || 0} un.
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">
                      Área Estimada:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {orcamento.area_estimada?.toFixed(2) || "0,00"} m²
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">Média do Mês:</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {orcamento.geracao_mes?.toFixed(2) || "0,00"} kWh
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">Média do Ano:</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {orcamento.geracao_ano?.toFixed(2) || "0,00"} kWh
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">
                      Valor Pago por Mês:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatCurrency(orcamento.valor_pago_mes)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">
                      Valor Pago por Ano:
                    </span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatCurrency(orcamento.valor_pago_ano)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">
                      Porcentagem de Redução:
                    </span>
                    <span className="text-sm font-bold text-success-600">
                      {(orcamento.porcentagem_reducao
                        ? orcamento.porcentagem_reducao * 100
                        : 0
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2 dark:border-gray-800">
                    <span className="text-sm text-gray-500">
                      Retorno Financeiro:
                    </span>
                    <span className="text-sm font-bold text-amber-700">
                      {orcamento.tempo_retorno || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </ComponentCard>

            {/* 3. Detalhamento de Equipamentos */}
            <ComponentCard
              title={
                <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
                  <Box className="size-5 text-brand-500" />
                  <span>3. Detalhamento de Equipamentos</span>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Módulos */}
                <div className="p-4 border border-gray-100 rounded-xl dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                  <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-800 dark:text-white/90 uppercase tracking-wider">
                    <Zap className="size-4 text-amber-500" /> Módulos
                    Fotovoltaicos
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Marca/Modelo:</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {orcamento.marca_painel || "---"}{" "}
                        {orcamento.potencia_painel}W
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Quantidade:</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {orcamento.qtd_paineis || 0} un.
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Peso Unitário:</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {orcamento.peso_painel || 0} kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inversores */}
                <div className="p-4 border border-gray-100 rounded-xl dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                  <h4 className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-800 dark:text-white/90 uppercase tracking-wider">
                    <Cpu className="size-4 text-blue-500" /> Inversores
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Marca/Modelo:</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {orcamento.marca_inversor || "---"}{" "}
                        {orcamento.modelo_inversor}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Potência/Tensão:</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {orcamento.potencia_inversor}W /{" "}
                        {orcamento.tensao_inversor}V
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Quantidade:</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {orcamento.qtd_inversores || 0} un.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* kWp Mínimo Recomendado */}
              <div className="mt-4 p-3 rounded-lg bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/20 flex items-center justify-between">
                <span className="text-xs font-medium text-brand-700 dark:text-brand-400 uppercase">
                  kWp Mínimo Recomendado para o local:
                </span>
                <span className="text-sm font-bold text-brand-800 dark:text-white/90">
                  {orcamento.kwp_minimo?.toFixed(2) || "0,00"} kWp
                </span>
              </div>
            </ComponentCard>

            {/* Matemática do Negócio (Financeiro Detalhado) */}
            <ComponentCard
              title={
                <div className="flex items-center gap-2 text-gray-800 dark:text-white/90">
                  <DollarSign className="size-5 text-brand-500" />
                  <span>Matemática do Negócio</span>
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Custos Diretos */}
                <div className="md:col-span-2">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02]">
                        <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                          Item de Custo
                        </th>
                        <th className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      <tr className="hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                        <td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 font-medium">
                          Kit Fornecedor (Bruto)
                        </td>
                        <td className="px-5 py-4 text-end text-theme-sm font-bold text-gray-800 dark:text-white/90">
                          {formatCurrency(orcamento.valor_kit)}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                        <td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 font-medium">
                          Kit Licenciado ({orcamento.porcentagem_kit}%)
                        </td>
                        <td className="px-5 py-4 text-end text-theme-sm font-bold text-gray-800 dark:text-white/90">
                          {formatCurrency(orcamento.valor_kit_final)}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                        <td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 font-medium">
                          Mão de Obra Total
                        </td>
                        <td className="px-5 py-4 text-end text-theme-sm font-bold text-gray-800 dark:text-white/90">
                          {formatCurrency(orcamento.valor_mao_obra_final)}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                        <td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 font-medium">
                          Equipamento Local Total
                        </td>
                        <td className="px-5 py-4 text-end text-theme-sm font-bold text-gray-800 dark:text-white/90">
                          {formatCurrency(orcamento.valor_equip_local_final)}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors">
                        <td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-400 font-medium">
                          Homologação
                        </td>
                        <td className="px-5 py-4 text-end text-theme-sm font-bold text-gray-800 dark:text-white/90">
                          {formatCurrency(orcamento.valor_homologacao)}
                        </td>
                      </tr>
                      <tr className="bg-brand-50/50 dark:bg-brand-500/5 transition-colors border-t border-brand-100 dark:border-brand-500/20">
                        <td className="px-5 py-4 text-theme-sm font-bold text-brand-600 dark:text-brand-400 uppercase">
                          CUSTO TOTAL DO PROJETO
                        </td>
                        <td className="px-5 py-4 text-end text-theme-sm font-bold text-brand-700 dark:text-white">
                          {formatCurrency(orcamento.custo_projeto)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Impostos e Lucros */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="size-3" /> Fatiamento
                    </h5>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Impostos (15%):</span>
                      <span className="font-medium text-red-500">
                        {formatCurrency(orcamento.imposto)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Seguro (1.5%):</span>
                      <span className="font-medium text-gray-600 dark:text-gray-400">
                        {formatCurrency(orcamento.seguro)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        Margem Segurança (3%):
                      </span>
                      <span className="font-medium text-orange-500">
                        {formatCurrency(orcamento.margem_seguranca)}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-100 dark:border-success-500/20">
                    <p className="text-[10px] font-bold text-success-600 uppercase tracking-widest">
                      Lucro Previsto ({orcamento.lucro_liquido_perc}%)
                    </p>
                    <p className="text-xl font-bold text-success-700 dark:text-success-400">
                      {formatCurrency(orcamento.lucro_liquido_previsto)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preço de Venda Final */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/20">
                    <DollarSign className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Preço de Venda Sugerido
                    </p>
                    {isEditingPrice ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl font-bold text-gray-800 dark:text-white/90">
                          R$
                        </span>
                        <input
                          type="text"
                          value={tempPrice}
                          onChange={(e) =>
                            setTempPrice(formatInputCurrency(e.target.value))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSavePrice();
                            else if (e.key === "Escape")
                              setIsEditingPrice(false);
                          }}
                          disabled={isSavingPrice}
                          className="w-40 px-3 py-1 text-lg font-bold text-gray-800 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          autoFocus
                        />
                        <button
                          onClick={handleSavePrice}
                          disabled={isSavingPrice}
                          className="p-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                          title="Salvar"
                        >
                          <Check className="size-5" />
                        </button>
                        <button
                          onClick={() => setIsEditingPrice(false)}
                          disabled={isSavingPrice}
                          className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                          title="Cancelar"
                        >
                          <X className="size-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <p className="text-3xl font-black text-gray-800 dark:text-white/90">
                          {formatCurrency(orcamento.preco_final_venda)}
                        </p>
                        <button
                          onClick={() => {
                            setTempPrice(
                              formatInputCurrency(
                                orcamento.preco_final_venda || 0,
                              ),
                            );
                            setIsEditingPrice(true);
                          }}
                          className="p-1 text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 print:hidden"
                          title="Editar Preço"
                        >
                          <Edit2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] text-gray-400 italic">
                    Válido por 7 dias conforme cotação do kit.
                  </p>
                </div>
              </div>
            </ComponentCard>
          </div>
        </div>
      </div>
    </>
  );
}
