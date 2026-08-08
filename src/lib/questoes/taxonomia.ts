/**
 * Taxonomia para a administração: a árvore inteira com o peso de cada nó.
 *
 * A contagem de questões não é enfeite. As chaves estrangeiras tratam os três
 * níveis de forma diferente:
 *
 * - `questions.subjectId` → **RESTRICT**: o banco recusa apagar matéria em uso;
 * - `questions.topicId` e `subtopicId` → **SET NULL**: apagar assunto ou
 *   subassunto desclassifica as questões **em silêncio**, sem erro nenhum;
 * - `topics.subjectId` e `subtopics.topicId` → **CASCADE**: apagar um pai leva
 *   os filhos junto.
 *
 * Ou seja: sem mostrar quantas questões dependem do nó, um clique distraído
 * apaga a classificação de dezenas de questões e ninguém fica sabendo.
 */
import { prisma } from "@/lib/prisma";

export type NoTaxonomia = {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  /** Questões que apontam diretamente para este nó. */
  questoes: number;
};

export type AssuntoAdmin = NoTaxonomia & { subassuntos: NoTaxonomia[] };
export type MateriaAdmin = NoTaxonomia & { assuntos: AssuntoAdmin[] };

export type BancaAdmin = {
  id: string;
  nome: string;
  slug: string;
  questoes: number;
};

export type ArvoreTaxonomia = {
  materias: MateriaAdmin[];
  bancas: BancaAdmin[];
};

export async function carregarArvoreAdmin(): Promise<ArvoreTaxonomia> {
  const [materias, bancas] = await Promise.all([
    prisma.subject.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        _count: { select: { questions: true } },
        topics: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            active: true,
            _count: { select: { questions: true } },
            subtopics: {
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
              select: {
                id: true,
                name: true,
                slug: true,
                active: true,
                _count: { select: { questions: true } },
              },
            },
          },
        },
      },
    }),
    prisma.board.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { questions: true } },
      },
    }),
  ]);

  return {
    materias: materias.map((materia) => ({
      id: materia.id,
      nome: materia.name,
      slug: materia.slug,
      ativo: materia.active,
      questoes: materia._count.questions,
      assuntos: materia.topics.map((assunto) => ({
        id: assunto.id,
        nome: assunto.name,
        slug: assunto.slug,
        ativo: assunto.active,
        questoes: assunto._count.questions,
        subassuntos: assunto.subtopics.map((sub) => ({
          id: sub.id,
          nome: sub.name,
          slug: sub.slug,
          ativo: sub.active,
          questoes: sub._count.questions,
        })),
      })),
    })),
    bancas: bancas.map((banca) => ({
      id: banca.id,
      nome: banca.name,
      slug: banca.slug,
      questoes: banca._count.questions,
    })),
  };
}
