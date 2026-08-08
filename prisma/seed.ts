/**
 * Seed de desenvolvimento — idempotente e reexecutável.
 *
 *   npm run db:seed
 *
 * Cria a taxonomia base, as bancas, os planos comerciais vigentes, um usuário
 * administrador e algumas questões de exemplo para desenvolver a interface.
 * NÃO tem relação com a migração do sistema legado (ver docs/MIGRACAO.md).
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import { Letter, QuestionStatus, Difficulty } from "../src/generated/prisma/enums";
import { slugify } from "../src/lib/slug";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada (veja .env.example)");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@bvcartorio.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "bvcartorios123";

const BANCAS = [
  "ENAC",
  "FGV",
  "Cebraspe",
  "VUNESP",
  "IBFC",
  "IESES",
  "Consulplan",
];

const PLANOS = [
  {
    slug: "mensal",
    name: "Mensal",
    description: "Acesso completo por 1 mês, com questões ilimitadas.",
    priceCents: 9990,
    durationMonths: 1,
    sortOrder: 1,
  },
  {
    slug: "trimestral",
    name: "Trimestral",
    description: "Acesso completo por 3 meses, com questões ilimitadas.",
    priceCents: 23990,
    durationMonths: 3,
    sortOrder: 2,
  },
  {
    slug: "quadrimestral",
    name: "Quadrimestral",
    description: "Acesso completo por 4 meses, com questões ilimitadas.",
    priceCents: 37990,
    durationMonths: 4,
    sortOrder: 3,
  },
];

/** Taxonomia inicial: matéria → assunto → subassunto. */
const TAXONOMIA: Array<{
  materia: string;
  assuntos: Array<{ nome: string; subassuntos?: string[] }>;
}> = [
  {
    materia: "Direito Notarial e Registral",
    assuntos: [
      {
        nome: "Princípios e organização dos serviços",
        subassuntos: [
          "Natureza jurídica da delegação",
          "Princípios registrais",
          "Responsabilidade civil e disciplinar",
        ],
      },
      { nome: "Lei 8.935/1994", subassuntos: ["Atribuições", "Ingresso na atividade"] },
      { nome: "Emolumentos e Lei 10.169/2000" },
    ],
  },
  {
    materia: "Registros Públicos",
    assuntos: [
      {
        nome: "Registro Civil das Pessoas Naturais",
        subassuntos: ["Nascimento", "Casamento", "Óbito", "Averbações e retificações"],
      },
      {
        nome: "Registro de Imóveis",
        subassuntos: [
          "Matrícula e princípios",
          "Usucapião extrajudicial",
          "Georreferenciamento",
        ],
      },
      { nome: "Registro de Títulos e Documentos" },
      { nome: "Registro Civil das Pessoas Jurídicas" },
    ],
  },
  {
    materia: "Direito Civil",
    assuntos: [
      { nome: "Parte Geral", subassuntos: ["Pessoas", "Negócio jurídico", "Prescrição"] },
      { nome: "Direito das Coisas", subassuntos: ["Propriedade", "Direitos reais de garantia"] },
      { nome: "Direito de Família" },
      { nome: "Direito das Sucessões", subassuntos: ["Inventário e partilha extrajudicial"] },
    ],
  },
  {
    materia: "Direito Constitucional",
    assuntos: [
      { nome: "Direitos e garantias fundamentais" },
      { nome: "Organização do Estado" },
      { nome: "Poder Judiciário e funções essenciais à Justiça" },
    ],
  },
  {
    materia: "Direito Administrativo",
    assuntos: [
      { nome: "Atos administrativos" },
      { nome: "Serviços públicos e delegação" },
      { nome: "Improbidade administrativa" },
    ],
  },
  {
    materia: "Direito Tributário",
    assuntos: [{ nome: "ITBI e ITCMD" }, { nome: "Obrigação tributária" }],
  },
  {
    materia: "Direito Empresarial",
    assuntos: [{ nome: "Sociedades" }, { nome: "Títulos de crédito e protesto" }],
  },
  {
    materia: "Direito Processual Civil",
    assuntos: [{ nome: "Procedimentos especiais" }, { nome: "Execução" }],
  },
];

