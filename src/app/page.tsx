import Link from "next/link";

import { PlanCard } from "@/components/plan-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/prisma";

/** A home é reconstruída de hora em hora; planos e contagens mudam pouco. */
export const revalidate = 3600;

const ETAPAS = [
  {
    titulo: "Filtre o que precisa treinar",
    texto:
      "Selecione matéria, assunto, banca e ano — ou volte apenas às questões que você errou.",
  },
  {
    titulo: "Resolva e entenda na hora",
    texto:
      "Ao responder, você vê o gabarito e o comentário completo, com fundamento legal, doutrina e jurisprudência.",
  },
  {
    titulo: "Acompanhe sua evolução",
    texto:
      "O painel mostra percentual de acerto por matéria e aponta onde o seu rendimento está abaixo da média.",
  },
];

const PERGUNTAS = [
  {
    pergunta: "As questões são inéditas?",
    resposta:
      "Sim. O acervo é produzido pelo Prof. César Bravo, Tabelião de Notas, com foco no estilo de cobrança da FGV e do Exame Nacional dos Cartórios (ENAC).",
  },
  {
    pergunta: "Existe limite de questões por dia?",
    resposta:
      "Não. Todos os planos dão acesso ilimitado a todo o acervo durante a vigência da assinatura.",
  },
  {
    pergunta: "Consigo estudar pelo celular?",
    resposta:
      "Sim. A plataforma é feita para o celular em primeiro lugar, e o seu histórico de respostas acompanha você em qualquer aparelho.",
  },
  {
    pergunta: "Como funciona o pagamento?",
    resposta:
      "Você paga por Pix ou cartão de crédito. No cartão, a renovação é automática ao fim do período e pode ser cancelada a qualquer momento.",
  },
];

export default async function HomePage() {
  const [planos, totalQuestoes, materias] = await Promise.all([
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.question.count({ where: { status: "PUBLISHED" } }),
    prisma.subject.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero ------------------------------------------------------------ */}
        <section className="bg-gradient-to-b from-marinho-700 to-marinho-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
            <p className="text-sm font-medium uppercase tracking-widest text-laranja-400">
              Concursos de cartório · FGV e ENAC
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Questões inéditas e comentadas por quem é da atividade
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-marinho-100">
              Treine com um acervo construído para o estilo das bancas dos
              concursos notariais e de registro. Cada questão traz fundamentação
              completa — e não apenas a letra do gabarito.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#planos"
                className="rounded-lg bg-laranja-500 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-laranja-400"
              >
                Ver planos
              </Link>
              <Link
                href="#como-funciona"
                className="rounded-lg border border-marinho-400 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-marinho-700"
              >
                Como funciona
              </Link>
            </div>
          </div>
        </section>

        {/* Números --------------------------------------------------------- */}
        <section className="border-b border-creme-200 bg-creme">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-marinho-600">Questões publicadas</dt>
              <dd className="mt-1 text-3xl font-bold text-marinho-800">
                {totalQuestoes.toLocaleString("pt-BR")}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-marinho-600">Matérias cobertas</dt>
              <dd className="mt-1 text-3xl font-bold text-marinho-800">
                {materias.length}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-sm text-marinho-600">Comentários</dt>
              <dd className="mt-1 text-3xl font-bold text-marinho-800">
                Em texto e vídeo
              </dd>
            </div>
          </dl>
        </section>

        {/* Como funciona --------------------------------------------------- */}
        <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-marinho-800">
            Como funciona
          </h2>
          <p className="mt-3 max-w-2xl text-marinho-600">
            Um ciclo simples de estudo por questões, do filtro à correção.
          </p>

          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {ETAPAS.map((etapa, indice) => (
              <li
                key={etapa.titulo}
                className="rounded-2xl border border-creme-200 p-6"
              >
                <span className="grid size-9 place-items-center rounded-full bg-marinho-700 text-sm font-semibold text-white">
                  {indice + 1}
                </span>
                <h3 className="mt-4 font-semibold text-marinho-800">
                  {etapa.titulo}
                </h3>
                <p className="mt-2 text-sm text-marinho-600">{etapa.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Matérias -------------------------------------------------------- */}
        {materias.length > 0 && (
          <section className="border-y border-creme-200 bg-creme">
            <div className="mx-auto max-w-6xl px-4 py-16">
              <h2 className="text-3xl font-bold tracking-tight text-marinho-800">
                Matérias do acervo
              </h2>
              <ul className="mt-8 flex flex-wrap gap-2">
                {materias.map((materia) => (
                  <li
                    key={materia.id}
                    className="rounded-full border border-creme-200 bg-white px-4 py-2 text-sm text-marinho-700"
                  >
                    {materia.name}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Planos ---------------------------------------------------------- */}
        <section id="planos" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-marinho-800">
            Planos
          </h2>
          <p className="mt-3 max-w-2xl text-marinho-600">
            Todos com acesso ilimitado ao acervo completo. Sem fidelidade.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {planos.map((plano) => (
              <PlanCard
                key={plano.id}
                slug={plano.slug}
                name={plano.name}
                description={plano.description}
                priceCents={plano.priceCents}
                durationMonths={plano.durationMonths}
                destaque={plano.slug === "trimestral"}
              />
            ))}
          </div>
        </section>

        {/* Dúvidas --------------------------------------------------------- */}
        <section className="border-t border-creme-200 bg-creme">
          <div className="mx-auto max-w-3xl px-4 py-20">
            <h2 className="text-3xl font-bold tracking-tight text-marinho-800">
              Perguntas frequentes
            </h2>
            <dl className="mt-8 space-y-6">
              {PERGUNTAS.map((item) => (
                <div
                  key={item.pergunta}
                  className="rounded-2xl border border-creme-200 bg-white p-6"
                >
                  <dt className="font-semibold text-marinho-800">
                    {item.pergunta}
                  </dt>
                  <dd className="mt-2 text-sm text-marinho-600">
                    {item.resposta}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
