import type { Orcamento } from "../hooks/useBudgets";

const PADRAO = { imposto: 8, seguro: 1, margem: 3 } as const;

/**
 * Porcentagem de imposto, seguro ou margem de segurança do orçamento. O PocketBase grava 0 em número vazio, então
 * orçamentos antigos podem ter a porcentagem 0 com o valor em R$ preenchido: nesse caso ela é
 * deduzida do valor sobre a base em que incide (mesma regra de resolverTaxa no backend).
 */
export function resolverPorcentagem(orcamento: Orcamento, tipo: "imposto" | "seguro" | "margem"): number {
  const porcentagem = {
    imposto: orcamento.porcentagem_imposto,
    seguro: orcamento.porcentagem_seguro,
    margem: orcamento.porcentagem_margem_seguranca,
  }[tipo];
  if (porcentagem !== undefined && porcentagem !== null && porcentagem > 0) return porcentagem;

  const valor = { imposto: orcamento.imposto, seguro: orcamento.seguro, margem: orcamento.margem_seguranca }[tipo] || 0;
  const precoSemKm = (orcamento.preco_final_venda || 0) - (orcamento.km || 0) * (orcamento.custo_km || 0);
  // Só orçamentos anteriores ao campo ficam sem a % da margem, e neles ela era "por dentro" sobre o kit
  // licenciado: margem / (kit licenciado + margem)
  const base = {
    imposto: precoSemKm - (orcamento.valor_kit_final || 0),
    seguro: precoSemKm,
    margem: (orcamento.valor_kit_final || 0) + valor,
  }[tipo];
  if (valor > 0 && base > 0) return Number(((valor / base) * 100).toFixed(2));

  return porcentagem === 0 ? 0 : PADRAO[tipo];
}

/** Porcentagem no formato pt-BR, sem zeros desnecessários: 20,47 · 15 · 1,5 */
export function formatarPorcentagem(valor: number | undefined | null): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(valor || 0);
}
