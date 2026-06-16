import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { useAppStore, Cidade } from "../../store/useAppStore";
import { pb } from "../../lib/pocketbase";
import { Skeleton } from "../../components/ui/Skeleton";
import { Orcamento } from "../../hooks/useBudgets";
import { useToast } from "../../context/ToastContext";
import { ChevronDownIcon, ChevronUpIcon } from "../../icons";
import api from "../../services/api";

import Select from "../../components/form/Select";
import AutocompleteCity from "../../components/form/AutocompleteCity";
import { Modal } from "../../components/ui/modal";

export default function BudgetManagement() {
  const { addToast } = useToast();
  const { budgets, isLoading, fetchBudgets } = useAppStore();
  const [searchParams] = useSearchParams();
  const urlOrcamentoId = searchParams.get("id");

  const formatLocation = (cidade?: string, estado?: string) => {
    const city =
      cidade?.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()) ||
      "---";
    const state =
      estado?.toLowerCase().replace(/(?:^|\s|-)\S/g, (a) => a.toUpperCase()) ||
      "---";
    return `${city} - ${state}`;
  };

  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(
    null,
  );
  const [kwpMinimo, setKwpMinimo] = useState<number | null>(null);
  const [mediaCalc, setMediaCalc] = useState<number | null>(null);
  const [kwpSistema, setKwpSistema] = useState<number | null>(null);

  // States para colapsáveis (iniciam todos abertos)
  const [isSection0Open, setIsSection0Open] = useState(true);
  const [isSectionSistemaOpen, setIsSectionSistemaOpen] = useState(true);
  const [isSection1Open, setIsSection1Open] = useState(true);
  const [isSection2Open, setIsSection2Open] = useState(true);
  const [isSection3Open, setIsSection3Open] = useState(true);
  const [isSectionGarantiaOpen, setIsSectionGarantiaOpen] = useState(true);
  const [isSectionCaracteristicaOpen, setIsSectionCaracteristicaOpen] =
    useState(true);
  const [isSectionComposicaoOpen, setIsSectionComposicaoOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [savedBudgetId, setSavedBudgetId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nome_cliente: "",
      estado: "",
      cidade: "",
      id_cidade: "",
      observacao: "",
      estrutura: "",
      padrao: "",
      consumo_mes: "0,00",
      valor_tarifa: "0,85",
      potencia_painel: "",
      qtd_paineis: "",
      peso_painel: "25",
      marca_modulo: "",
      qtd_inversores: "1",
      potencia_inversor: "",
      modelo_inversor: "",
      marca_inversor: "",
      tensao_inversor: "",

      // Seção: Sistema e Geração
      sistema_kwp: "0,00",
      geracao_faturavel: "0,00",
      qtd_composicao: "0",
      area_estimada: "0,00",
      geracao_media_mes: "0,00",
      geracao_media_ano: "0,00",
      valor_pago_mes: "0,00",
      valor_pago_ano: "0,00",
      porcentagem_reducao: "0",
      tempo_retorno: "",

      valor_kit: "0,00",
      porcentagem_kit: "0",
      mao_obra: "100,00",
      equipamento_local: "60,00",
      lucro_liquido_perc: "20",
      valor_kit_final: "0,00",
      lucro_equipamento: "0,00",
      valor_mao_obra_final: "0,00",
      valor_equip_local_final: "0,00",
      valor_homologacao: "",
      seguro: "0,00",
      valor_investido: "0,00",
      imposto: "0,00",
      margem_seguranca: "0,00",
      lucro_liquido_previsto: "0,00",
      preco_final_venda: "0,00",

      // Seção: Garantias e Suporte
      garantia_fabrica_modulo: "15 anos",
      garantia_eficiencia_modulo: "25 anos",
      garantia_inversor: "10 anos",
      garantia_instalacao: "1 ano",
      garantia_estrutura: "10 anos",
      monitoramento_inversor: "Wi-Fi",
      material_estrutura: "Estrutura de Alumínio ou Aço Galvanizado",

      // Seção: Características da Estrutura
      caracteristica_estrutura_1: "Segurança na Instalação",
      caracteristica_estrutura_2: "Possibilidade de Ampliação",
      caracteristica_estrutura_3: "Alta resistência e durabilidade",
      caracteristica_estrutura_4: "Comprimentos Personalizados",
      caracteristica_estrutura_5: "Contempla correção de inclinação",

      // Seção: Composição do Kit
      composicao_1: "",
      composicao_2: "",
      composicao_3: "",
      composicao_4: "",
      composicao_5: "",

      // Status
      situacao: "Aberto",
    },
  });

  const formatCurrency = useCallback((value: string | number) => {
    if (value === undefined || value === null) return "0,00";
    if (typeof value === "number") value = value.toFixed(2);
    const cleanValue = value.toString().replace(/\D/g, "");
    const amount = (parseInt(cleanValue || "0") / 100).toFixed(2);
    return amount.replace(".", ",");
  }, []);

  const parseCurrencyToNumber = (value: string) => {
    if (!value) return 0;
    const clean = value.replace(/\./g, "").replace(",", ".");
    return parseFloat(clean);
  };

  // Watchers
  const watchedPotenciaPainel = watch("potencia_painel");
  const watchedQtdPaineis = watch("qtd_paineis");
  const watchedPesoPainel = watch("peso_painel");
  const watchedMarcaModulo = watch("marca_modulo");
  const watchedQtdInversores = watch("qtd_inversores");
  const watchedPotenciaInversor = watch("potencia_inversor");
  const watchedModeloInversor = watch("modelo_inversor");
  const watchedMarcaInversor = watch("marca_inversor");
  const watchedTensaoInversor = watch("tensao_inversor");

  const watchedValorKit = watch("valor_kit");
  const watchedPorcentagemKit = watch("porcentagem_kit");
  const watchedValorKitFinal = watch("valor_kit_final");
  const watchedMaoObra = watch("mao_obra");
  const watchedEquipLocal = watch("equipamento_local");
  const watchedLucroPerc = watch("lucro_liquido_perc");
  const watchedHomologacao = watch("valor_homologacao");
  const watchedIdCidade = watch("id_cidade");
  const watchedConsumoMes = watch("consumo_mes");
  const watchedValorTarifa = watch("valor_tarifa");
  const watchedPadrao = watch("padrao");
  const watchedPrecoVenda = watch("preco_final_venda");
  const watchedNomeCliente = watch("nome_cliente");
  const watchedEstado = watch("estado");
  const watchedCidade = watch("cidade");
  const watchedSistemaKwp = watch("sistema_kwp");
  const watchedGeracaoMediaMes = watch("geracao_media_mes");

  // Watchers for sections 6, 7, 8 completion status
  const watchedComposicao1 = watch("composicao_1");
  const watchedComposicao2 = watch("composicao_2");
  const watchedGarantiaFabricaModulo = watch("garantia_fabrica_modulo");
  const watchedGarantiaEficienciaModulo = watch("garantia_eficiencia_modulo");
  const watchedGarantiaInversor = watch("garantia_inversor");
  const watchedCaracteristicaEstrutura1 = watch("caracteristica_estrutura_1");

  // Conditions for filled sections (Sections 1 to 5)
  const isSec1Preenchido = !!(
    watchedNomeCliente?.trim() &&
    watchedIdCidade &&
    watchedEstado?.trim() &&
    watchedCidade?.trim() &&
    watchedConsumoMes &&
    watchedValorTarifa
  );

  const isSec2Preenchido = !!(
    watchedPotenciaPainel &&
    parseInt(watchedPotenciaPainel) > 0 &&
    watchedQtdPaineis &&
    parseInt(watchedQtdPaineis) > 0 &&
    watchedPesoPainel &&
    parseFloat(watchedPesoPainel) > 0 &&
    watchedMarcaModulo?.trim() &&
    watchedQtdInversores &&
    parseInt(watchedQtdInversores) > 0 &&
    watchedPotenciaInversor &&
    parseInt(watchedPotenciaInversor) > 0 &&
    watchedModeloInversor?.trim() &&
    watchedMarcaInversor?.trim() &&
    watchedTensaoInversor?.trim()
  );

  const isSec3Preenchido = !!(
    watchedValorKit &&
    parseCurrencyToNumber(watchedValorKit.toString()) > 0 &&
    watchedPorcentagemKit !== undefined &&
    watchedPorcentagemKit !== null &&
    watchedPorcentagemKit.toString().trim() !== "" &&
    watchedMaoObra &&
    parseCurrencyToNumber(watchedMaoObra.toString()) >= 0 &&
    watchedEquipLocal &&
    parseCurrencyToNumber(watchedEquipLocal.toString()) >= 0 &&
    watchedLucroPerc &&
    parseInt(watchedLucroPerc.toString()) > 0 &&
    watchedHomologacao &&
    parseCurrencyToNumber(watchedHomologacao.toString()) >= 0
  );

  const isSec4Preenchido = !!(
    watchedSistemaKwp &&
    watchedGeracaoMediaMes &&
    watchedGeracaoMediaMes !== "0,00" &&
    watchedSistemaKwp !== "0,00"
  );

  const isSec5Preenchido = !!(
    watchedPrecoVenda &&
    watchedPrecoVenda !== "R$ 0,00" &&
    parseCurrencyToNumber(watchedPrecoVenda.toString()) > 0
  );

  const isSec6Preenchido = !!(
    watchedQtdPaineis &&
    parseInt(watchedQtdPaineis) > 0 &&
    watchedQtdInversores &&
    parseInt(watchedQtdInversores) > 0 &&
    watchedComposicao1 &&
    !watchedComposicao1.startsWith("0 módulos") &&
    watchedComposicao2 &&
    !watchedComposicao2.startsWith("0 Inversor")
  );

  const isSec7Preenchido = !!(
    watchedGarantiaFabricaModulo?.trim() ||
    watchedGarantiaEficienciaModulo?.trim() ||
    watchedGarantiaInversor?.trim()
  );

  const isSec8Preenchido = !!watchedCaracteristicaEstrutura1?.trim();

  // Preenchimento Dinâmico da Composição
  useEffect(() => {
    const qtdP = watchedQtdPaineis || "0";
    const marcaM = watchedMarcaModulo || "---";
    const potP = watchedPotenciaPainel || "0";

    const qtdI = watchedQtdInversores || "0";
    const marcaI = watchedMarcaInversor || "---";
    const modI = watchedModeloInversor || "---";
    const potIkw = watchedPotenciaInversor || "0";

    setValue(
      "composicao_1",
      `${qtdP} módulos solares fotovoltaicos ${marcaM} de ${potP}W`,
    );
    setValue(
      "composicao_2",
      `${qtdI} Inversor Fotovoltaico – ${marcaI} – ${modI} - ${potIkw}kW`,
    );
    setValue(
      "composicao_3",
      `Conjunto de estrutura para fixação de ${qtdP} módulos`,
    );
  }, [
    watchedQtdPaineis,
    watchedMarcaModulo,
    watchedPotenciaPainel,
    watchedQtdInversores,
    watchedMarcaInversor,
    watchedModeloInversor,
    watchedPotenciaInversor,
    setValue,
  ]);

  // Passo 1: Dimensionamento Mínimo
  useEffect(() => {
    const getDimensionamento = async () => {
      if (watchedIdCidade && watchedConsumoMes && watchedValorTarifa) {
        try {
          const response = await api.post("/dimensionamento-minimo", {
            id_cidade: watchedIdCidade,
            consumo_mes: parseCurrencyToNumber(watchedConsumoMes),
            valor_tarifa: parseCurrencyToNumber(watchedValorTarifa),
          });
          if (response.data) {
            setKwpMinimo(response.data.kwp_minimo);
            setMediaCalc(response.data.mediacalc);
          }
        } catch (error) {
          console.error("Erro ao calcular dimensionamento mínimo:", error);
        }
      }
    };
    const timer = setTimeout(getDimensionamento, 800);
    return () => clearTimeout(timer);
  }, [watchedIdCidade, watchedConsumoMes, watchedValorTarifa]);

  // Passo 2: Cálculo do Sistema Real (kWp)
  useEffect(() => {
    const getSistemaReal = async () => {
      const potencia = parseInt(watchedPotenciaPainel);
      const qtd = parseInt(watchedQtdPaineis);
      if (potencia > 0 && qtd > 0) {
        try {
          const response = await api.post("/sistema-real", {
            potencia_painel: potencia,
            quantidade_paineis: qtd,
          });
          if (response.data) {
            setKwpSistema(response.data.kwp_sistema);
            setValue(
              "sistema_kwp",
              response.data.kwp_sistema.toFixed(2).replace(".", ","),
            );
            setValue("qtd_composicao", qtd.toString());
          }
        } catch (error) {
          console.error("Erro ao calcular sistema real:", error);
        }
      } else {
        setKwpSistema(null);
      }
    };
    const timer = setTimeout(getSistemaReal, 800);
    return () => clearTimeout(timer);
  }, [watchedPotenciaPainel, watchedQtdPaineis, setValue]);

  // Passo 3: Geração e Retorno Financeiro (Cálculos de Viabilidade no Backend)
  useEffect(() => {
    const triggerRetorno = async () => {
      const tarifa = parseCurrencyToNumber(watchedValorTarifa);
      const consumoRs = parseCurrencyToNumber(watchedConsumoMes);
      const investido = parseCurrencyToNumber(watchedPrecoVenda);
      const qtd = parseInt(watchedQtdPaineis);

      if (kwpSistema && mediaCalc && tarifa > 0 && consumoRs > 0 && qtd > 0) {
        try {
          const response = await api.post("/retorno-financeiro", {
            kwp_sistema: kwpSistema,
            mediacalc: mediaCalc,
            valor_tarifa: tarifa,
            consumo_mes_rs: consumoRs,
            padrao: watchedPadrao,
            valor_investido: investido,
            quantidade_paineis: qtd,
          });

          if (response.data) {
            const d = response.data;
            setValue(
              "geracao_media_mes",
              (d.media_mes_kwh ?? 0).toFixed(2).replace(".", ","),
            );
            setValue(
              "geracao_media_ano",
              (d.geracao_anual_kwh ?? 0).toFixed(2).replace(".", ","),
            );
            setValue(
              "geracao_faturavel",
              (d.geracao_mensal_kwh ?? 0).toFixed(2).replace(".", ","),
            );
            setValue(
              "area_estimada",
              (d.area_estimada ?? 0).toFixed(2).replace(".", ","),
            );
            setValue(
              "porcentagem_reducao",
              Math.round((d.porcentagem_reducao ?? 0) * 100).toString(),
            );
            setValue("valor_pago_mes", formatCurrency(d.valor_pago_mes ?? 0));
            setValue("valor_pago_ano", formatCurrency(d.valor_pago_ano ?? 0));
            setValue("tempo_retorno", d.tempo_retorno || "N/A");
          }
        } catch (e) {
          console.error("Erro no retorno financeiro:", e);
        }
      }
    };
    const timer = setTimeout(triggerRetorno, 800);
    return () => clearTimeout(timer);
  }, [
    kwpSistema,
    mediaCalc,
    watchedValorTarifa,
    watchedConsumoMes,
    watchedPadrao,
    watchedPrecoVenda,
    watchedQtdPaineis,
    setValue,
    formatCurrency,
  ]);

  // Passo 4: Licenciamento do Kit
  useEffect(() => {
    const triggerLicenciamento = async () => {
      const valorKitNum = parseCurrencyToNumber(watchedValorKit);
      const perc = parseInt(watchedPorcentagemKit);
      if (valorKitNum > 0) {
        try {
          const response = await api.post("/licenciamento-kit", {
            valorKit: valorKitNum,
            valorPorcentagem: perc || 0,
          });
          if (response.data) {
            setValue(
              "valor_kit_final",
              formatCurrency(response.data.valorKitLicenciado || 0),
            );
            setValue(
              "lucro_equipamento",
              formatCurrency(response.data.lucroEquipamentoFinal || 0),
            );
          }
        } catch (e) {
          console.error("Erro no licenciamento do kit:", e);
        }
      }
    };
    const timer = setTimeout(triggerLicenciamento, 800);
    return () => clearTimeout(timer);
  }, [watchedValorKit, watchedPorcentagemKit, setValue, formatCurrency]);

  // Passo 5: Preço Final (Cascata de Markup)
  useEffect(() => {
    const triggerPrecoFinal = async () => {
      const kitLicenciado = parseCurrencyToNumber(watchedValorKitFinal);
      const qtdPaineis = parseInt(watchedQtdPaineis);
      if (kitLicenciado > 0 && qtdPaineis > 0) {
        try {
          const response = await api.post("/preco-final", {
            valorKitLicenciado: kitLicenciado,
            valorMaoDeObra: parseCurrencyToNumber(watchedMaoObra),
            valorEquipamentoLocal: parseCurrencyToNumber(watchedEquipLocal),
            valorHomologacao: parseCurrencyToNumber(watchedHomologacao),
            porcentagemLucroLiquido: parseInt(watchedLucroPerc),
            quantidade_paineis: qtdPaineis,
          });
          const data = response.data;
          if (data) {
            setValue(
              "valor_mao_obra_final",
              formatCurrency(data.valorMaoDeObraTotal || 0),
            );
            setValue(
              "valor_equip_local_final",
              formatCurrency(data.valorEquipamentoLocalTotal || 0),
            );
            setValue("seguro", formatCurrency(data.seguro || 0));
            setValue("valor_investido", formatCurrency(data.custoProjeto || 0));
            setValue("imposto", formatCurrency(data.imposto || 0));
            setValue(
              "margem_seguranca",
              formatCurrency(data.margemSeguranca || 0),
            );
            setValue(
              "lucro_liquido_previsto",
              formatCurrency(data.lucroLiquidoRs || 0),
            );
            setValue(
              "preco_final_venda",
              formatCurrency(data.precoFinalSugerido || 0),
            );
          }
        } catch (e: any) {
          console.error("Erro no preço final:", e);
          const msg =
            e.response?.data?.error ||
            "Erro ao calcular preço final. Verifique os dados.";
          addToast("error", "Erro de Cálculo", msg);
        }
      }
    };
    const timer = setTimeout(triggerPrecoFinal, 800);
    return () => clearTimeout(timer);
  }, [
    watchedValorKitFinal,
    watchedMaoObra,
    watchedEquipLocal,
    watchedLucroPerc,
    watchedHomologacao,
    watchedQtdPaineis,
    setValue,
    formatCurrency,
  ]);

  // Selecionar orçamento
  const handleSelectOrcamento = useCallback(
    (orcamento: Orcamento) => {
      setSelectedOrcamento(orcamento);
      setKwpMinimo(orcamento.kwp_minimo || 0);

      let idCidade = orcamento.id_cidade || "";
      if (!idCidade && orcamento.cidade && orcamento.estado) {
        pb.collection("cidades_hsp")
          .getFirstListItem<Cidade>(
            `cidade = "${orcamento.cidade.replace(/"/g, '\\"')}" && estado = "${orcamento.estado.replace(/"/g, '\\"')}"`,
          )
          .then((found) => {
            if (found) {
              setValue("id_cidade", found.id);
            }
          })
          .catch((err) => {
            console.error("Erro ao resolver cidade legada:", err);
          });
      }

      reset({
        nome_cliente: orcamento.nome_cliente || "",
        estado: orcamento.estado || "",
        id_cidade: idCidade,
        cidade: orcamento.cidade || "",
        observacao: orcamento.observacao || "",
        estrutura: orcamento.estrutura || "",
        padrao: orcamento.padrao || "",
        consumo_mes: formatCurrency(orcamento.consumo_mes || 0),
        valor_tarifa: formatCurrency(orcamento.valor_tarifa || 0.85),

        potencia_painel: orcamento.potencia_painel?.toString() || "",
        qtd_paineis: orcamento.qtd_paineis?.toString() || "",
        peso_painel: (orcamento.peso_painel || 25).toString(),
        marca_modulo: orcamento.marca_painel || "",

        qtd_inversores: (orcamento.qtd_inversores !== undefined
          ? orcamento.qtd_inversores
          : 1
        ).toString(),
        potencia_inversor:
          orcamento.potencia_inversor !== undefined
            ? orcamento.potencia_inversor.toString()
            : "",
        modelo_inversor: orcamento.modelo_inversor || "",
        marca_inversor: orcamento.marca_inversor || "",
        tensao_inversor:
          orcamento.tensao_inversor !== undefined
            ? orcamento.tensao_inversor.toString()
            : "",

        // Sistema e Geração (Carregar se existirem)
        sistema_kwp:
          orcamento.kwp_sistema?.toFixed(2).replace(".", ",") || "0,00",
        geracao_faturavel: (orcamento.geracao_mes || 0)
          .toFixed(2)
          .replace(".", ","),
        qtd_composicao: orcamento.qtd_paineis?.toString() || "0",
        area_estimada:
          orcamento.area_estimada?.toFixed(2).replace(".", ",") || "0,00",
        geracao_media_mes:
          orcamento.geracao_mes?.toFixed(2).replace(".", ",") || "0,00",
        geracao_media_ano:
          orcamento.geracao_ano?.toFixed(2).replace(".", ",") || "0,00",
        valor_pago_mes: formatCurrency(orcamento.valor_pago_mes || 0),
        valor_pago_ano: formatCurrency(orcamento.valor_pago_ano || 0),
        porcentagem_reducao: (orcamento.porcentagem_reducao
          ? orcamento.porcentagem_reducao * 100
          : 0
        ).toFixed(0),
        tempo_retorno: orcamento.tempo_retorno || "",

        valor_kit: formatCurrency(orcamento.valor_kit || 0),
        porcentagem_kit: (orcamento.porcentagem_kit || 0).toString(),
        mao_obra: formatCurrency(orcamento.mao_obra || 100),
        equipamento_local: formatCurrency(orcamento.equipamento_local || 60),
        lucro_liquido_perc: (orcamento.lucro_liquido_perc || 20).toString(),
        valor_homologacao: formatCurrency(orcamento.valor_homologacao || 500),

        valor_kit_final: formatCurrency(orcamento.valor_kit_final || 0),
        lucro_equipamento: formatCurrency(orcamento.lucro_equipamento || 0),
        valor_mao_obra_final: formatCurrency(
          orcamento.valor_mao_obra_final || 0,
        ),
        valor_equip_local_final: formatCurrency(
          orcamento.valor_equip_local_final || 0,
        ),
        seguro: formatCurrency(orcamento.seguro || 0),
        valor_investido: formatCurrency(orcamento.custo_projeto || 0),
        imposto: formatCurrency(orcamento.imposto || 0),
        margem_seguranca: formatCurrency(orcamento.margem_seguranca || 0),
        lucro_liquido_previsto: formatCurrency(
          orcamento.lucro_liquido_previsto || 0,
        ),
        preco_final_venda: formatCurrency(orcamento.preco_final_venda || 0),

        // Garantias e Suporte
        garantia_fabrica_modulo: orcamento.garantia_fabrica_modulo || "15 anos",
        garantia_eficiencia_modulo:
          orcamento.garantia_eficiencia_modulo || "25 anos",
        garantia_inversor: orcamento.garantia_inversor || "10 anos",
        garantia_instalacao: orcamento.garantia_instalacao || "1 ano",
        garantia_estrutura: orcamento.garantia_estrutura || "10 anos",
        monitoramento_inversor: orcamento.monitoramento_inversor || "Wi-Fi",
        material_estrutura:
          orcamento.material_estrutura ||
          "Estrutura de Alumínio ou Aço Galvanizado",

        // Características da Estrutura
        caracteristica_estrutura_1:
          orcamento.caracteristica_estrutura_1 || "Segurança na Instalação",
        caracteristica_estrutura_2:
          orcamento.caracteristica_estrutura_2 || "Possibilidade de Ampliação",
        caracteristica_estrutura_3:
          orcamento.caracteristica_estrutura_3 ||
          "Alta resistência e durabilidade",
        caracteristica_estrutura_4:
          orcamento.caracteristica_estrutura_4 || "Comprimentos Personalizados",
        caracteristica_estrutura_5:
          orcamento.caracteristica_estrutura_5 ||
          "Contempla correção de inclinação",

        // Composição
        composicao_1: orcamento.composicao_1 || "",
        composicao_2: orcamento.composicao_2 || "",
        composicao_3: orcamento.composicao_3 || "",
        composicao_4: orcamento.composicao_4 || "",
        composicao_5: orcamento.composicao_5 || "",

        // Status
        situacao: orcamento.situacao || "Aberto",
      });

      setIsSection0Open(true);
      setIsSectionSistemaOpen(true);
      setIsSection1Open(true);
      setIsSection2Open(true);
      setIsSection3Open(true);
      setIsSectionGarantiaOpen(true);
      setIsSectionCaracteristicaOpen(true);
      setIsSectionComposicaoOpen(true);

      setTimeout(() => {
        document
          .getElementById("form-gerencial")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    },
    [reset, formatCurrency, setValue],
  );

  useEffect(() => {
    if (urlOrcamentoId && budgets.length > 0) {
      const found = budgets.find((b) => b.id === urlOrcamentoId);
      if (found) {
        handleSelectOrcamento(found);
      }
    }
  }, [urlOrcamentoId, budgets, handleSelectOrcamento]);

  const onSubmit = async (data: Record<string, string>) => {
    if (!selectedOrcamento) return;
    setIsSaving(true);

    const payload = {
      orcamentoId: selectedOrcamento.id,
      nome_cliente: data.nome_cliente,
      id_cidade: data.id_cidade,
      cidade: data.cidade,
      estado: data.estado,
      estrutura: data.estrutura,
      padrao: data.padrao,
      consumo_mes: parseCurrencyToNumber(data.consumo_mes),
      valor_tarifa: parseCurrencyToNumber(data.valor_tarifa),
      potencia_painel: parseInt(data.potencia_painel),
      quantidade_paineis: parseInt(data.qtd_paineis),
      peso_painel: parseFloat(data.peso_painel) || 0,
      marca_modulo: data.marca_modulo,
      quantidade_inversores: parseInt(data.qtd_inversores),
      potencia_inversor: parseInt(data.potencia_inversor) || 0,
      modelo_inversor: data.modelo_inversor,
      marca_inversor: data.marca_inversor,
      tensao_inversor: data.tensao_inversor,
      valorKit: parseCurrencyToNumber(data.valor_kit),
      valorPorcentagem: parseInt(data.porcentagem_kit),
      valorMaoDeObra: parseCurrencyToNumber(data.mao_obra),
      valorEquipamentoLocal: parseCurrencyToNumber(data.equipamento_local),
      valorHomologacao: parseCurrencyToNumber(data.valor_homologacao),
      porcentagemLucroLiquido: parseInt(data.lucro_liquido_perc),
      observacao: data.observacao,

      kwp_minimo: kwpMinimo,
      kwp_sistema: kwpSistema,

      area_estimada: parseCurrencyToNumber(data.area_estimada),
      geracao_mes: parseCurrencyToNumber(data.geracao_media_mes),
      geracao_ano: parseCurrencyToNumber(data.geracao_media_ano),
      valor_pago_mes: parseCurrencyToNumber(data.valor_pago_mes),
      valor_pago_ano: parseCurrencyToNumber(data.valor_pago_ano),
      porcentagem_reducao:
        parseCurrencyToNumber(data.porcentagem_reducao) / 100,
      tempo_retorno: data.tempo_retorno,

      valor_kit_final: parseCurrencyToNumber(data.valor_kit_final),
      lucro_equipamento: parseCurrencyToNumber(data.lucro_equipamento),
      valor_mao_obra_final: parseCurrencyToNumber(data.valor_mao_obra_final),
      valor_equip_local_final: parseCurrencyToNumber(
        data.valor_equip_local_final,
      ),
      seguro: parseCurrencyToNumber(data.seguro),
      custo_projeto: parseCurrencyToNumber(data.valor_investido),
      imposto: parseCurrencyToNumber(data.imposto),
      margem_seguranca: parseCurrencyToNumber(data.margem_seguranca),
      lucro_liquido_previsto: parseCurrencyToNumber(
        data.lucro_liquido_previsto,
      ),
      preco_final_venda: parseCurrencyToNumber(data.preco_final_venda),

      situacao: data.situacao,

      garantia_fabrica_modulo: data.garantia_fabrica_modulo,
      garantia_eficiencia_modulo: data.garantia_eficiencia_modulo,
      garantia_inversor: data.garantia_inversor,
      garantia_instalacao: data.garantia_instalacao,
      garantia_estrutura: data.garantia_estrutura,
      monitoramento_inversor: data.monitoramento_inversor,
      material_estrutura: data.material_estrutura,

      caracteristica_estrutura_1: data.caracteristica_estrutura_1,
      caracteristica_estrutura_2: data.caracteristica_estrutura_2,
      caracteristica_estrutura_3: data.caracteristica_estrutura_3,
      caracteristica_estrutura_4: data.caracteristica_estrutura_4,
      caracteristica_estrutura_5: data.caracteristica_estrutura_5,

      composicao_1: data.composicao_1,
      composicao_2: data.composicao_2,
      composicao_3: data.composicao_3,
      composicao_4: data.composicao_4,
      composicao_5: data.composicao_5,
    };

    try {
      const response = await api.post("/salvar-refinamento", payload);
      if (response.status === 200 || response.status === 201) {
        addToast(
          "success",
          "Sucesso",
          "Orçamento gerencial salvo com sucesso!",
        );
        setSavedBudgetId(selectedOrcamento.id);
        setIsPdfModalOpen(true);
        setSelectedOrcamento(null);
        fetchBudgets();
      }
    } catch (e) {
      console.error("Erro ao salvar refinamento:", e);
      addToast("error", "Erro", "Não foi possível salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
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

  return (
    <>
      <PageMeta title="Orçamento Gerencial | Solar Admin" />
      <PageBreadcrumb pageTitle="Orçamentos - Gerencial" />

      <div className="space-y-6">
        <ComponentCard title="Histórico Global de Solicitações">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {isLoading ? (
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
                    </tr>
                  ))
                ) : budgets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      Nenhum orçamento encontrado.
                    </td>
                  </tr>
                ) : (
                  budgets.map((o) => {
                    return (
                      <tr
                        key={o.id}
                        className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors ${selectedOrcamento?.id === o.id ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}
                        onClick={() => handleSelectOrcamento(o)}
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </ComponentCard>

        {selectedOrcamento ? (
          <div id="form-gerencial" className="space-y-6 animate-fadeIn">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 1. DADOS DO CLIENTE E LOCAL */}
              <ComponentCard
                title={
                  <button
                    type="button"
                    onClick={() => setIsSection0Open(!isSection0Open)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-gray-800 dark:text-white/90 font-bold">
                      1. Cliente
                    </span>
                    <div className="flex items-center gap-3">
                      {isSec1Preenchido ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs  text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200/50 dark:border-success-500/20">
                          <span className="size-1.5 rounded-full bg-success-500"></span>
                          Preenchido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs  text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-200/30 dark:border-warning-500/20">
                          <span className="size-1.5 rounded-full bg-warning-500 animate-pulse"></span>
                          Pendente
                        </span>
                      )}
                      {isSection0Open ? (
                        <ChevronUpIcon className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                }
              >
                {isSection0Open && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 animate-slideDown">
                    <div className="md:col-span-1">
                      <Label required>Nome do Cliente</Label>
                      <Controller
                        name="nome_cliente"
                        control={control}
                        render={({ field }) => <Input {...field} required />}
                      />
                    </div>
                    <div>
                      <Label required>Cidade</Label>
                      <Controller
                        name="id_cidade"
                        control={control}
                        render={({ field }) => (
                          <AutocompleteCity
                            value={field.value}
                            onChange={(city) => {
                              field.onChange(city?.id || "");
                              setValue("cidade", city?.cidade || "");
                              setValue("estado", city?.estado || "");
                            }}
                            initialCityName={selectedOrcamento.cidade}
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
                            className="bg-gray-50 dark:bg-white/[0.03] cursor-not-allowed"
                            value={
                              field.value
                                ? field.value
                                    .toLowerCase()
                                    .replace(/(?:^|\s|-)\S/g, (a) =>
                                      a.toUpperCase(),
                                    )
                                : ""
                            }
                          />
                        )}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label>Observação</Label>
                      <Controller
                        name="observacao"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div>
                      <Label required>Estrutura</Label>
                      <Controller
                        name="estrutura"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={[
                              { value: "Cerâmico", label: "Cerâmico" },
                              { value: "Fibrocimento", label: "Fibrocimento" },
                              { value: "Metálico", label: "Metálico" },
                              { value: "Solo", label: "Solo" },
                              { value: "Laje", label: "Laje" },
                            ]}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Padrão de Entrada</Label>
                      <Controller
                        name="padrao"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={[
                              { value: "Monofásico", label: "Monofásico" },
                              { value: "Bifásico", label: "Bifásico" },
                              { value: "Trifásico", label: "Trifásico" },
                            ]}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Consumo Mês (R$)</Label>
                      <Controller
                        name="consumo_mes"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) =>
                              field.onChange(formatCurrency(e.target.value))
                            }
                            required
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Tarifa (R$)</Label>
                      <Controller
                        name="valor_tarifa"
                        control={control}
                        rules={{ required: "Tarifa é obrigatória" }}
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
                )}
              </ComponentCard>

              {/* 2. DETALHAMENTO DE EQUIPAMENTOS */}
              <ComponentCard
                title={
                  <button
                    type="button"
                    onClick={() => setIsSection1Open(!isSection1Open)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2 align-middle">
                      <span className="text-gray-800 dark:text-white/90 font-bold">
                        2. Equipamentos
                      </span>
                      {kwpMinimo !== undefined && kwpMinimo !== null && (
                        <span className="text-brand-500 bg-brand-50 text-sm dark:bg-brand-500/10 px-3 py-0.5 rounded-full">
                          Mínimo recomendado: {kwpMinimo} kWp
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {isSec2Preenchido ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs  text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200/50 dark:border-success-500/20">
                          <span className="size-1.5 rounded-full bg-success-500"></span>
                          Preenchido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs  text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-200/30 dark:border-warning-500/20">
                          <span className="size-1.5 rounded-full bg-warning-500 animate-pulse"></span>
                          Pendente
                        </span>
                      )}
                      {isSection1Open ? (
                        <ChevronUpIcon className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                }
              >
                {isSection1Open && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4 animate-slideDown">
                    <div>
                      <Label required>Potência do Painel (W)</Label>
                      <Controller
                        name="potencia_painel"
                        control={control}
                        rules={{ required: "Potência é obrigatória" }}
                        render={({ field }) => (
                          <Input {...field} error={!!errors.potencia_painel} />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Quantidade de Painéis</Label>
                      <Controller
                        name="qtd_paineis"
                        control={control}
                        rules={{ required: "Quantidade é obrigatória" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            error={!!errors.qtd_paineis}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Peso do Painel (kg)</Label>
                      <Controller
                        name="peso_painel"
                        control={control}
                        rules={{ required: "Peso é obrigatório" }}
                        render={({ field }) => (
                          <Input {...field} error={!!errors.peso_painel} />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Marca do Módulo</Label>
                      <Controller
                        name="marca_modulo"
                        control={control}
                        rules={{ required: "Marca do módulo é obrigatória" }}
                        render={({ field }) => (
                          <Input {...field} error={!!errors.marca_modulo} />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Quantidade Inversores</Label>
                      <Controller
                        name="qtd_inversores"
                        control={control}
                        rules={{ required: "Obrigatório" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            error={!!errors.qtd_inversores}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Potência Inversor (kW)</Label>
                      <Controller
                        name="potencia_inversor"
                        control={control}
                        rules={{ required: "Potência é obrigatória" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            error={!!errors.potencia_inversor}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Modelo Inversor</Label>
                      <Controller
                        name="modelo_inversor"
                        control={control}
                        rules={{ required: "Modelo é obrigatório" }}
                        render={({ field }) => (
                          <Input {...field} error={!!errors.modelo_inversor} />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Marca Inversor</Label>
                      <Controller
                        name="marca_inversor"
                        control={control}
                        rules={{ required: "Marca é obrigatória" }}
                        render={({ field }) => (
                          <Input {...field} error={!!errors.marca_inversor} />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Tensão Inversor</Label>
                      <Controller
                        name="tensao_inversor"
                        control={control}
                        rules={{ required: "Tensão é obrigatória" }}
                        render={({ field }) => (
                          <Input {...field} error={!!errors.tensao_inversor} />
                        )}
                      />
                    </div>
                  </div>
                )}
              </ComponentCard>

              <ComponentCard
                title={
                  <button
                    type="button"
                    onClick={() => setIsSection2Open(!isSection2Open)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-gray-800 dark:text-white/90 font-bold">
                      3. Valores de Entrada (Custos)
                    </span>
                    <div className="flex items-center gap-3">
                      {isSec3Preenchido ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs  text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200/50 dark:border-success-500/20">
                          <span className="size-1.5 rounded-full bg-success-500"></span>
                          Preenchido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs  text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-200/30 dark:border-warning-500/20">
                          <span className="size-1.5 rounded-full bg-warning-500 animate-pulse"></span>
                          Pendente
                        </span>
                      )}
                      {isSection2Open ? (
                        <ChevronUpIcon className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                }
              >
                {isSection2Open && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5 animate-slideDown">
                    <div>
                      <Label required>Valor do Kit (R$)</Label>
                      <Controller
                        name="valor_kit"
                        control={control}
                        rules={{ required: "Obrigatório" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) =>
                              field.onChange(formatCurrency(e.target.value))
                            }
                            error={!!errors.valor_kit}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Porcentagem (%)</Label>
                      <Controller
                        name="porcentagem_kit"
                        control={control}
                        rules={{ required: "Obrigatório" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            error={!!errors.porcentagem_kit}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Mão de Obra (R$)</Label>
                      <Controller
                        name="mao_obra"
                        control={control}
                        rules={{ required: "Obrigatório" }}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) =>
                              field.onChange(formatCurrency(e.target.value))
                            }
                            error={!!errors.mao_obra}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Equipamento Local (R$)</Label>
                      <Controller
                        name="equipamento_local"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            onChange={(e) =>
                              field.onChange(formatCurrency(e.target.value))
                            }
                            error={!!errors.equipamento_local}
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label required>Lucro Líquido %</Label>
                      <Controller
                        name="lucro_liquido_perc"
                        control={control}
                        rules={{ required: "Obrigatório" }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={Array.from({ length: 16 }, (_, i) => ({
                              value: (i + 10).toString(),
                              label: `${i + 10}%`,
                            }))}
                            error={!!errors.lucro_liquido_perc}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </ComponentCard>

              {/* 4. SEÇÃO SISTEMA E VIABILIDADE */}
              <ComponentCard
                title={
                  <button
                    type="button"
                    onClick={() =>
                      setIsSectionSistemaOpen(!isSectionSistemaOpen)
                    }
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-gray-800 dark:text-white/90 font-bold">
                      4. Sistema e Viabilidade
                    </span>
                    <div className="flex items-center gap-3">
                      {isSec4Preenchido ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs  text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200/50 dark:border-success-500/20">
                          <span className="size-1.5 rounded-full bg-success-500"></span>
                          Preenchido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs  text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-200/30 dark:border-warning-500/20">
                          <span className="size-1.5 rounded-full bg-warning-500 animate-pulse"></span>
                          Pendente
                        </span>
                      )}
                      {isSectionSistemaOpen ? (
                        <ChevronUpIcon className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                }
              >
                {isSectionSistemaOpen && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4 animate-slideDown">
                    <div>
                      <Label>Sistema</Label>
                      <Controller
                        name="sistema_kwp"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-brand-50 dark:bg-brand-500/5 font-bold text-brand-600"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Geração</Label>
                      <Controller
                        name="geracao_faturavel"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-success-50 dark:bg-success-500/5 font-bold text-success-600"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Quantidade da Composição</Label>
                      <Controller
                        name="qtd_composicao"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Área Estimada</Label>
                      <Controller
                        name="area_estimada"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Média do Mês</Label>
                      <Controller
                        name="geracao_media_mes"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Média do Ano</Label>
                      <Controller
                        name="geracao_media_ano"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Valor Pago por Mês</Label>
                      <Controller
                        name="valor_pago_mes"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Valor Pago por Ano</Label>
                      <Controller
                        name="valor_pago_ano"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Porcentagem de Redução</Label>
                      <Controller
                        name="porcentagem_reducao"
                        control={control}
                        render={({ field }) => (
                          <div className="relative">
                            <Input
                              {...field}
                              readOnly
                              className="bg-success-50 dark:bg-success-500/5 font-bold text-success-600 pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                              %
                            </span>
                          </div>
                        )}
                      />
                    </div>
                    <div>
                      <Label>Retorno Financeiro</Label>
                      <Controller
                        name="tempo_retorno"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-amber-50 dark:bg-amber-500/5 font-bold text-amber-700"
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </ComponentCard>

              {/* 5. RETORNO DE CÁLCULOS */}
              <ComponentCard
                title={
                  <button
                    type="button"
                    onClick={() => setIsSection3Open(!isSection3Open)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-gray-800 dark:text-white/90 font-bold">
                      5. Retorno de Cálculos (Cascata de Preços)
                    </span>
                    <div className="flex items-center gap-3">
                      {isSec5Preenchido ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs  text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200/50 dark:border-success-500/20">
                          <span className="size-1.5 rounded-full bg-success-500"></span>
                          Preenchido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs  text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-200/30 dark:border-warning-500/20">
                          <span className="size-1.5 rounded-full bg-warning-500 animate-pulse"></span>
                          Pendente
                        </span>
                      )}
                      {isSection3Open ? (
                        <ChevronUpIcon className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                }
              >
                {isSection3Open && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4 animate-slideDown">
                    <div>
                      <Label>Valor Kit Final</Label>
                      <Controller
                        name="valor_kit_final"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Lucro Equipamento</Label>
                      <Controller
                        name="lucro_equipamento"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Valor Mão de Obra</Label>
                      <Controller
                        name="valor_mao_obra_final"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Valor Equip. Local</Label>
                      <Controller
                        name="valor_equip_local_final"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Homologação</Label>
                      <Controller
                        name="valor_homologacao"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Seguro</Label>
                      <Controller
                        name="seguro"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Imposto</Label>
                      <Controller
                        name="imposto"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Margem Segurança</Label>
                      <Controller
                        name="margem_seguranca"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label>Custo do Projeto</Label>
                      <Controller
                        name="valor_investido"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-gray-50 dark:bg-white/5 font-bold"
                          />
                        )}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <Label>Lucro Líquido Previsto</Label>
                      <Controller
                        name="lucro_liquido_previsto"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-success-50 dark:bg-success-500/5 text-success-600 font-bold"
                          />
                        )}
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <Label>Preço Final de Venda</Label>
                      <Controller
                        name="preco_final_venda"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            readOnly
                            className="bg-brand-50 dark:bg-brand-500/5 text-brand-600 font-bold text-lg"
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </ComponentCard>

              {/* 6. COMPOSIÇÃO DO KIT */}
              <ComponentCard
                title={
                  <button
                    type="button"
                    onClick={() =>
                      setIsSectionComposicaoOpen(!isSectionComposicaoOpen)
                    }
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-gray-800 dark:text-white/90 font-bold">
                      6. Composição do Kit
                    </span>
                    <div className="flex items-center gap-3">
                      {isSec6Preenchido ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs  text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200/50 dark:border-success-500/20">
                          <span className="size-1.5 rounded-full bg-success-500"></span>
                          Preenchido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs  text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-200/30 dark:border-warning-500/20">
                          <span className="size-1.5 rounded-full bg-warning-500 animate-pulse"></span>
                          Pendente
                        </span>
                      )}
                      {isSectionComposicaoOpen ? (
                        <ChevronUpIcon className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                }
              >
                {isSectionComposicaoOpen && (
                  <div className="grid grid-cols-1 gap-4 animate-slideDown">
                    <div>
                      <Label>Composição 1</Label>
                      <Controller
                        name="composicao_1"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div>
                      <Label>Composição 2</Label>
                      <Controller
                        name="composicao_2"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div>
                      <Label>Composição 3</Label>
                      <Controller
                        name="composicao_3"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div>
                      <Label>Composição 4</Label>
                      <Controller
                        name="composicao_4"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div>
                      <Label>Composição 5</Label>
                      <Controller
                        name="composicao_5"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                  </div>
                )}
              </ComponentCard>

              <ComponentCard
                title={
                  <button
                    type="button"
                    onClick={() =>
                      setIsSectionGarantiaOpen(!isSectionGarantiaOpen)
                    }
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-gray-800 dark:text-white/90 font-bold">
                      7. Garantia
                    </span>
                    <div className="flex items-center gap-3">
                      {isSec7Preenchido ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs  text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200/50 dark:border-success-500/20">
                          <span className="size-1.5 rounded-full bg-success-500"></span>
                          Preenchido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs  text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-200/30 dark:border-warning-500/20">
                          <span className="size-1.5 rounded-full bg-warning-500 animate-pulse"></span>
                          Pendente
                        </span>
                      )}
                      {isSectionGarantiaOpen ? (
                        <ChevronUpIcon className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                }
              >
                {isSectionGarantiaOpen && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4 animate-slideDown">
                    <div className="md:col-span-1">
                      <Label>Garantia de Fábrica (Módulo)</Label>
                      <Controller
                        name="garantia_fabrica_modulo"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Garantia de Eficiência (Módulo)</Label>
                      <Controller
                        name="garantia_eficiencia_modulo"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Garantia do Inversor</Label>
                      <Controller
                        name="garantia_inversor"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Garantia Instalação</Label>
                      <Controller
                        name="garantia_instalacao"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Garantia da Estrutura</Label>
                      <Controller
                        name="garantia_estrutura"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Monitoramento do Inversor</Label>
                      <Controller
                        name="monitoramento_inversor"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Material da Estrutura</Label>
                      <Controller
                        name="material_estrutura"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                  </div>
                )}
              </ComponentCard>

              {/* 8. CARACTERÍSTICAS DA ESTRUTURA */}
              <ComponentCard
                title={
                  <button
                    type="button"
                    onClick={() =>
                      setIsSectionCaracteristicaOpen(
                        !isSectionCaracteristicaOpen,
                      )
                    }
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="text-gray-800 dark:text-white/90 font-bold">
                      8. Características da Estrutura
                    </span>
                    <div className="flex items-center gap-3">
                      {isSec8Preenchido ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-0.5 text-xs  text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200/50 dark:border-success-500/20">
                          <span className="size-1.5 rounded-full bg-success-500"></span>
                          Preenchido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs  text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-200/30 dark:border-warning-500/20">
                          <span className="size-1.5 rounded-full bg-warning-500 animate-pulse"></span>
                          Pendente
                        </span>
                      )}
                      {isSectionCaracteristicaOpen ? (
                        <ChevronUpIcon className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                }
              >
                {isSectionCaracteristicaOpen && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 animate-slideDown">
                    <div className="md:col-span-1">
                      <Label>Característica da Estrutura 1</Label>
                      <Controller
                        name="caracteristica_estrutura_1"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Característica da Estrutura 2</Label>
                      <Controller
                        name="caracteristica_estrutura_2"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Característica da Estrutura 3</Label>
                      <Controller
                        name="caracteristica_estrutura_3"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Característica da Estrutura 4</Label>
                      <Controller
                        name="caracteristica_estrutura_4"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Característica da Estrutura 5</Label>
                      <Controller
                        name="caracteristica_estrutura_5"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                      />
                    </div>
                  </div>
                )}
              </ComponentCard>

              <div className="w-1/6  ml-2">
                <Label required>Situação do Orçamento</Label>
                <Controller
                  name="situacao"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: "Aberto", label: "Aberto" },
                        { value: "Fechado", label: "Fechado" },
                      ]}
                    />
                  )}
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setSelectedOrcamento(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={isSaving}>
                  Salvar Refinamento Gerencial
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">
              Clique no orçamento desejado.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        className="max-w-[450px] p-6 text-center sm:p-8"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center size-12 mb-4 bg-brand-50 text-brand-600 rounded-full dark:bg-brand-500/10 dark:text-brand-400">
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">
            Gerar PDF da Proposta?
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            O orçamento foi salvo com sucesso! Deseja visualizar a proposta
            agora para gerar ou imprimir o PDF?
          </p>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setIsPdfModalOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.1]"
            >
              Agora não
            </button>
            <Link
              to={`/budgets/details/${savedBudgetId}`}
              onClick={() => setIsPdfModalOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-center text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors shadow-theme-sm"
            >
              Sim, visualizar
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
