import type { Metadata } from "next";
import Link from "next/link";

import { Alerta } from "@/components/ui/alerta";
import { assinaturaVigente, exigirUsuario } from "@/lib/auth/guardas";
import { formatarData } from "@/lib/format";
import { COTA_DIARIA_GRATUITA } from "@/lib/questoes/cota";

export const metadata: Metadata = { title: "Painel" };

const ATALHOS = [
  {
    href: "/painel/questoes",
    titulo: "Resolver questões",
    descricao:
      "Busque por matéria, assunto, banca ou ano e resolva com comentário na hora.",
  },
  {
    href: "/painel/questoes?situacao=nao-respondidas",
    titulo: "Questões inéditas",
    descricao: "O que você ainda não respondeu, para não repetir conteúdo.",
  },
  {
    href: "/painel/questoes?situacao=erradas",
    titulo: "O que eu errei",
    descricao:
      "As questões que você já respondeu e ainda não acertou — a lista do que falta dominar.",
  },
  {
    href: "/painel/questoes?favoritas=1",
    titulo: "Minhas favoritas",
    descricao: "As que você separou para revisar antes da prova.",
  },
];

export default async function PainelPage() {
  const usuario = await exigirUsuario("/painel");
  const assinatura = await assinaturaVigente(usuario.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-marinho-800">
        Olá, {usuario.name.split(" ")[0]}
      </h1>

      {assinatura ? (
        <Alerta tipo="sucesso">
          Plano <strong>{assinatura.plan.name}</strong> ativo até{" "}
          {formatarData(assinatura.endsAt)}.
          {!assinatura.autoRenew && " A renovação automática está desligada."}
        </Alerta>
      ) : (
        <Alerta tipo="aviso">
          Você está no acesso gratuito: <strong>{COTA_DIARIA_GRATUITA}{" "}
          questões por dia</strong>, com comentário completo. O acervo sem limite
          é liberado com qualquer um dos planos.{" "}
          <Link href="/#planos" className="font-medium underline">
            Ver planos
          </Link>
        </Alerta>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {ATALHOS.map((atalho) => (
          <Link
            key={atalho.href}
            href={atalho.href}
            className="rounded-2xl border border-creme-200 bg-white p-5 transition-colors hover:border-marinho-200"
          >
            <h2 className="font-semibold text-marinho-800">{atalho.titulo}</h2>
            <p className="mt-1.5 text-sm text-marinho-600">
              {atalho.descricao}
            </p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-creme-200 bg-white p-6">
        <h2 className="font-semibold text-marinho-800">Em construção</h2>
        <p className="mt-2 text-sm text-marinho-600">
          Cadernos, simulados cronometrados e as estatísticas de desempenho
          entram nos próximos módulos.
        </p>
      </div>
    </div>
  );
}
