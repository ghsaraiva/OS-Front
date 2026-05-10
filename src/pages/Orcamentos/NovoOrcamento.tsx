import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useOrcamentos } from "../../hooks/useOrcamentos";
import { useToast } from "../../context/ToastContext";

interface IBGEUF {
  sigla: string;
  nome: string;
}

interface IBGECidade {
  nome: string;
}

export default function NovoOrcamento() {
  const { addToast } = useToast();
  const {
    orcamentos,
    loading: loadingOrcamentos,
    createInitialBudget,
  } = useOrcamentos();
  const [ufs, setUfs] = useState<{ value: string; label: string }[]>([]);
  const [cidades, setCidades] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [loadingCidades, setLoadingCidades] = useState(false);

  const { control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      nome_cliente: "",
      estado: "",
      cidade: "",
      observacao: "",
      estrutura: "",
      padrao: "",
      consumo_mes: "",
      valor_tarifa: "0,85",
      mao_obra: "100,00",
      equipamento_local: "60,00",
      lucro_liquido_perc: "20",
    },
  });

  // Watch específicos
  const watchedEstado = watch("estado");

  // Carregar UFs
  useEffect(() => {
    fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
    )
      .then((res) => res.json())
      .then((data: IBGEUF[]) => {
        setUfs(data.map((uf) => ({ value: uf.sigla, label: uf.nome })));
      });
  }, []);

  // Carregar Cidades
  useEffect(() => {
    if (watchedEstado) {
      setLoadingCidades(true);
      fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${watchedEstado}/municipios?orderBy=nome`,
      )
        .then((res) => res.json())
        .then((data: IBGECidade[]) => {
          setCidades(
            data.map((city) => ({ value: city.nome, label: city.nome })),
          );
          setLoadingCidades(false);
        });
    } else {
      setCidades([]);
      setValue("cidade", "");
    }
  }, [watchedEstado, setValue]);

  const formatCurrency = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    const amount = (parseInt(cleanValue || "0") / 100).toFixed(2);
    return amount.replace(".", ",");
  };

  const parseCurrencyToNumber = (value: string) => {
    if (!value) return 0;
    const clean = value.replace(",", ".");
    return parseFloat(clean);
  };

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      consumo_mes: parseCurrencyToNumber(data.consumo_mes || "0"),
      valor_tarifa: parseCurrencyToNumber(data.valor_tarifa),
      mao_obra: parseCurrencyToNumber(data.mao_obra),
      equipamento_local: parseCurrencyToNumber(data.equipamento_local),
      lucro_liquido_perc: parseInt(data.lucro_liquido_perc),
    };

    const result = await createInitialBudget(payload);

    if (result.success) {
      addToast(
        "success",
        "Orçamento Enviado",
        "A solicitação foi registrada com sucesso!",
      );
      reset();
    } else {
      addToast(
        "error",
        "Falha ao Registrar",
        result.error || "Ocorreu um erro ao salvar o orçamento.",
      );
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
                  <Label>Nome do Cliente</Label>
                  <Controller
                    name="nome_cliente"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Input {...field} placeholder="Digite o nome" required />
                    )}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Controller
                    name="estado"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={ufs}
                        placeholder="Selecione o Estado"
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Controller
                    name="cidade"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={cidades}
                        placeholder={
                          loadingCidades
                            ? "Carregando..."
                            : "Selecione a Cidade"
                        }
                        onChange={field.onChange}
                        value={field.value}
                        disabled={!watchedEstado || loadingCidades}
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
                  <Label>Estrutura</Label>
                  <Controller
                    name="estrutura"
                    control={control}
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
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>Padrão de Entrada</Label>
                  <Controller
                    name="padrao"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={[
                          { value: "Monofásico", label: "Monofásico" },
                          { value: "Bifásico", label: "Bifásico" },
                          { value: "Trifásico", label: "Trifásico" },
                        ]}
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label>Consumo Mês (R$)</Label>
                  <Controller
                    name="consumo_mes"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrency(e.target.value))
                        }
                        placeholder="0,00"
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>Tarifa (R$)</Label>
                  <Controller
                    name="valor_tarifa"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrency(e.target.value))
                        }
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>Mão de Obra (R$)</Label>
                  <Controller
                    name="mao_obra"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrency(e.target.value))
                        }
                      />
                    )}
                  />
                </div>
                <div>
                  <Label>Equipamento (R$)</Label>
                  <Controller
                    name="equipamento_local"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(formatCurrency(e.target.value))
                        }
                      />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="lg:col-span-1">
                  <Label>Lucro Líquido %</Label>
                  <Controller
                    name="lucro_liquido_perc"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={Array.from({ length: 16 }, (_, i) => ({
                          value: (i + 10).toString(),
                          label: `${i + 10}%`,
                        }))}
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => reset()}>
                  Limpar
                </Button>
                <Button type="submit" disabled={loadingOrcamentos}>
                  Salvar Solicitação
                </Button>
              </div>
            </form>
          </ComponentCard>
        </div>

        <ComponentCard title="Histórico de Solicitações">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto no-scrollbar">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Data
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Associado
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Nome
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Estado
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Cidade
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Situação
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Venda
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {orcamentos.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        {new Date(o.created).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        {o.expand?.user_id?.name || "---"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90 font-medium">
                        {o.nome_cliente}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        {o.estado}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        {o.cidade}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-400">
                            {o.situacao}
                          </span>
                          <Link to={`/orcamentos/detalhes/${o.id}`} className="text-gray-400 hover:text-brand-500">
                            🖨️
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                        {o.situacao_venda}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
