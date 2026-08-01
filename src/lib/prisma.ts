import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Instância única do Prisma Client.
 *
 * Em desenvolvimento o hot reload do Next recria os módulos a cada alteração;
 * guardar a instância no `globalThis` evita esgotar o pool de conexões.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function criarCliente() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada (veja .env.example)");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
