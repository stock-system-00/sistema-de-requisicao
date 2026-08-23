// app/actions/requisitions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getDefaultStoreId() {
  const store = await prisma.store.findFirst();
  if (!store) throw new Error("Nenhuma loja encontrada na base de dados.");
  return store.id;
}

export async function createRequisition(
  sectorId: string,
  items: { itemId: string; quantity: number }[],
  customDateStr?: string,
) {
  try {
    const storeId = await getDefaultStoreId();

    let targetDate = new Date();
    if (customDateStr) {
      const [year, month, day] = customDateStr.split("-");
      targetDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        12,
        0,
        0,
      );
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRequisition = await prisma.requisition.findFirst({
      where: {
        storeId,
        sectorId,
        status: "ABERTA",
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: true,
      },
    });

    if (existingRequisition) {
      // Cria um array de operações para a Transação
      const operations = [];

      for (const incomingItem of items) {
        const existingDbItem = existingRequisition.items.find(
          (i) => i.itemId === incomingItem.itemId,
        );

        if (existingDbItem) {
          // Prepara a atualização e guarda na caixa
          operations.push(
            prisma.requisitionItem.update({
              where: { id: existingDbItem.id },
              data: {
                quantity: existingDbItem.quantity + incomingItem.quantity,
              },
            }),
          );
        } else {
          // Prepara a criação e guarda na caixa
          operations.push(
            prisma.requisitionItem.create({
              data: {
                requisitionId: existingRequisition.id,
                itemId: incomingItem.itemId,
                quantity: incomingItem.quantity,
              },
            }),
          );
        }
      }

      // Guarda a atualização da requisição principal na mesma caixa
      operations.push(
        prisma.requisition.update({
          where: { id: existingRequisition.id },
          data: {
            updatedAt: new Date(),
          },
        }),
      );

      await prisma.$transaction(operations);

      revalidatePath("/historico");
      return { success: true, requisition: existingRequisition };
    } else {
      const requisition = await prisma.requisition.create({
        data: {
          storeId,
          sectorId,
          status: "ABERTA",
          createdAt: targetDate,
          items: {
            create: items.map((it) => ({
              itemId: it.itemId,
              quantity: it.quantity,
            })),
          },
        },
      });

      revalidatePath("/historico");
      return { success: true, requisition };
    }
  } catch (error) {
    console.error("Erro ao criar/atualizar requisição:", error);
    return { success: false, error: "Não foi possível salvar a requisição." };
  }
}

export async function getRequisitions() {
  try {
    const storeId = await getDefaultStoreId();

    const reqs = await prisma.requisition.findMany({
      where: { storeId },
      include: {
        sector: {
          select: { id: true, name: true, code: true },
        },
        items: {
          include: {
            item: {
              select: { id: true, name: true, code: true, unit: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return reqs;
  } catch (error) {
    console.error("Erro ao buscar requisições:", error);
    return [];
  }
}

export async function updateRequisitionStatus(
  requisitionId: string,
  status: string,
) {
  try {
    const updated = await prisma.requisition.update({
      where: { id: requisitionId },
      data: { status },
    });

    revalidatePath("/historico");
    return { success: true, requisition: updated };
  } catch (error) {
    console.error("Erro ao atualizar status da requisição:", error);
    return { success: false, error: "Falha ao atualizar o status." };
  }
}

export async function deleteRequisition(requisitionId: string) {
  try {
    // O Prisma deleta os itens automaticamente por causa do onDelete: Cascade
    await prisma.requisition.delete({
      where: { id: requisitionId },
    });

    revalidatePath("/historico");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir requisição:", error);
    return { success: false, error: "Falha ao excluir a requisição inteira." };
  }
}

export async function deleteRequisitionItem(itemId: string) {
  try {
    await prisma.requisitionItem.delete({
      where: { id: itemId },
    });

    revalidatePath("/historico");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir item da requisição:", error);
    return { success: false, error: "Falha ao excluir o item." };
  }
}

export async function updateRequisitionDate(
  requisitionId: string,
  newDate: Date,
) {
  try {
    const updated = await prisma.requisition.update({
      where: { id: requisitionId },
      data: { createdAt: newDate },
    });

    revalidatePath("/historico");
    return { success: true, requisition: updated };
  } catch (error) {
    console.error("Erro ao atualizar data da requisição:", error);
    return { success: false, error: "Falha ao atualizar a data." };
  }
}

export async function updateRequisitionItemQuantity(
  itemId: string,
  newQuantity: number,
) {
  try {
    await prisma.requisitionItem.update({
      where: { id: itemId },
      data: { quantity: newQuantity },
    });

    revalidatePath("/historico");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar quantidade do item:", error);
    return {
      success: false,
      error: "Falha ao atualizar a quantidade do insumo.",
    };
  }
}
