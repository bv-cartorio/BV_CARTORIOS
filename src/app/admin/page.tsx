import type { Metadata } from "next";
import Link from "next/link";

import type { QuestionStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { configurado as storageConfigurado } from "@/lib/storage";

export const metadata: Metadata = { title: "Início" };

function Numero({
  valor,
  rotulo,
  href,
  destaque,
}: {
  valor: number;
  rotulo: string;
  href: string;
  destaque?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border bg-white p-5 transition-colors ${
        destaque && valor > 0
          ? "border-laranja-300 hover:border-laranja-500"
          : "border-creme-200 hover:border-marinho-200"
      }`}
    >
      <p
        className={`text-3xl font-bold ${
          destaque && valor > 0 ? "text-laranja-600" : "text-marinho-800"
        }`}
      >
        {valor}
      </p>
      <p className="mt-1 text-sm text-marinho-600">{rotulo}</p>
    </Link>
  );
}

export default async function AdminPage() {
  const [porStatus, reportesAbertos, materias, bancas] = await Promise.all([
    prisma.question.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.questionReport.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.subject.count({ where: { active: true } }),
    prisma.board.count(),
  ]);

  const contar = (status: QuestionStatus) =>
    porStatus.find((linha) => linha.status === status)?._count._all ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Administração
        </h1>

        <Link
          href="/admin/questoes/nova"
          className="rounded-lg bg-laranja-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-laranja-600"
        >
          Nova questão
        </Link>
      </div>

      {!storageConfigurado() && (
        <div
          role="status"
          className="rounded-lg border border-creme-200 bg-white px-4 py-3 text-sm text-marinho-700"
        >
          <strong className="font-semibold">Imagens não configuradas.</strong>{" "}
          O envio de imagem no editor está desligado até as variáveis{" "}
          <code className="rounded bg-creme px-1 text-xs">R2_*</code> serem
          preenchidas (ver <code className="rounded bg-creme px-1 text-xs">.env.example</code>).
          Todo o resto funciona normalmente.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-marinho-600 uppercase">
          Acervo
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Numero
            valor={contar("PUBLISHED")}
            rotulo="Publicadas"
            href="/admin/questoes?status=PUBLISHED"
          />
          <Numero
            valor={contar("REVIEW")}
            rotulo="Em revisão"
            href="/admin/questoes?status=REVIEW"
          />
          <Numero
            valor={contar("DRAFT")}
            rotulo="Rascunhos"
            href="/admin/questoes?status=DRAFT"
          />
          <Numero
            valor={contar("DISABLED")}
            rotulo="Desativadas"
            href="/admin/questoes?status=DISABLED"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-marinho-600 uppercase">
          Precisa de atenção
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <Numero
            valor={reportesAbertos}
            rotulo="Erros reportados por alunos, na fila"
            href="/admin/reportes"
            destaque
          />
          <Numero
            valor={materias}
            rotulo="Matérias ativas"
            href="/admin/taxonomia"
          />
          <Numero valor={bancas} rotulo="Bancas" href="/admin/taxonomia" />
        </div>
      </section>
    </div>
  );
}
