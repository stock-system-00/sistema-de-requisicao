// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Singleton via globalThis: em dev o HMR do Next recarrega este módulo a cada
// mudança, e sem isso cada reload abriria uma nova conexão com o banco até
// estourar o limite de conexões. Em produção não há HMR, então não afeta.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