/** Questões de exemplo para desenvolver a interface do aluno. */
const QUESTOES = [
  {
    materia: "Direito Civil",
    assunto: "Parte Geral",
    banca: "ENAC",
    ano: 2024,
    origem: "Inédita — Prof. César Bravo",
    dificuldade: Difficulty.MEDIUM,
    statement:
      "<p>Nos termos do Código Civil, a escritura pública é essencial à validade dos negócios jurídicos que visem à constituição, transferência, modificação ou renúncia de direitos reais sobre imóveis de valor superior a determinado patamar legal. Esse patamar corresponde a:</p>",
    alternativas: {
      A: "dez vezes o maior salário mínimo vigente no País.",
      B: "vinte vezes o maior salário mínimo vigente no País.",
      C: "trinta vezes o maior salário mínimo vigente no País.",
      D: "cinquenta vezes o maior salário mínimo vigente no País.",
      E: "cem vezes o maior salário mínimo vigente no País.",
    },
    gabarito: Letter.C,
    comentario: `
      <p><strong>Gabarito: alternativa C.</strong></p>
      <p>O art. 108 do Código Civil dispõe que, <em>não dispondo a lei em contrário, a escritura pública é essencial à validade dos negócios jurídicos que visem à constituição, transferência, modificação ou renúncia de direitos reais sobre imóveis de valor superior a trinta vezes o maior salário mínimo vigente no País</em>.</p>
      <h3>Análise das alternativas</h3>
      <ul>
        <li><strong>A, B, D e E</strong> — incorretas: apresentam múltiplos diversos do previsto no art. 108. O erro é de literalidade, cobrado com frequência em provas de primeira fase.</li>
        <li><strong>C</strong> — correta: reproduz o patamar legal de trinta salários mínimos.</li>
      </ul>
      <h3>Pontos de atenção</h3>
      <p>Dois detalhes costumam ser explorados pelas bancas:</p>
      <ol>
        <li>a ressalva inicial do dispositivo (<em>"não dispondo a lei em contrário"</em>), que admite exceções legais — como a alienação fiduciária de bem imóvel, formalizável por instrumento particular com efeitos de escritura pública (art. 38 da Lei 9.514/1997);</li>
        <li>o parâmetro é o <strong>valor do imóvel</strong>, e não o valor do negócio, conforme entendimento consolidado na doutrina registral.</li>
      </ol>
    `,
  },
  {
    materia: "Registros Públicos",
    assunto: "Registro Civil das Pessoas Naturais",
    subassunto: "Nascimento",
    banca: "FGV",
    ano: 2023,
    origem: "Inédita — Prof. César Bravo",
    dificuldade: Difficulty.EASY,
    statement:
      "<p>De acordo com a Lei de Registros Públicos (Lei 6.015/1973), o prazo geral para que o nascimento seja registrado, contado do parto, é de:</p>",
    alternativas: {
      A: "5 (cinco) dias.",
      B: "15 (quinze) dias.",
      C: "30 (trinta) dias.",
      D: "45 (quarenta e cinco) dias.",
      E: "60 (sessenta) dias.",
    },
    gabarito: Letter.B,
    comentario: `
      <p><strong>Gabarito: alternativa B.</strong></p>
      <p>O art. 50 da Lei 6.015/1973 fixa o prazo de <strong>15 dias</strong> para que se faça o registro do nascimento, no lugar em que tiver ocorrido o parto ou no lugar da residência dos pais.</p>
      <h3>Ampliações do prazo</h3>
      <ul>
        <li>o prazo é ampliado <strong>em até três meses</strong> para os lugares distantes mais de trinta quilômetros da sede do cartório;</li>
        <li>quando o declarante for a mãe, o prazo é de <strong>45 dias</strong> (art. 50, § 1º).</li>
      </ul>
      <h3>Análise das alternativas</h3>
      <p>As alternativas <strong>A, C, D e E</strong> apresentam prazos que não correspondem à regra geral do art. 50. A alternativa <strong>D</strong> é a mais capciosa: 45 dias é prazo real da lei, mas aplicável apenas à declaração feita pela mãe, e não como regra geral.</p>
      <p>Registre-se que o registro fora do prazo continua sendo possível, sem necessidade de autorização judicial, na forma do art. 46 da LRP, com a redação dada pela Lei 11.790/2008.</p>
    `,
  },
  {
    materia: "Registros Públicos",
    assunto: "Registro de Imóveis",
    subassunto: "Matrícula e princípios",
    banca: "ENAC",
    ano: 2024,
    origem: "Inédita — Prof. César Bravo",
    dificuldade: Difficulty.HARD,
    statement:
      "<p>O oficial de registro de imóveis recebe título de compra e venda em que o vendedor não figura como titular do domínio na matrícula do imóvel. Ao recusar o registro, o oficial aplica diretamente o princípio da:</p>",
    alternativas: {
      A: "publicidade.",
      B: "continuidade.",
      C: "especialidade objetiva.",
      D: "concentração.",
      E: "instância.",
    },
    gabarito: Letter.B,
    comentario: `
      <p><strong>Gabarito: alternativa B.</strong></p>
      <p>O princípio da <strong>continuidade</strong> exige encadeamento subjetivo perfeito entre os assentos registrais: o transmitente do título apresentado deve ser exatamente aquele que consta da matrícula como titular do direito. É o que impõem os arts. 195 e 237 da Lei 6.015/1973.</p>
      <h3>Análise das alternativas</h3>
      <ul>
        <li><strong>A — publicidade:</strong> refere-se à oponibilidade <em>erga omnes</em> e ao acesso de terceiros ao conteúdo do registro; não trata do encadeamento das titularidades.</li>
        <li><strong>B — continuidade:</strong> correta, pelos fundamentos acima.</li>
        <li><strong>C — especialidade objetiva:</strong> diz respeito à perfeita identificação e descrição do <em>imóvel</em>; a falha narrada é de titularidade, não de descrição.</li>
        <li><strong>D — concentração:</strong> impõe que todos os fatos juridicamente relevantes ao imóvel constem da matrícula (art. 54 da Lei 13.097/2015). É consequência do sistema, mas não o fundamento da recusa.</li>
        <li><strong>E — instância:</strong> ou rogação, significa que o registrador só age mediante provocação do interessado.</li>
      </ul>
      <h3>Encaminhamento correto</h3>
      <p>A recusa deve ser formalizada em <strong>nota devolutiva</strong> fundamentada, cabendo ao apresentante suscitar dúvida (art. 198 da LRP) caso discorde da qualificação negativa.</p>
    `,
  },
];

