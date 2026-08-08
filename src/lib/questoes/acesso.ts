/**
 * Quanto do acervo um aluno pode responder.
 *
 * Regra combinada com a contratante: quem não tem assinatura vigente responde
 * um número fixo de questões por dia; quem assina não tem limite. Navegar,
 * filtrar e buscar são livres para todo mundo — o limite incide sobre o ato de
 * responder, que é o que revela gabarito e comentário.
 */
import { temAssinaturaVigente } from "@/lib/auth/guardas";
import { prisma } from "@/lib/prisma";
import { COTA_DIARIA_GRATUITA } from "@/lib/questoes/cota";

const FUSO = "America/Sao_Paulo";

const relogioLocal = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * Instante da última meia-noite **no horário de Brasília**.
 *
 * O servidor roda em UTC; contar "por dia" pelo relógio dele viraria a cota às
 * 21h no Brasil. Em vez de fixar o deslocamento (que quebraria se o horário de
 * verão voltasse), pergunta ao `Intl` que horas são no fuso e subtrai isso.
 */
export function inicioDoDia(agora: Date = new Date()): Date {
  const partes = relogioLocal.formatToParts(agora);
  const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? 0);

  const decorrido =
    parte("hour") * 3_600_000 +
    parte("minute") * 60_000 +
    parte("second") * 1_000 +
    agora.getMilliseconds();

  return new Date(agora.getTime() - decorrido);
}

export type Acesso = {
  assinante: boolean;
  /** Questões distintas já respondidas hoje. Zero para assinante — não conta. */
  usadasHoje: number;
  /** Quantas ainda cabem hoje; `null` quando não há limite. */
  restantes: number | null;
  /** Ainda pode responder uma questão inédita hoje. */
  liberado: boolean;
};

const ILIMITADO: Acesso = {
  assinante: true,
  usadasHoje: 0,
  restantes: null,
  liberado: true,
};

/** Questões **distintas** respondidas hoje. Refazer a mesma não gasta cota. */
async function respondidasHoje(userId: string): Promise<number> {
  const respostas = await prisma.answer.findMany({
    where: { userId, createdAt: { gte: inicioDoDia() } },
    distinct: ["questionId"],
    select: { questionId: true },
  });

  return respostas.length;
}

export async function situacaoDeAcesso(userId: string): Promise<Acesso> {
  if (await temAssinaturaVigente(userId)) return ILIMITADO;

  const usadasHoje = await respondidasHoje(userId);
  const restantes = Math.max(0, COTA_DIARIA_GRATUITA - usadasHoje);

  return { assinante: false, usadasHoje, restantes, liberado: restantes > 0 };
}

/**
 * Se o aluno pode responder **esta** questão agora.
 *
 * Uma questão que já contou hoje continua liberada mesmo com a cota estourada:
 * o limite é de questões novas por dia, não de cliques. Sem isso, quem chegasse
 * ao limite perderia o acesso ao comentário das que acabou de responder.
 */
export async function podeResponder(
  userId: string,
  questionId: string,
): Promise<Acesso> {
  const acesso = await situacaoDeAcesso(userId);

  if (acesso.liberado || acesso.assinante) return acesso;

  const jaContou = await prisma.answer.findFirst({
    where: { userId, questionId, createdAt: { gte: inicioDoDia() } },
    select: { id: true },
  });

  return jaContou ? { ...acesso, liberado: true } : acesso;
}
