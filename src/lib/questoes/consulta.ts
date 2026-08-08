/**
 * Consulta do acervo de questões para a área do aluno.
 *
 * Regra que atravessa o arquivo: **gabarito e comentário não saem daqui antes
 * de a questão ser respondida**. A listagem manda enunciado e alternativas; a
 * resolução é carregada à parte, só para as questões que o aluno já respondeu
 * (e, no ato de responder, pela server action). É isso que impede ler a
 * resposta no código-fonte da página.
 */
import type { Prisma } from "@/generated/prisma/client";
import type { Difficulty, Letter, VideoProvider } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { QUESTOES_POR_PAGINA, type Filtros } from "@/lib/questoes/filtros";

export type Alternativa = { letra: Letter; texto: string };

export type Resolucao = {
  gabarito: Letter;
  comentario: string;
  video: { id: string; provider: VideoProvider } | null;
};

export type MinhaResposta = { letra: Letter; acertei: boolean };

export type QuestaoLista = {
  id: string;
  codigo: number;
  enunciado: string;
  alternativas: Alternativa[];
  materia: string;
  assunto: string | null;
  subassunto: string | null;
  banca: string | null;
  ano: number | null;
  origem: string | null;
  dificuldade: Difficulty | null;
  favorita: boolean;
  anotacao: string | null;
  /** Última resposta do aluno, se já respondeu. */
  minhaResposta: MinhaResposta | null;
  /** Presente somente quando `minhaResposta` também está. */
  resolucao: Resolucao | null;
};

/**
 * Semântica dos filtros de situação.
 *
 * `Answer` guarda **todas** as tentativas (sem unique), então "acertada" é
 * ambíguo para quem errou e depois acertou. A leitura adotada é a útil para
 * quem estuda: acertada = acertou em alguma tentativa; errada = já respondeu e
 * ainda não acertou. Assim "erradas" é a lista do que falta dominar, e nenhuma
 * questão aparece nas duas.
 */
function aplicarSituacao(
  where: Prisma.QuestionWhereInput,
  situacao: Filtros["situacao"],
  userId: string,
): void {
  switch (situacao) {
    case "nao-respondidas":
      where.answers = { none: { userId } };
      break;
    case "respondidas":
      where.answers = { some: { userId } };
      break;
    case "acertadas":
      where.answers = { some: { userId, isCorrect: true } };
      break;
    case "erradas":
      where.AND = [
        { answers: { some: { userId } } },
        { answers: { none: { userId, isCorrect: true } } },
      ];
      break;
    case "todas":
      break;
  }
}

export function montarWhere(
  filtros: Filtros,
  userId: string,
): Prisma.QuestionWhereInput {
  const where: Prisma.QuestionWhereInput = { status: "PUBLISHED" };

  if (filtros.materia) where.subjectId = filtros.materia;
  if (filtros.assunto) where.topicId = filtros.assunto;
  if (filtros.subassunto) where.subtopicId = filtros.subassunto;
  if (filtros.banca) where.boardId = filtros.banca;
  if (filtros.ano) where.year = filtros.ano;
  if (filtros.favoritas) where.favorites = { some: { userId } };

  if (filtros.q) {
    const alternativas: Prisma.QuestionWhereInput[] = [
      { statement: { contains: filtros.q, mode: "insensitive" } },
      { source: { contains: filtros.q, mode: "insensitive" } },
    ];

    // "Questão 1234" é como o aluno identifica a questão; buscar pelo número
    // precisa funcionar.
    const codigo = Number(filtros.q);
    if (Number.isInteger(codigo) && codigo > 0) {
      alternativas.unshift({ code: codigo });
    }

    where.OR = alternativas;
  }

  aplicarSituacao(where, filtros.situacao, userId);

  return where;
}

/**
 * Resolução das questões informadas. Chamada só para questões que o aluno já
 * respondeu — nunca para a lista inteira.
 */
export async function carregarResolucoes(
  questionIds: string[],
): Promise<Map<string, Resolucao>> {
  if (questionIds.length === 0) return new Map();

  const questoes = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      answerKey: true,
      explanation: true,
      videoId: true,
      videoProvider: true,
    },
  });

  return new Map(
    questoes.map((q) => [
      q.id,
      {
        gabarito: q.answerKey,
        comentario: q.explanation,
        video:
          q.videoId && q.videoProvider
            ? { id: q.videoId, provider: q.videoProvider }
            : null,
      },
    ]),
  );
}

