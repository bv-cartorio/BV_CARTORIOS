import Link from "next/link";

type PaginacaoProps = {
  pagina: number;
  paginas: number;
  /** Monta a URL de uma página, preservando os filtros da busca. */
  href: (pagina: number) => string;
};

/** Janela de páginas em volta da atual, sempre com início e fim visíveis. */
function janela(pagina: number, paginas: number): number[] {
  const numeros = new Set<number>([1, paginas]);

  for (let n = pagina - 2; n <= pagina + 2; n++) {
    if (n >= 1 && n <= paginas) numeros.add(n);
  }

  return [...numeros].sort((a, b) => a - b);
}

const BASE =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors";

export function Paginacao({ pagina, paginas, href }: PaginacaoProps) {
  if (paginas <= 1) return null;

  const numeros = janela(pagina, paginas);

  return (
    <nav
      aria-label="Paginação das questões"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      {pagina > 1 && (
        <Link
          href={href(pagina - 1)}
          rel="prev"
          className={`${BASE} border-creme-200 bg-white text-marinho-700 hover:border-marinho-200 hover:text-marinho-900`}
        >
          Anterior
        </Link>
      )}

      {numeros.map((numero, indice) => (
        <span key={numero} className="flex items-center gap-1.5">
          {indice > 0 && numeros[indice - 1] !== numero - 1 && (
            <span aria-hidden className="px-1 text-marinho-400">
              …
            </span>
          )}

          <Link
            href={href(numero)}
            aria-current={numero === pagina ? "page" : undefined}
            aria-label={`Página ${numero}`}
            className={
              numero === pagina
                ? `${BASE} border-marinho-700 bg-marinho-700 font-semibold text-white`
                : `${BASE} border-creme-200 bg-white text-marinho-700 hover:border-marinho-200 hover:text-marinho-900`
            }
          >
            {numero}
          </Link>
        </span>
      ))}

      {pagina < paginas && (
        <Link
          href={href(pagina + 1)}
          rel="next"
          className={`${BASE} border-creme-200 bg-white text-marinho-700 hover:border-marinho-200 hover:text-marinho-900`}
        >
          Próxima
        </Link>
      )}
    </nav>
  );
}