async function main() {
  console.log("Semeando banco de desenvolvimento...");

  // Bancas -------------------------------------------------------------------
  for (const nome of BANCAS) {
    await prisma.board.upsert({
      where: { slug: slugify(nome) },
      update: { name: nome },
      create: { name: nome, slug: slugify(nome) },
    });
  }
  console.log(`  ${BANCAS.length} bancas`);

  // Planos -------------------------------------------------------------------
  for (const plano of PLANOS) {
    await prisma.plan.upsert({
      where: { slug: plano.slug },
      update: plano,
      create: plano,
    });
  }
  console.log(`  ${PLANOS.length} planos`);

  // Taxonomia ----------------------------------------------------------------
  let totalAssuntos = 0;
  let totalSubassuntos = 0;

  for (const [indiceMateria, item] of TAXONOMIA.entries()) {
    const materia = await prisma.subject.upsert({
      where: { slug: slugify(item.materia) },
      update: { name: item.materia, sortOrder: indiceMateria },
      create: {
        name: item.materia,
        slug: slugify(item.materia),
        sortOrder: indiceMateria,
      },
    });

    for (const [indiceAssunto, assunto] of item.assuntos.entries()) {
      const topico = await prisma.topic.upsert({
        where: {
          subjectId_slug: { subjectId: materia.id, slug: slugify(assunto.nome) },
        },
        update: { name: assunto.nome, sortOrder: indiceAssunto },
        create: {
          subjectId: materia.id,
          name: assunto.nome,
          slug: slugify(assunto.nome),
          sortOrder: indiceAssunto,
        },
      });
      totalAssuntos++;

      for (const [indiceSub, sub] of (assunto.subassuntos ?? []).entries()) {
        await prisma.subtopic.upsert({
          where: { topicId_slug: { topicId: topico.id, slug: slugify(sub) } },
          update: { name: sub, sortOrder: indiceSub },
          create: {
            topicId: topico.id,
            name: sub,
            slug: slugify(sub),
            sortOrder: indiceSub,
          },
        });
        totalSubassuntos++;
      }
    }
  }
  console.log(
    `  ${TAXONOMIA.length} matérias, ${totalAssuntos} assuntos, ${totalSubassuntos} subassuntos`,
  );

  // Administrador ------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN" },
    create: {
      email: ADMIN_EMAIL,
      name: "Administrador BV",
      password: await hash(ADMIN_PASSWORD, 12),
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`  admin: ${ADMIN_EMAIL}`);

  // Questões de exemplo ------------------------------------------------------
  for (const questao of QUESTOES) {
    const materia = await prisma.subject.findUniqueOrThrow({
      where: { slug: slugify(questao.materia) },
    });
    const topico = await prisma.topic.findUniqueOrThrow({
      where: {
        subjectId_slug: { subjectId: materia.id, slug: slugify(questao.assunto) },
      },
    });
    const subtopico = questao.subassunto
      ? await prisma.subtopic.findUniqueOrThrow({
          where: {
            topicId_slug: { topicId: topico.id, slug: slugify(questao.subassunto) },
          },
        })
      : null;
    const banca = await prisma.board.findUniqueOrThrow({
      where: { slug: slugify(questao.banca) },
    });

    // O enunciado identifica a questão de exemplo de forma estável entre execuções.
    const existente = await prisma.question.findFirst({
      where: { statement: questao.statement },
      select: { id: true },
    });

    const dados = {
      statement: questao.statement,
      explanation: questao.comentario.trim(),
      answerKey: questao.gabarito,
      subjectId: materia.id,
      topicId: topico.id,
      subtopicId: subtopico?.id ?? null,
      boardId: banca.id,
      year: questao.ano,
      source: questao.origem,
      difficulty: questao.dificuldade,
      status: QuestionStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: admin.id,
    };

    const registro = existente
      ? await prisma.question.update({ where: { id: existente.id }, data: dados })
      : await prisma.question.create({ data: dados });

    for (const [letra, texto] of Object.entries(questao.alternativas)) {
      await prisma.alternative.upsert({
        where: {
          questionId_letter: {
            questionId: registro.id,
            letter: letra as Letter,
          },
        },
        update: { text: texto },
        create: {
          questionId: registro.id,
          letter: letra as Letter,
          text: texto,
        },
      });
    }
  }
  console.log(`  ${QUESTOES.length} questões de exemplo`);

  console.log("Seed concluído.");
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
