import { Link } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import AutocompleteCity from "../../components/form/AutocompleteCity";
import { useBudgets, Orcamento } from "../../hooks/useBudgets";
import { useAppStore } from "../../store/useAppStore";
import { useToast } from "../../context/ToastContext";
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";
import BudgetActionDropdown from "../../components/budgets/BudgetActionDropdown";
import UserAvatar from "../../components/common/UserAvatar";
import FieldTooltip from "../../components/common/FieldTooltip";
import { getCollaboratorInfo, formatPhoneMask, EMAIL_PATTERN } from "../../utils/userUtils";
import { LUCRO_LIQUIDO_OPTIONS } from "../../utils/budgetOptions";
import { resolverPorcentagem } from "../../utils/budgetMath";

export default function NewBudget() {
  const { addToast } = useToast();
  const { createInitialBudget, updateSolicitacao } = useBudgets();
  const { budgets, users, isLoading: loadingStore, fetchBudgets } = useAppStore();
  const { user, isAdmin, isAssociado } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editando, setEditando] = useState<Orcamento | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const formatLocation = (cidade?: string, estado?: string) => {
    const city = cidade?.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()) || "---";
    const state = estado?.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()) || "---";
    return `${city} - ${state}`;
  };

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nome_cliente: "",
      telefone_cliente: "",
      email_cliente: "",
      estado: "",
      id_cidade: "",
      cidade: "",
      observacao: "",
      estrutura: "Cerâmico",
      padrao: "Bifásico",
      consumo_mes: "0,00",
      valor_tarifa: "1,00",
      mao_obra: "100,00",
      equipamento_local: "60,00",
      km: "0",
      custo_km: "0,00",
      porcentagem_seguro: "1,00",
      porcentagem_imposto: "8,00",
      porcentagem_margem_seguranca: "3,00",
      lucro_liquido_perc: "20,00",
    },
  });

  const parseCurrencyToNumber = (value: string | number) => {
    if (!value) return 0;
    if (typeof value === "number") return value;
    const clean = value.toString().replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  const formatCurrency = (value: string | number) => {
    if (value === undefined || value === null) return "0,00";
    if (typeof value === "number") value = value.toFixed(2);
    const cleanValue = value.toString().replace(/\D/g, "");
    const amount = (parseInt(cleanValue || "0") / 100).toFixed(2);
    return amount.replace(".", ",");
  };

  const formatPercent = (value: string | number) => {
    if (value === undefined || value === null || value === "") return "0,00";
    if (typeof value === "number") value = value.toFixed(2);
    const cleanValue = value.toString().replace(/\D/g, "");
    if (!cleanValue) return "0,00";
    const integerPart = cleanValue.slice(0, -2) || "0";
    const decimalPart = cleanValue.slice(-2).padStart(2, "0");
    const formattedInteger = parseInt(integerPart, 10).toLocaleString("pt-BR");
    return `${formattedInteger},${decimalPart}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aberto":
        return "success";
      case "Fechado":
        return "error";
      default:
        return "warning";
    }
  };

  // Associado clica numa solicitação do histórico para corrigir o que digitou
  const editarSolicitacao = (o: Orcamento) => {
    setEditando(o);
    reset({
      nome_cliente: o.nome_cliente || "",
      telefone_cliente: o.telefone_cliente || "",
      email_cliente: o.email_cliente || "",
      estado: o.estado || "",
      id_cidade: o.id_cidade || "",
      cidade: o.cidade || "",
      observacao: o.observacao || "",
      estrutura: o.estrutura || "Cerâmico",
      padrao: o.padrao || "Bifásico",
      consumo_mes: formatCurrency(o.consumo_mes ?? 0),
      valor_tarifa: formatCurrency(o.valor_tarifa ?? 0),
      mao_obra: formatCurrency(o.mao_obra ?? 0),
      equipamento_local: formatCurrency(o.equipamento_local ?? 0),
      km: String(o.km ?? 0),
      custo_km: formatCurrency(o.custo_km ?? 0),
      porcentagem_seguro: formatPercent(o.porcentagem_seguro ?? 1),
      porcentagem_imposto: formatPercent(o.porcentagem_imposto ?? 8),
      porcentagem_margem_seguranca: formatPercent(resolverPorcentagem(o, "margem")),
      lucro_liquido_perc: formatPercent(o.lucro_liquido_perc ?? 20),
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelarEdicao = () => {
    setEditando(null);
    reset();
  };

  const onSubmit = async (data: {
    nome_cliente: string;
    telefone_cliente?: string;
    email_cliente?: string;
    estado: string;
    id_cidade: string;
    cidade: string;
    observacao: string;
    estrutura: string;
    padrao: string;
    consumo_mes: string;
    valor_tarifa: string;
    mao_obra?: string;
    equipamento_local?: string;
    km?: string | number;
    custo_km?: string;
    porcentagem_seguro?: string;
    porcentagem_imposto?: string;
    porcentagem_margem_seguranca?: string;
    lucro_liquido_perc?: string;
  }) => {
    setIsSaving(true);
    const payload = {
      ...data,
      consumo_mes: parseCurrencyToNumber(data.consumo_mes || "0"),
      valor_tarifa: parseCurrencyToNumber(data.valor_tarifa),
      mao_obra: parseCurrencyToNumber(data.mao_obra || "100,00"),
      equipamento_local: parseCurrencyToNumber(data.equipamento_local || "60,00"),
      km: Number(data.km) || 0,
      custo_km: parseCurrencyToNumber(data.custo_km || "0,00"),
      porcentagem_seguro: parseCurrencyToNumber(data.porcentagem_seguro || "1,00"),
      porcentagem_imposto: parseCurrencyToNumber(data.porcentagem_imposto || "8,00"),
      porcentagem_margem_seguranca: parseCurrencyToNumber(data.porcentagem_margem_seguranca || "0"),
      lucro_liquido_perc: parseCurrencyToNumber(data.lucro_liquido_perc || "20,00"),
    };

    try {
      if (editando) {
        const result = await updateSolicitacao(editando.id, payload);
        if (result.success) {
          const precificado = (result.data.preco_final_venda || 0) > 0;
          addToast(
            "success",
            "Solicitação Atualizada",
            precificado
              ? "Os dados foram salvos e o preço de venda foi recalculado."
              : "Os dados da solicitação foram salvos.",
          );
          cancelarEdicao();
          fetchBudgets();
        } else {
          addToast("error", "Falha ao Atualizar", result.error || "Não foi possível salvar as alterações.");
        }
        return;
      }

      const result = await createInitialBudget(payload);

      if (result.success) {
        addToast(
          "success",
          "Orçamento Enviado",
          "A solicitação foi registrada com sucesso!",
        );
        reset();
        fetchBudgets(); // Refresh store budgets
      } else {
        addToast(
          "error",
          "Falha ao Registrar",
          result.error || "Ocorreu um erro ao salvar o orçamento.",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Novo Orçamento | Sofia Engenharia"
        description="Criação de novas solicitações de orçamento solar."
      />
      <PageBreadcrumb pageTitle="Novo Orçamento" />

      <div className="space-y-6">
        <div ref={formRef} className="grid grid-cols-1 gap-6 scroll-mt-24">
          <ComponentCard title={editando ? "Editar Solicitação" : "Dados da Solicitação"}>
            {editando && (
              <div className="mb-5 flex flex-col gap-3 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 sm:flex-row sm:items-center sm:justify-between dark:border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-300">
                <div>
                  Editando a solicitação de <strong>{editando.nome_cliente}</strong>.
                  {(editando.preco_final_venda || 0) > 0 && (
                    <span className="block mt-0.5 text-xs">
                      Este orçamento já foi precificado. Ao salvar, o preço de venda e o retorno são recalculados; o kit definido pela administração não muda.
                    </span>
                  )}
                </div>
                <Button size="sm" variant="outline" type="button" onClick={cancelarEdicao}>
                  Cancelar edição
                </Button>
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <Label required>Nome do Cliente</Label>
                  <Controller
                    name="nome_cliente"
                    control={control}
                    rules={{ required: "Campo obrigatório" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Digite o nome"
                        error={!!errors.nome_cliente}
                        hint={errors.nome_cliente?.message}
                      />
                    )}
                  />
                </div>
                <div className="lg:col-span-1">
                  <Label>
                    Telefone (WhatsApp)
                    <FieldTooltip content="Utilizado para o envio da proposta via WhatsApp." />
                  </Label>
                  <Controller
                    name="telefone_cliente"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="(11) 99999-9999"
                        onChange={(e) => field.onChange(formatPhoneMask(e.target.value))}
                        value={field.value || ""}
                      />
                    )}
                  />
                </div>
                <div className="lg:col-span-1">
                  <Label>
                    E-mail
                    <FieldTooltip content="Utilizado para o envio da proposta via e-mail." />
                  </Label>
                  <Controller
                    name="email_cliente"
                    control={control}
                    rules={{
                      validate: (val) =>
                        !val || EMAIL_PATTERN.test(val) || "Informe um e-mail válido (ex: cliente@email.com)",
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="email"
                        placeholder="cliente@email.com"
                        error={!!errors.email_cliente}
                        hint={errors.email_cliente?.message}
                      />
                    )}
                  />
                </div>
                <div className="lg:col-span-1">
                  <Label required>Cidade</Label>
                  <Controller
                    name="id_cidade"
                    control={control}
                    rules={{ required: "Selecione uma cidade" }}
                    render={({ field }) => (
                      <AutocompleteCity
                        value={field.value}
                        onChange={(city) => {
                          field.onChange(city?.id || "");
                          setValue("cidade", city?.cidade || "");
                          setValue("estado", city?.estado || "");
                        }}
                        error={!!errors.id_cidade}
                      />
                    )}
                  />
                </div>
                <div className="lg:col-span-1">
                  <Label>Estado</Label>
                  <Controller
                    name="estado"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        readOnly
                        placeholder="Preenchido pela cidade"
                        className="bg-gray-50 dark:bg-white/[0.03] cursor-not-allowed"
                        value={field.value ? field.value.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()) : ""}
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <Label>Observação</Label>
                <Controller
                  name="observacao"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Observações do lead (telhado, fiação, etc.)"
                      rows={3}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label required>Estrutura</Label>
                  <Controller
                    name="estrutura"
                    control={control}
                    rules={{ required: "Campo obrigatório" }}
                    render={({ field }) => (
                      <Select
                        options={[
                          { value: "Carport", label: "Carport" },
                          { value: "Cerâmico", label: "Cerâmico" },
                          { value: "Fibrocimento", label: "Fibrocimento" },
                          { value: "Laje", label: "Laje" },
                          { value: "Metálico", label: "Metálico" },
                          { value: "Solo", label: "Solo" },
                        ]}
                        onChange={field.onChange}
                        value={field.value}
                        error={!!errors.estrutura}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label required>Padrão de Entrada</Label>
                  <Controller
                    name="padrao"
                    control={control}
                    rules={{ required: "Campo obrigatório" }}
                    render={({ field }) => (
                      <Select
                        options={[
                          { value: "Monofásico", label: "Monofásico" },
                          { value: "Bifásico", label: "Bifásico" },
                          { value: "Trifásico", label: "Trifásico" },
                        ]}
                        onChange={field.onChange}
                        value={field.value}
                        error={!!errors.padrao}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label required>Consumo Mensal (R$)</Label>
                  <Controller
                    name="consumo_mes"
                    control={control}
                    rules={{
                      required: "Campo obrigatório",
                      validate: (val) => parseCurrencyToNumber(val) > 0 || "Informe o consumo mensal (maior que zero)",
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrency(e.target.value))
                        }
                        placeholder="0,00"
                        error={!!errors.consumo_mes}
                        hint={errors.consumo_mes?.message}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label required>Tarifa de Energia (R$)</Label>
                  <Controller
                    name="valor_tarifa"
                    control={control}
                    rules={{
                      required: "Campo obrigatório",
                      validate: (val) => parseCurrencyToNumber(val) > 0 || "Informe a tarifa (maior que zero)",
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrency(e.target.value))
                        }
                        error={!!errors.valor_tarifa}
                        hint={errors.valor_tarifa?.message}
                      />
                    )}
                  />
                </div>
              </div>

              {isAssociado && (
                <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/[0.05]">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                      Custos Operacionais e Margem Regional
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Defina os custos operacionais da sua equipe local e a sua margem de lucro para esta solicitação.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <div>
                      <Label required>
                        Mão de Obra (R$)
                        <FieldTooltip content="Custo da mão de obra de instalação local." />
                      </Label>
                      <Controller
                        name="mao_obra"
                        control={control}
                        rules={{ required: "Campo obrigatório" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                            error={!!errors.mao_obra}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label required>
                        Equipamento Local (R$)
                        <FieldTooltip content="Custos de infraestrutura e materiais locais complementares." />
                      </Label>
                      <Controller
                        name="equipamento_local"
                        control={control}
                        rules={{ required: "Campo obrigatório" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                            error={!!errors.equipamento_local}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label>
                        Distância (km)
                        <FieldTooltip content="Quilometragem total estimada de deslocamento." />
                      </Label>
                      <Controller
                        name="km"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            placeholder="0"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label>
                        Custo por km (R$)
                        <FieldTooltip content="Valor cobrado por quilômetro rodado." />
                      </Label>
                      <Controller
                        name="custo_km"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(formatCurrency(e.target.value))}
                            placeholder="0,00"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label required>
                        Seguro (%)
                        <FieldTooltip content="Percentual de seguro da instalação." />
                      </Label>
                      <Controller
                        name="porcentagem_seguro"
                        control={control}
                        rules={{ required: "Campo obrigatório" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(formatPercent(e.target.value))}
                            placeholder="1,00"
                            error={!!errors.porcentagem_seguro}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label required>
                        Imposto sobre Venda (%)
                        <FieldTooltip content="Alíquota de imposto sobre serviços/venda." />
                      </Label>
                      <Controller
                        name="porcentagem_imposto"
                        control={control}
                        rules={{ required: "Campo obrigatório" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(formatPercent(e.target.value))}
                            placeholder="8,00"
                            error={!!errors.porcentagem_imposto}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label required>
                        Margem de Segurança (%)
                        <FieldTooltip content="Reserva para imprevistos da execução, como retrabalho ou retorno ao local. Calculada sobre o custo direto: kit, mão de obra, equipamento local e homologação (sem o km)." />
                      </Label>
                      <Controller
                        name="porcentagem_margem_seguranca"
                        control={control}
                        rules={{ required: "Campo obrigatório" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(formatPercent(e.target.value))}
                            placeholder="3,00"
                            error={!!errors.porcentagem_margem_seguranca}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Label required>
                        Lucro Líquido (%)
                        <FieldTooltip content="Margem de lucro pretendida para a proposta." />
                      </Label>
                      <Controller
                        name="lucro_liquido_perc"
                        control={control}
                        rules={{ required: "Campo obrigatório" }}
                        render={({ field }) => (
                          <Select
                            options={LUCRO_LIQUIDO_OPTIONS}
                            onChange={field.onChange}
                            value={field.value}
                            error={!!errors.lucro_liquido_perc}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={cancelarEdicao}>
                  {editando ? "Cancelar" : "Limpar"}
                </Button>
                <Button type="submit" loading={isSaving} disabled={loadingStore}>
                  {editando ? "Salvar Alterações" : "Salvar Solicitação"}
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>

        <ComponentCard
          title="Histórico de Solicitações"
          desc={isAssociado ? "Clique em uma solicitação para corrigir os dados dela." : undefined}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50/50 dark:bg-white/[0.02]">
                  <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Data
                  </th>
                  <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Cliente
                  </th>
                  <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Vendedor
                  </th>
                  <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Local
                  </th>
                  <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Situação
                  </th>
                  <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                    Proposta
                  </th>
                  {isAdmin && (
                    <th className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {loadingStore ? (
                  [...Array(5)].map((_, index) => (
                    <tr key={index}>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-5 py-4">
                        <Skeleton className="h-8 w-24 rounded-lg" />
                      </td>
                      {isAdmin && (
                        <td className="px-5 py-4">
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </td>
                      )}
                    </tr>
                  ))
                ) : budgets.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="px-5 py-4 text-center text-gray-500">
                      Nenhum orçamento encontrado.
                    </td>
                  </tr>
                ) : (
                  budgets.map((o, index) => {
                    const isRefined = o.preco_final_venda !== undefined && o.preco_final_venda > 0;
                    const isLastRow = index === budgets.length - 1;
                    const collab = getCollaboratorInfo(o, user, users);
                    return (
                      <tr
                        key={o.id}
                        onClick={isAssociado ? () => editarSolicitacao(o as Orcamento) : undefined}
                        className={`hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors ${isAssociado ? "cursor-pointer" : ""} ${editando?.id === o.id ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}
                      >
                        <td className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          {new Date(o.created).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {o.nome_cliente}
                        </td>
                        <td className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar user={collab} size="sm" />
                            <span>{collab.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          {formatLocation(o.cidade, o.estado)}
                        </td>
                        <td className="px-5 py-4 text-theme-sm">
                          <Badge color={getStatusColor(o.situacao)} size="sm">
                            {o.situacao}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-theme-sm" onClick={(e) => e.stopPropagation()}>
                          {isRefined ? (
                            <BudgetActionDropdown budgetId={o.id} clientName={o.nome_cliente || ""} phone={o.telefone_cliente as string} email={o.email_cliente as string} />
                          ) : (
                            <div className="inline-flex rounded-lg opacity-60">
                              <button
                                disabled
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200/50 rounded-l-lg cursor-not-allowed dark:bg-white/[0.02] dark:border-white/[0.05] dark:text-gray-500"
                                title={
                                  isAdmin
                                    ? "Preencha os dados gerenciais antes de visualizar/imprimir"
                                    : "Aguardando precificação do kit pela administração"
                                }
                              >
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Visualizar
                              </button>
                              <button
                                disabled
                                className="inline-flex items-center px-1.5 py-1 text-xs font-semibold text-gray-400 bg-gray-50 border-y border-r border-gray-200/50 rounded-r-lg cursor-not-allowed dark:bg-white/[0.02] dark:border-white/[0.05] dark:text-gray-500 border-l border-l-gray-200/30"
                              >
                                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-4 text-theme-sm">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === o.id ? null : o.id);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded-full dark:hover:bg-white/[0.08] transition-colors"
                              >
                                <svg className="size-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                </svg>
                              </button>

                              {activeMenuId === o.id && (
                                <div
                                  className={`absolute right-0 z-50 w-28 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 animate-fadeIn ${isLastRow ? "bottom-full mb-1" : "top-full mt-1"}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link
                                    to={`/orcamentos/gerenciamento?id=${o.id}`}
                                    onClick={() => setActiveMenuId(null)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left font-medium"
                                  >
                                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Refinar
                                  </Link>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
