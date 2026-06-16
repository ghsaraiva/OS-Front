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
import { useBudgets } from "../../hooks/useBudgets";
import { useAppStore } from "../../store/useAppStore";
import { useToast } from "../../context/ToastContext";
import { useState, useEffect } from 'react';
import { Skeleton } from "../../components/ui/Skeleton";
import { useAuth } from "../../context/AuthContext";

export default function NewBudget() {
  const { addToast } = useToast();
  const { createInitialBudget } = useBudgets();
  const { budgets, isLoading: loadingStore, fetchBudgets } = useAppStore();
  const { isAdmin } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const formatLocation = (cidade?: string, estado?: string) => {
    const city = cidade?.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()) || "---";
    const state = estado?.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()) || "---";
    return `${city} - ${state}`;
  };
  
  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      nome_cliente: "",
      estado: "",
      id_cidade: "",
      cidade: "",
      observacao: "",
      estrutura: "",
      padrao: "",
      consumo_mes: "",
      valor_tarifa: "0,85",
    },
  });

  const parseCurrencyToNumber = (value: string) => {
    if (!value) return 0;
    const clean = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(clean);
  };

  const formatCurrency = (value: string | number) => {
    if (value === undefined || value === null) return "0,00";
    if (typeof value === "number") value = value.toFixed(2);
    const cleanValue = value.toString().replace(/\D/g, "");
    const amount = (parseInt(cleanValue || "0") / 100).toFixed(2);
    return amount.replace(".", ",");
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

  const onSubmit = async (data: {
    nome_cliente: string;
    estado: string;
    id_cidade: string;
    cidade: string;
    observacao: string;
    estrutura: string;
    padrao: string;
    consumo_mes: string;
    valor_tarifa: string;
  }) => {
    setIsSaving(true);
    const payload = {
      ...data,
      consumo_mes: parseCurrencyToNumber(data.consumo_mes || "0"),
      valor_tarifa: parseCurrencyToNumber(data.valor_tarifa),
    };

    try {
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
        title="Novo Orçamento | Solar Admin"
        description="Criação de novas solicitações de orçamento solar."
      />
      <PageBreadcrumb pageTitle="Orçamentos - Novo Orçamento" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <ComponentCard title="Dados da Solicitação">
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
                <div>
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
                  <Label required>Consumo Mês (R$)</Label>
                  <Controller
                    name="consumo_mes"
                    control={control}
                    rules={{ required: "Campo obrigatório" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrency(e.target.value))
                        }
                        placeholder="0,00"
                        error={!!errors.consumo_mes}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label required>Tarifa (R$)</Label>
                  <Controller
                    name="valor_tarifa"
                    control={control}
                    rules={{ required: "Campo obrigatório" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrency(e.target.value))
                        }
                        error={!!errors.valor_tarifa}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => reset()}>
                  Limpar
                </Button>
                <Button type="submit" loading={isSaving} disabled={loadingStore}>
                  Salvar Solicitação
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>

        <ComponentCard title="Histórico de Solicitações">
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
                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
                      >
                        <td className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          {new Date(o.created).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {o.nome_cliente}
                        </td>
                        <td className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          {o.expand?.user_id?.name || "---"}
                        </td>
                        <td className="px-5 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                          {formatLocation(o.cidade, o.estado)}
                        </td>
                        <td className="px-5 py-4 text-theme-sm">
                          <Badge color={getStatusColor(o.situacao)} size="sm">
                            {o.situacao}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-theme-sm">
                          {isRefined ? (
                            <div className="inline-flex rounded-lg shadow-sm">
                              <Link
                                to={`/budgets/details/${o.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-l-lg transition-colors border border-brand-200/50 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20"
                              >
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Visualizar
                              </Link>
                              <button
                                type="button"
                                className="inline-flex items-center px-1.5 py-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-r-lg transition-colors border-y border-r border-brand-200/50 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 border-l border-l-brand-200/30 dark:border-l-brand-500/10"
                                title="Mais opções (Imprimir PDF em breve)"
                              >
                                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex rounded-lg opacity-60">
                              <button
                                disabled
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-200/50 rounded-l-lg cursor-not-allowed dark:bg-white/[0.02] dark:border-white/[0.05] dark:text-gray-500"
                                title="Preencha os dados gerenciais antes de visualizar/imprimir"
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
                                    to={`/budgets/management?id=${o.id}`}
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
