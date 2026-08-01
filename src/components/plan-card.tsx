import Link from "next/link";

import { formatarPreco, precoMensalEquivalente } from "@/lib/format";

type PlanCardProps = {
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  durationMonths: number;
  destaque?: boolean;
};

const BENEFICIOS = [
  "Questões inéditas ilimitadas",
  "Comentário completo do professor",
  "Comentários em vídeo nas questões selecionadas",
  "Cadernos personalizados e favoritas",
  "Simulados cronometrados",
  "Estatísticas de desempenho por matéria",
];

export function PlanCard({
  slug,
  name,
  description,
  priceCents,
  durationMonths,
  destaque = false,
}: PlanCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        destaque
          ? "border-marinho-700 bg-marinho-800 text-white shadow-xl"
          : "border-marinho-100 bg-white"
      }`}
    >
      {destaque && (
        <span className="absolute -top-3 left-6 rounded-full bg-dourado-400 px-3 py-1 text-xs font-semibold text-marinho-900">
          Mais escolhido
        </span>
      )}

      <h3
        className={`text-lg font-semibold ${destaque ? "text-white" : "text-marinho-800"}`}
      >
        {name}
      </h3>

      {description && (
        <p
          className={`mt-1 text-sm ${destaque ? "text-marinho-100" : "text-marinho-600"}`}
        >
          {description}
        </p>
      )}

      <p className="mt-6 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight">
          {formatarPreco(priceCents)}
        </span>
        {durationMonths > 1 && (
          <span
            className={`text-sm ${destaque ? "text-marinho-200" : "text-marinho-500"}`}
          >
            / {durationMonths} meses
          </span>
        )}
      </p>

      {durationMonths > 1 && (
        <p
          className={`mt-1 text-sm ${destaque ? "text-marinho-200" : "text-marinho-500"}`}
        >
          equivale a {precoMensalEquivalente(priceCents, durationMonths)} por mês
        </p>
      )}

      <ul
        className={`mt-6 flex-1 space-y-3 text-sm ${destaque ? "text-marinho-100" : "text-marinho-700"}`}
      >
        {BENEFICIOS.map((beneficio) => (
          <li key={beneficio} className="flex gap-2">
            <span
              aria-hidden
              className={destaque ? "text-dourado-300" : "text-dourado-500"}
            >
              ✓
            </span>
            {beneficio}
          </li>
        ))}
      </ul>

      <Link
        href={`/assinar/${slug}`}
        className={`mt-8 rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors ${
          destaque
            ? "bg-dourado-400 text-marinho-900 hover:bg-dourado-300"
            : "bg-marinho-700 text-white hover:bg-marinho-800"
        }`}
      >
        Assinar plano {name.toLowerCase()}
      </Link>

      <p
        className={`mt-3 text-center text-xs ${destaque ? "text-marinho-200" : "text-marinho-500"}`}
      >
        Pix ou cartão · acesso imediato
      </p>
    </div>
  );
}
