"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { EstadoTaxonomia, Nivel } from "@/app/admin/taxonomia/estados";
import { exigirPapel } from "@/lib/auth/guardas";
import { prisma } from "@/lib/prisma";
import { slugUnico } from "@/lib/slug";

const CAMINHO = "/admin/taxonomia";

const nivelSchema = z.enum(["materia", "assunto", "subassunto", "banca"]);
const nomeSchema = z.string().trim().min(2, "Informe um nome").max(120);
const idSchema = z.string().trim().min(1);

async function admin() {
  return exigirPapel(["ADMIN"], CAMINHO);
}

function pronto(mensagem: string): EstadoTaxonomia {
  revalidatePath(CAMINHO);
  return { sucesso: mensagem };
}

// ---------------------------------------------------------------------------
// Criar
// ---------------------------------------------------------------------------

/** Próxima posição livre, para o item novo entrar no fim da lista. */
async function proximaPosicao(
  nivel: Nivel,
  paiId: string | null,
): Promise<number> {
  if (nivel === "materia") {
    const ultimo = await prisma.subject.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return (ultimo?.sortOrder ?? 0) + 1;
  }

  if (nivel === "assunto") {
    const ultimo = await prisma.topic.findFirst({
      where: { subjectId: paiId! },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return (ultimo?.sortOrder ?? 0) + 1;
  }

  const ultimo = await prisma.subtopic.findFirst({
    where: { topicId: paiId! },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return (ultimo?.sortOrder ?? 0) + 1;
}

export async function criarItem(
  _anterior: EstadoTaxonomia,
  dados: FormData,
): Promise<EstadoTaxonomia> {
  await admin();

  const nivel = nivelSchema.safeParse(dados.get("nivel"));
  const nome = nomeSchema.safeParse(dados.get("nome"));
  const paiId = typeof dados.get("paiId") === "string" ? String(dados.get("paiId")) : null;

  if (!nivel.success) return { erro: "Nível inválido." };
  if (!nome.success) {
    return { erro: nome.error.issues[0]?.message ?? "Nome inválido." };
  }

  if (nivel.data !== "materia" && nivel.data !== "banca" && !paiId) {
    return { erro: "Item sem pai definido." };
  }

  if (nivel.data === "banca") {
    const ocupados = await prisma.board.findMany({ select: { slug: true } });
    await prisma.board.create({
      data: {
        name: nome.data,
        slug: slugUnico(nome.data, ocupados.map((b) => b.slug)),
      },
    });
    return pronto("Banca criada.");
  }

  if (nivel.data === "materia") {
    const ocupados = await prisma.subject.findMany({ select: { slug: true } });
    await prisma.subject.create({
      data: {
        name: nome.data,
        slug: slugUnico(nome.data, ocupados.map((m) => m.slug)),
        sortOrder: await proximaPosicao("materia", null),
      },
    });
    return pronto("Matéria criada.");
  }

  if (nivel.data === "assunto") {
    // Slug de assunto só precisa ser único dentro da matéria (@@unique).
    const ocupados = await prisma.topic.findMany({
      where: { subjectId: paiId! },
      select: { slug: true },
    });
    await prisma.topic.create({
      data: {
        subjectId: paiId!,
        name: nome.data,
        slug: slugUnico(nome.data, ocupados.map((a) => a.slug)),
        sortOrder: await proximaPosicao("assunto", paiId),
      },
    });
    return pronto("Assunto criado.");
  }

  const ocupados = await prisma.subtopic.findMany({
    where: { topicId: paiId! },
    select: { slug: true },
  });
  await prisma.subtopic.create({
    data: {
      topicId: paiId!,
      name: nome.data,
      slug: slugUnico(nome.data, ocupados.map((s) => s.slug)),
      sortOrder: await proximaPosicao("subassunto", paiId),
    },
  });
  return pronto("Subassunto criado.");
}

// ---------------------------------------------------------------------------
// Renomear
// ---------------------------------------------------------------------------

/**
 * Renomeia sem tocar no slug.
 *
 * O slug é a chave usada por links e pelo mapa de taxonomia da migração
 * (`scripts/migracao/taxonomia.json`). Corrigir um acento no nome não pode
 * quebrar referência nenhuma — nome é rótulo, slug é identidade.
 */
export async function renomearItem(
  _anterior: EstadoTaxonomia,
  dados: FormData,
): Promise<EstadoTaxonomia> {
  await admin();

  const nivel = nivelSchema.safeParse(dados.get("nivel"));
  const id = idSchema.safeParse(dados.get("id"));
  const nome = nomeSchema.safeParse(dados.get("nome"));

  if (!nivel.success || !id.success) return { erro: "Item inválido." };
  if (!nome.success) {
    return { erro: nome.error.issues[0]?.message ?? "Nome inválido." };
  }

  const onde = { where: { id: id.data }, data: { name: nome.data } };

  if (nivel.data === "materia") await prisma.subject.update(onde);
  else if (nivel.data === "assunto") await prisma.topic.update(onde);
  else if (nivel.data === "subassunto") await prisma.subtopic.update(onde);
  else await prisma.board.update(onde);

  return pronto("Nome atualizado.");
}

// ---------------------------------------------------------------------------
// Ativar e desativar
// ---------------------------------------------------------------------------

/**
 * Liga e desliga o nó.
 *
 * Desativar é o caminho seguro para tirar algo de circulação: some dos filtros
 * do aluno e do admin, mas nenhuma questão perde a classificação. É o que se
 * deve fazer no lugar de excluir, quase sempre.
 */
export async function alternarAtivo(
  nivel: Nivel,
  id: string,
): Promise<EstadoTaxonomia> {
  await admin();

  if (nivel === "banca") return { erro: "Banca não tem ativação." };

  if (nivel === "materia") {
    const atual = await prisma.subject.findUnique({
      where: { id },
      select: { active: true },
    });
    if (!atual) return { erro: "Matéria não encontrada." };
    await prisma.subject.update({
      where: { id },
      data: { active: !atual.active },
    });
    return pronto(atual.active ? "Matéria desativada." : "Matéria ativada.");
  }

  if (nivel === "assunto") {
    const atual = await prisma.topic.findUnique({
      where: { id },
      select: { active: true },
    });
    if (!atual) return { erro: "Assunto não encontrado." };
    await prisma.topic.update({
      where: { id },
      data: { active: !atual.active },
    });
    return pronto(atual.active ? "Assunto desativado." : "Assunto ativado.");
  }

  const atual = await prisma.subtopic.findUnique({
    where: { id },
    select: { active: true },
  });
  if (!atual) return { erro: "Subassunto não encontrado." };
  await prisma.subtopic.update({
    where: { id },
    data: { active: !atual.active },
  });
  return pronto(atual.active ? "Subassunto desativado." : "Subassunto ativado.");
}

// ---------------------------------------------------------------------------
// Excluir
// ---------------------------------------------------------------------------

/**
 * Exclui o nó, recusando quando o estrago seria irreversível.
 *
 * Matéria com questão é barrada aqui **antes** de o banco barrar, para a pessoa
 * ler uma frase em português em vez de um erro de chave estrangeira. Assunto e
 * subassunto o banco deixa apagar em silêncio, então a confirmação com o número
 * de questões afetadas acontece na interface — e o número é recontado aqui, no
 * caso de a tela estar velha.
 */
export async function excluirItem(
  _anterior: EstadoTaxonomia,
  dados: FormData,
): Promise<EstadoTaxonomia> {
  await admin();

  const nivel = nivelSchema.safeParse(dados.get("nivel"));
  const id = idSchema.safeParse(dados.get("id"));

  if (!nivel.success || !id.success) return { erro: "Item inválido." };

  if (nivel.data === "materia") {
    const emUso = await prisma.question.count({ where: { subjectId: id.data } });
    if (emUso > 0) {
      return {
        erro: `Esta matéria classifica ${emUso} ${emUso === 1 ? "questão" : "questões"} e não pode ser excluída. Reclassifique-as antes, ou desative a matéria.`,
      };
    }
    await prisma.subject.delete({ where: { id: id.data } });
    return pronto("Matéria excluída.");
  }

  if (nivel.data === "banca") {
    const emUso = await prisma.question.count({ where: { boardId: id.data } });
    await prisma.board.delete({ where: { id: id.data } });
    return pronto(
      emUso > 0
        ? `Banca excluída. ${emUso} ${emUso === 1 ? "questão ficou" : "questões ficaram"} sem banca.`
        : "Banca excluída.",
    );
  }

  if (nivel.data === "assunto") {
    const emUso = await prisma.question.count({ where: { topicId: id.data } });
    await prisma.topic.delete({ where: { id: id.data } });
    return pronto(
      emUso > 0
        ? `Assunto excluído. ${emUso} ${emUso === 1 ? "questão ficou" : "questões ficaram"} sem assunto.`
        : "Assunto excluído.",
    );
  }

  const emUso = await prisma.question.count({ where: { subtopicId: id.data } });
  await prisma.subtopic.delete({ where: { id: id.data } });
  return pronto(
    emUso > 0
      ? `Subassunto excluído. ${emUso} ${emUso === 1 ? "questão ficou" : "questões ficaram"} sem subassunto.`
      : "Subassunto excluído.",
  );
}
