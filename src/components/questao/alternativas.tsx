import type { Letter } from "@/generated/prisma/enums";
import type { Alternativa } from "@/lib/questoes/consulta";

type Resultado = { minhaLetra: Letter; gabarito: Letter };

type AlternativasProps = {
  codigo: number;
  alternativas: Alternativa[];
  /** Ausente enquanto a questão não foi respondida. */
  resultado?: Resultado;
};

const CAIXA =
  "flex items-start gap-3 rounded-xl border px-4 py-3 text-marinho-800 transition-colors";

const LETRA =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold";

/**
 * O texto da alternativa é HTML sanitizado na escrita (ver o schema), mesmo
 * quando na prática é uma frase simples. Renderizar como HTML mantém o mesmo
 * contrato do enunciado e do comentário.
 */
function Texto({ html }: { html: string }) {
  return (
    <span
      className="conteudo-rico min-w-0 flex-1 text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function Alternativas({
  codigo,
  alternativas,
  resultado,
}: AlternativasProps) {
  if (resultado) {
    return (
      <ul className="mt-4 space-y-2">
        {alternativas.map(({ letra, texto }) => {
          const correta = letra === resultado.gabarito;
          const minha = letra === resultado.minhaLetra;

          return (
            <li
              key={letra}
              className={`${CAIXA} ${
                correta
                  ? "border-marinho-300 bg-marinho-50"
                  : minha
                    ? "border-laranja-300 bg-laranja-50"
                    : "border-creme-200 bg-white"
              }`}
            >
              <span
                className={`${LETRA} ${
                  correta
                    ? "bg-marinho-700 text-white"
                    : minha
                      ? "bg-laranja-500 text-white"
                      : "bg-creme text-marinho-600"
                }`}
              >
                {letra}
              </span>

              <Texto html={texto} />

              {(correta || minha) && (
                <span
                  className={`shrink-0 text-xs font-semibold ${
                    correta ? "text-marinho-700" : "text-laranja-600"
                  }`}
                >
                  {correta ? "Gabarito" : "Sua resposta"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <fieldset className="mt-4">
      <legend className="sr-only">Alternativas da questão {codigo}</legend>

      <div className="space-y-2">
        {alternativas.map(({ letra, texto }) => (
          <label key={letra} className="block cursor-pointer">
            <input
              type="radio"
              name="letra"
              value={letra}
              required
              className="peer sr-only"
            />

            <span
              className={`${CAIXA} border-creme-200 bg-white hover:border-marinho-200 peer-checked:border-marinho-400 peer-checked:bg-marinho-50 peer-focus-visible:ring-2 peer-focus-visible:ring-marinho-200`}
            >
              <span className={`${LETRA} bg-creme text-marinho-700`}>
                {letra}
              </span>

              <Texto html={texto} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
