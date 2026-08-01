const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Formata centavos como moeda brasileira: 9990 → "R$ 99,90". */
export function formatarPreco(centavos: number): string {
  return moeda.format(centavos / 100);
}

/** Formata data no padrão brasileiro: "01/08/2026". */
export function formatarData(data: Date): string {
  return dataCompleta.format(data);
}

/**
 * Preço equivalente por mês de um plano, usado para comparar planos de
 * durações diferentes na página de vendas.
 */
export function precoMensalEquivalente(
  centavos: number,
  meses: number,
): string {
  return formatarPreco(Math.round(centavos / meses));
}
