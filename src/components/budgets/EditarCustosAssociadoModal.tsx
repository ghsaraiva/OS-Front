import { useState } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import FieldTooltip from "../common/FieldTooltip";
import { Orcamento } from "../../hooks/useBudgets";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";
import { LUCRO_LIQUIDO_OPTIONS } from "../../utils/budgetOptions";
import { resolverPorcentagem } from "../../utils/budgetMath";

interface EditarCustosAssociadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  orcamento: Orcamento;
  onSaved: (orcamento: Orcamento) => void;
}

type CustosForm = {
  mao_obra: string;
  equipamento_local: string;
  km: string;
  custo_km: string;
  porcentagem_seguro: string;
  porcentagem_imposto: string;
  porcentagem_margem_seguranca: string;
  lucro_liquido_perc: string;
};

// Formata número/entrada digitada no padrão "1234,56" (centavos a partir dos dígitos)
const formatDecimal = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === "") return "0,00";
  if (typeof value === "number") value = value.toFixed(2);
  const cleanValue = value.toString().replace(/\D/g, "");
  return (parseInt(cleanValue || "0") / 100).toFixed(2).replace(".", ",");
};

const parseDecimal = (value: string) => {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
};

const toForm = (o: Orcamento): CustosForm => ({
  mao_obra: formatDecimal(o.mao_obra ?? 100),
  equipamento_local: formatDecimal(o.equipamento_local ?? 60),
  km: String(o.km ?? 0),
  custo_km: formatDecimal(o.custo_km ?? 0),
  porcentagem_seguro: formatDecimal(o.porcentagem_seguro ?? 1),
  porcentagem_imposto: formatDecimal(o.porcentagem_imposto ?? 8),
  porcentagem_margem_seguranca: formatDecimal(resolverPorcentagem(o, "margem")),
  lucro_liquido_perc: formatDecimal(o.lucro_liquido_perc ?? 20),
});

export default function EditarCustosAssociadoModal({
  isOpen,
  onClose,
  orcamento,
  onSaved,
}: EditarCustosAssociadoModalProps) {
  const { addToast } = useToast();
  // Lido só na montagem: o pai monta o modal ao abrir, então atualizações do realtime
  // no orçamento não apagam o que o associado está digitando.
  const [form, setForm] = useState<CustosForm>(() => toForm(orcamento));
  const [isSaving, setIsSaving] = useState(false);

  const setCampo = (campo: keyof CustosForm, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  // Mantém o lucro atual visível mesmo que ele não esteja na lista padrão
  const lucroOptions = LUCRO_LIQUIDO_OPTIONS.some((o) => o.value === form.lucro_liquido_perc)
    ? LUCRO_LIQUIDO_OPTIONS
    : [...LUCRO_LIQUIDO_OPTIONS, { value: form.lucro_liquido_perc, label: `${form.lucro_liquido_perc}%` }];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.patch<Orcamento>(`/budgets/${orcamento.id}/custos`, {
        mao_obra: parseDecimal(form.mao_obra),
        equipamento_local: parseDecimal(form.equipamento_local),
        km: parseInt(form.km) || 0,
        custo_km: parseDecimal(form.custo_km),
        porcentagem_seguro: parseDecimal(form.porcentagem_seguro),
        porcentagem_imposto: parseDecimal(form.porcentagem_imposto),
        porcentagem_margem_seguranca: parseDecimal(form.porcentagem_margem_seguranca),
        lucro_liquido_perc: parseDecimal(form.lucro_liquido_perc),
      });

      onSaved({ ...orcamento, ...response.data });
      addToast(
        "success",
        "Custos Atualizados",
        (orcamento.preco_final_venda ?? 0) > 0
          ? "Os custos foram salvos e o preço de venda foi recalculado."
          : "Os custos foram salvos.",
      );
      onClose();
    } catch (err) {
      const mensagem = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      addToast("error", "Erro ao Salvar", mensagem || "Não foi possível salvar os custos.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[640px] p-6 sm:p-8">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Editar Custos Operacionais
      </h4>
      <p className="mt-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
        Se o kit já foi precificado, o preço de venda será recalculado automaticamente.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>
            Mão de Obra (R$/painel)
            <FieldTooltip content="Custo da mão de obra de instalação local." />
          </Label>
          <Input
            name="mao_obra"
            value={form.mao_obra}
            onChange={(e) => setCampo("mao_obra", formatDecimal(e.target.value))}
          />
        </div>
        <div>
          <Label>
            Equipamento Local (R$/painel)
            <FieldTooltip content="Custos de infraestrutura e materiais locais complementares." />
          </Label>
          <Input
            name="equipamento_local"
            value={form.equipamento_local}
            onChange={(e) => setCampo("equipamento_local", formatDecimal(e.target.value))}
          />
        </div>
        <div>
          <Label>Distância (km)</Label>
          <Input name="km" type="number" min="0" value={form.km} onChange={(e) => setCampo("km", e.target.value)} />
        </div>
        <div>
          <Label>Custo por km (R$)</Label>
          <Input
            name="custo_km"
            value={form.custo_km}
            onChange={(e) => setCampo("custo_km", formatDecimal(e.target.value))}
          />
        </div>
        <div>
          <Label>Seguro (%)</Label>
          <Input
            name="porcentagem_seguro"
            value={form.porcentagem_seguro}
            onChange={(e) => setCampo("porcentagem_seguro", formatDecimal(e.target.value))}
          />
        </div>
        <div>
          <Label>Imposto sobre Venda (%)</Label>
          <Input
            name="porcentagem_imposto"
            value={form.porcentagem_imposto}
            onChange={(e) => setCampo("porcentagem_imposto", formatDecimal(e.target.value))}
          />
        </div>
        <div>
          <Label>
            Margem de Segurança (%)
            <FieldTooltip content="Reserva para imprevistos da execução, como retrabalho ou retorno ao local. Calculada sobre o custo direto: kit, mão de obra, equipamento local e homologação (sem o km)." />
          </Label>
          <Input
            name="porcentagem_margem_seguranca"
            value={form.porcentagem_margem_seguranca}
            onChange={(e) => setCampo("porcentagem_margem_seguranca", formatDecimal(e.target.value))}
          />
        </div>
        <div>
          <Label>Lucro Líquido (%)</Label>
          <Select
            options={lucroOptions}
            value={form.lucro_liquido_perc}
            onChange={(v) => setCampo("lucro_liquido_perc", v)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </Modal>
  );
}
