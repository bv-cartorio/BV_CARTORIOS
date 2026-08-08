"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ReportStatus } from "@/generated/prisma/enums";
import { exigirPapel } from "@/lib/auth/guardas";
import { prisma } from "@/lib/prisma";

const CAMINHO = "/admin/reportes";

const schema = z.object({
  id: z.string().trim().min(1),
  situacao: z.enum(ReportStatus),
  nota: z.string().trim().max(1000).optional(),
});

/**
 * Move o reporte na fila.
 *
 * `RESOLVED` e `REJECTED` são desfechos: registram quem decidiu e quando, para
 * que a revisão editorial tenha rastro. `IN_REVIEW` é só sinalização de que
 * alguém pegou o caso, então não carimba autor.
 */
export async function decidirReporte(
  _anterior: { erro?: string },
  dados: FormData,
): Promise<{ erro?: string }> {
  const usuario = await exigirPapel(["ADMIN"], CAMINHO);

  const entrada = schema.safeParse({
    id: dados.get("id"),
    situacao: dados.get("situacao"),
    nota: dados.get("nota") || undefined,
  });

  if (!entrada.success) return { erro: "Dados inválidos." };

  const { id, situacao, nota } = entrada.data;
  const desfecho = situacao === "RESOLVED" || situacao === "REJECTED";

  await prisma.questionReport.update({
    where: { id },
    data: {
      status: situacao,
      resolutionNote: nota ?? null,
      resolvedById: desfecho ? usuario.id : null,
      resolvedAt: desfecho ? new Date() : null,
    },
  });

  revalidatePath(CAMINHO);
  revalidatePath("/admin");
  return {};
}