export type PaginaDeQuestoes = {
  questoes: QuestaoLista[];
  total: number;
  pagina: number;
  paginas: number;
};

export async function buscarQuestoes(
  filtros: Filtros,
  userId: string,
): Promise<PaginaDeQuestoes> {
  const where = montarWhere(filtros, userId);

  const [total, registros] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      // Ordem pelo código: é o número que o aluno vê ("Questão 1234"), é
      // estável entre páginas e não depende de campo opcional.
      orderBy: { code: "asc" },
      skip: (filtros.pagina - 1) * QUESTOES_POR_PAGINA,
      take: QUESTOES_POR_PAGINA,
      select: {
        id: true,
        code: true,
        statement: true,
        year: true,
        source: true,
        difficulty: true,
        subject: { select: { name: true } },
        topic: { select: { name: true } },
        subtopic: { select: { name: true } },
        board: { select: { name: true } },
        alternatives: {
          orderBy: { letter: "asc" },
          select: { letter: true, text: true },
        },
        favorites: { where: { userId }, select: { userId: true } },
        notes: { where: { userId }, select: { content: true } },
        answers: {
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { letter: true, isCorrect: true },
        },
      },
    }),
  ]);

  const resolucoes = await carregarResolucoes(
    registros.filter((q) => q.answers.length > 0).map((q) => q.id),
  );

  const questoes = registros.map<QuestaoLista>((q) => {
    const ultima = q.answers[0];

    return {
      id: q.id,
      codigo: q.code,
      enunciado: q.statement,
      alternativas: q.alternatives.map((a) => ({
        letra: a.letter,
        texto: a.text,
      })),
      materia: q.subject.name,
      assunto: q.topic?.name ?? null,
      subassunto: q.subtopic?.name ?? null,
      banca: q.board?.name ?? null,
      ano: q.year,
      origem: q.source,
      dificuldade: q.difficulty,
      favorita: q.favorites.length > 0,
      anotacao: q.notes[0]?.content ?? null,
      minhaResposta: ultima
        ? { letra: ultima.letter, acertei: ultima.isCorrect }
        : null,
      resolucao: ultima ? (resolucoes.get(q.id) ?? null) : null,
    };
  });

  return {
    questoes,
    total,
    pagina: filtros.pagina,
    paginas: Math.max(1, Math.ceil(total / QUESTOES_POR_PAGINA)),
  };
}

// ---------------------------------------------------------------------------
// Taxonomia para a barra de filtros
// ---------------------------------------------------------------------------

export type Taxonomia = {
  materias: {
    id: string;
    nome: string;
    assuntos: {
      id: string;
      nome: string;
      subassuntos: { id: string; nome: string }[];
    }[];
  }[];
  bancas: { id: string; nome: string }[];
  anos: number[];
};

/**
 * Árvore inteira da taxonomia, enviada ao cliente para encadear os selects
 * matéria → assunto → subassunto sem uma ida ao servidor a cada troca. São
 * dezenas de itens, não milhares: buscar sob demanda seria complicar à toa.
 */
export async function carregarTaxonomia(): Promise<Taxonomia> {
  const [materias, bancas, anos] = await Promise.all([
    prisma.subject.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        topics: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            subtopics: {
              where: { active: true },
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
              select: { id: true, name: true },
            },
          },
        },
      },
    }),
    prisma.board.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.question.findMany({
      where: { status: "PUBLISHED", year: { not: null } },
      distinct: ["year"],
      orderBy: { year: "desc" },
      select: { year: true },
    }),
  ]);

  return {
    materias: materias.map((m) => ({
      id: m.id,
      nome: m.name,
      assuntos: m.topics.map((t) => ({
        id: t.id,
        nome: t.name,
        subassuntos: t.subtopics.map((s) => ({ id: s.id, nome: s.name })),
      })),
    })),
    bancas: bancas.map((b) => ({ id: b.id, nome: b.name })),
    anos: anos.flatMap((a) => (a.year === null ? [] : [a.year])),
  };
}
