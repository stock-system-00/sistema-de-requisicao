// app/actions/auth.ts
"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function loginComSenha(senhaDigitada: string) {
  try {
    const user = await prisma.user.findFirst();

    if (!user) {
      return {
        sucesso: false,
        erro: "Nenhum usuário encontrado no banco de dados.",
      };
    }

    const senhaCorreta = await bcrypt.compare(senhaDigitada, user.password);

    if (senhaCorreta) {
      const cookieStore = await cookies();
      cookieStore.set("session_token", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return { sucesso: true };
    } else {
      return { sucesso: false, erro: "Senha incorreta. Tente novamente." };
    }
  } catch (error) {
    console.error("Erro ao conectar no banco:", error);
    return { sucesso: false, erro: "Erro interno no servidor." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
}

export async function getUsuarioAtual() {
  try {
    const user = await prisma.user.findFirst();

    if (!user) return null;

    return {
      name: user.name,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
}

// ── Função para calcular o uso real do banco de dados em Megabytes ──
export async function getDbStorageUsage() {
  try {
    // Soma o tamanho de TODOS os bancos do branch (recomendação oficial do Neon)
    const result = await prisma.$queryRaw<{ size: bigint }[]>`
      SELECT sum(pg_database_size(datname)) as size
      FROM pg_database;
    `;

    const sizeInBytes = Number(result[0]?.size || 0);
    const sizeInMb = sizeInBytes / (1024 * 1024);
    const limitMb = 512; // Limite do plano gratuito Neon (0.5 GB)
    const percentage = Math.min(Math.round((sizeInMb / limitMb) * 100), 100);

    return {
      usedMb: Number(sizeInMb.toFixed(2)),
      limitMb,
      percentage,
    };
  } catch (error) {
    console.error("Erro ao calcular o armazenamento do banco:", error);
    return {
      usedMb: 0,
      limitMb: 512,
      percentage: 0,
    };
  }
}
