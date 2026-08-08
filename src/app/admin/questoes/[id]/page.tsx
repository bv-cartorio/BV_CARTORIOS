import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormularioQuestao } from "@/components/admin/questoes/formulario";
import { obterQuestaoParaEdicao } from "@/lib/questoes/admin";
import { carregarTaxonomia } from "@/lib/questoes/consulta";
import { ESTILO_STATUS, ROTULO_STATUS } from "@/lib/questoes/rotulos";
import { configurado } from "@/lib/storage";

export const metadata: Metadata = { title: "Editar questão" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarQuestaoPage({ params }: PageProps) {
  const { id } = await params;

  const [questao, taxonomia] = await Promise.all([
    obterQuestaoParaEdicao(id),
    carregarTaxonomia(),
  ]);

  if (!questao) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
          Questão {questao.code}
        </h1>

        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTILO_STATUS[questao.status]}`}
        >
          {ROTULO_STATUS[questao.status]}
        </span>

        {questao.status === "PUBLISHED" && (
          <Link
            href={`/painel/questoes?q=${questao.code}`}
            className="ml-auto text-sm font-medium text-marinho-600 hover:text-marinho-900"
          >
            Ver como o aluno vê
          </Link>
        )}
      </div>

      <FormularioQuestao
        taxonomia={taxonomia}
        questao={questao}
        imagensLigadas={configurado()}
      />
    </div>
  );
}
