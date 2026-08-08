/**
 * Filtros da busca de questões.
 *
 * Os filtros vivem na URL, não em estado de cliente: o link fica compartilhável,
 * o botão voltar do navegador funciona e a página segue sendo server component
 * — nada de mandar o acervo inteiro para o navegador só para filtrar.
 *
 * Matéria, assunto, subassunto e banca viajam como **id**. Os slugs de `Topic` e
 * `Subtopic` só são únicos dentro do pai (`@@unique([subjectId, slug])`), então
 * um slug solto na URL seria ambíguo. Id vale para todos, com uma regra só.
 */
import { z } from "zod";

export const SITUACOES = [
  "todas",
  "nao-respondidas",
  "respondidas",
  "acertadas",
  "erradas",
] as const;

export type Situacao = (typeof SITUACOES)[number];

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  todas: "Todas",
  "nao-respondidas": "Não respondidas",
  respondidas: "Respondidas",
  acertadas: "Acertadas",
  erradas: "Erradas",
};

export const QUESTOES_POR_PAGINA = 10;

/**
 * Campo de texto vindo da URL: nunca lança. Valor ausente, vazio ou grande
 * demais vira `undefined` — quem digita na barra de endereços não merece uma
 * tela de erro, só um filtro ignorado.
 */
function texto(max: number) {
  return z.string().trim().min(1).max(max).optional().catch(undefined);
}

const filtrosSchema = z.object({
  materia: texto(40),
  assunto: texto(40),
  subassunto: texto(40),
  banca: texto(40),
  ano: z.coerce.number().int().min(1980).max(2100).optional().catch(undefined),
  situacao: z.enum(SITUACOES).catch("todas"),
  favoritas: z.string().optional().catch(undefined),
  q: texto(120),
  pagina: z.coerce.number().int().min(1).max(9999).catch(1),
});

export type Filtros = Omit<z.infer<typeof filtrosSchema>, "favoritas"> & {
  favoritas: boolean;
};

export const FILTROS_VAZIOS: Filtros = {
  materia: undefined,
  assunto: undefined,
  subassunto: undefined,
  banca: undefined,
  ano: undefined,
  situacao: "todas",
  favoritas: false,
  q: undefined,
  pagina: 1,
};

type Params = Record<string, string | string[] | undefined>;

/** Lê os `searchParams` da rota e devolve filtros já normalizados. */
export function lerFiltros(params: Params): Filtros {
  const bruto = Object.fromEntries(
    Object.entries(params).map(([chave, valor]) => [
      chave,
      Array.isArray(valor) ? valor[0] : valor,
    ]),
  );

  const dados = filtrosSchema.parse(bruto);

  const filtros: Filtros = { ...dados, favoritas: dados.favoritas === "1" };

  // Assunto sem matéria (ou subassunto sem assunto) é resquício de um filtro
  // trocado pela metade; descartar evita listar zero questões sem explicação.
  if (!filtros.materia) filtros.assunto = undefined;
  if (!filtros.assunto) filtros.subassunto = undefined;

  return filtros;
}

/** Serializa apenas o que difere do padrão, para a URL não encher de ruído. */
export function paraQuery(filtros: Partial<Filtros>): string {
  const params = new URLSearchParams();

  if (filtros.materia) params.set("materia", filtros.materia);
  if (filtros.materia && filtros.assunto) params.set("assunto", filtros.assunto);
  if (filtros.assunto && filtros.subassunto) {
    params.set("subassunto", filtros.subassunto);
  }
  if (filtros.banca) params.set("banca", filtros.banca);
  if (filtros.ano) params.set("ano", String(filtros.ano));
  if (filtros.situacao && filtros.situacao !== "todas") {
    params.set("situacao", filtros.situacao);
  }
  if (filtros.favoritas) params.set("favoritas", "1");
  if (filtros.q) params.set("q", filtros.q);
  if (filtros.pagina && filtros.pagina > 1) {
    params.set("pagina", String(filtros.pagina));
  }

  return params.toString();
}

/** URL da busca com os filtros aplicados. Trocar filtro sempre volta à página 1. */
export function urlQuestoes(filtros: Partial<Filtros>): string {
  const query = paraQuery(filtros);
  return query ? `/painel/questoes?${query}` : "/painel/questoes";
}

export function temFiltroAtivo(filtros: Filtros): boolean {
  return Boolean(
    filtros.materia ||
      filtros.banca ||
      filtros.ano ||
      filtros.q ||
      filtros.favoritas ||
      filtros.situacao !== "todas",
  );
}
