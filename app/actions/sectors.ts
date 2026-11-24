// app/actions/sectors.ts

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getDefaultStoreId() {
  const store = await prisma.store.findFirst();
  if (!store) throw new Error("Nenhuma loja encontrada na base de dados.");
  return store.id;
}

export async function getSectors() {
  try {
    const storeId = await getDefaultStoreId();
    return await prisma.sector.findMany({
      where: { storeId },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Erro ao procurar setores:", error);
    return [];
  }
}

export async function createSector(data: { code: string; name: string }) {
  try {
    const storeId = await getDefaultStoreId();
    const sector = await prisma.sector.create({
      data: { code: data.code, name: data.name, storeId },
    });
    revalidatePath("/admin");
    return { success: true, sector };
  } catch (error) {
    console.error("Erro ao criar setor:", error);
    return {
      success: false,
      error: "Não foi possível criar. Verifique se o código já existe.",
    };
  }
}

export async function updateSector(
  id: string,
  data: { code: string; name: string },
) {
  try {
    const sector = await prisma.sector.update({
      where: { id },
      data: { code: data.code, name: data.name },
    });
    revalidatePath("/admin");
    return { success: true, sector };
  } catch (error) {
    console.error("Erro ao atualizar setor:", error);
    return { success: false, error: "Não foi possível atualizar o setor." };
  }
}

export async function deleteSector(id: string) {
  try {
    await prisma.sector.delete({
      where: { id },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Erro ao eliminar setor:", error);
    return { success: false, error: "Não foi possível eliminar o setor." };
  }
}

export async function getErpSettings() {
  try {
    const store = await prisma.store.findFirst({
      select: { id: true, defaultOriginCode: true },
    });
    if (!store) throw new Error("Loja não encontrada.");

    const sectors = await prisma.sector.findMany({
      where: { storeId: store.id },
      select: {
        id: true,
        code: true,
        name: true,
        erpOriginCode: true,
        erpDestCode: true,
      },
      orderBy: { name: "asc" },
    });

    return {
      defaultOriginCode: store.defaultOriginCode || "17",
      sectors,
    };
  } catch (error) {
    console.error("Erro ao carregar configurações de ERP:", error);
    return {
      defaultOriginCode: "17",
      sectors: [],
    };
  }
}

export async function updateDefaultOriginCode(defaultOriginCode: string) {
  try {
    const storeId = await getDefaultStoreId();
    await prisma.store.update({
      where: { id: storeId },
      data: { defaultOriginCode: defaultOriginCode.trim() || "17" },
    });
    revalidatePath("/admin");
    revalidatePath("/historico");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar almoxarifado de origem padrão:", error);
    return { success: false, error: "Não foi possível salvar o código padrão." };
  }
}

export async function updateSectorErpCodes(
  sectorId: string,
  data: { erpOriginCode?: string | null; erpDestCode?: string | null },
) {
  try {
    const updated = await prisma.sector.update({
      where: { id: sectorId },
      data: {
        erpOriginCode: data.erpOriginCode ? data.erpOriginCode.trim() : null,
        erpDestCode: data.erpDestCode ? data.erpDestCode.trim() : null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/historico");
    return { success: true, sector: updated };
  } catch (error) {
    console.error("Erro ao atualizar códigos ERP do setor:", error);
    return { success: false, error: "Não foi possível atualizar o setor." };
  }
}

export async function updateMultipleSectorErpCodes(
  updates: { id: string; erpOriginCode?: string | null; erpDestCode?: string | null }[],
) {
  try {
    await prisma.$transaction(
      updates.map((item) =>
        prisma.sector.update({
          where: { id: item.id },
          data: {
            erpOriginCode: item.erpOriginCode ? item.erpOriginCode.trim() : null,
            erpDestCode: item.erpDestCode ? item.erpDestCode.trim() : null,
          },
        }),
      ),
    );
    revalidatePath("/admin");
    revalidatePath("/historico");
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar múltiplos códigos ERP:", error);
    return { success: false, error: "Erro ao salvar alterações dos setores." };
  }
}
