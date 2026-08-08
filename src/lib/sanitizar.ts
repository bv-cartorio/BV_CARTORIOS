/**
 * Sanitização do HTML rico — enunciado, comentário, alternativa e post.
 *
 * Regra do projeto (ver CLAUDE.md): sanitiza-se **na escrita**, nunca na
 * leitura. O banco guarda HTML já confiável, e a renderização é só
 * `dangerouslySetInnerHTML` com a classe `.conteudo-rico`.
 *
 * Esta é a **única** allowlist do projeto. O admin, o seed e os scripts de
 * migração passam por aqui, e é o que torna verificável o critério "nenhuma tag
 * fora da allowlist" exigido em `docs/MIGRACAO.md`.
 */
import sanitizeHtml from "sanitize-html";

/** Allowlist acordada em `docs/MIGRACAO.md`. */
export const TAGS_PERMITIDAS = [
  "p",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "br",
  "sup",
  "sub",
] as const;

const OPCOES: sanitizeHtml.IOptions = {
  allowedTags: [...TAGS_PERMITIDAS],

  // Sem `class` e sem `style` em lugar nenhum: o visual vem de `.conteudo-rico`,
  // no CSS. Deixar estilo inline passar é deixar conteúdo colado do Word ditar a
  // aparência do site — e abre espaço para truques com `position` e `display`.
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
  },

  allowedSchemes: ["http", "https", "mailto"],
  // `data:` fica de fora de propósito: SVG embutido em data URI é vetor de
  // script conhecido, e imagem de verdade vai para o storage.
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,

  transformTags: {
    // Link externo em aba nova, sem levar o `window.opener` junto.
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
  },
};

/** Devolve o HTML podado à allowlist. Entrada vazia ou nula vira string vazia. */
export function sanitizarHtml(bruto: string | null | undefined): string {
  if (!bruto) return "";
  return sanitizeHtml(bruto, OPCOES).trim();
}

/** Só o texto, sem marcação — para resumos, buscas e conferência. */
export function apenasTexto(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `true` quando o conteúdo não tem texto nem imagem depois da poda.
 *
 * O editor de texto rico manda `<p></p>` quando o campo está "vazio" aos olhos
 * de quem escreve; validar por `length > 0` deixaria passar questão sem
 * enunciado.
 */
export function vazioAposSanitizar(bruto: string | null | undefined): boolean {
  const limpo = sanitizarHtml(bruto);
  if (limpo.includes("<img")) return false;
  return apenasTexto(limpo).length === 0;
}
