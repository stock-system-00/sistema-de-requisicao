import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const stores = await prisma.store.findMany();
    const users = await prisma.user.findMany();
    const sectors = await prisma.sector.findMany();
    const items = await prisma.item.findMany();
    const requisitions = await prisma.requisition.findMany();
    const requisitionItems = await prisma.requisitionItem.findMany();

    const backupData = {
      stores,
      users,
      sectors,
      items,
      requisitions,
      requisitionItems,
      timestamp: new Date().toISOString(),
    };

    return new NextResponse(JSON.stringify(backupData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup_sistema.json"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar backup:", error);
    return NextResponse.json({ error: "Erro ao gerar backup" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const backupData = await request.json();
    
    // Verificação simples se o arquivo parece ser o backup correto
    if (!backupData.stores || !backupData.users || !backupData.sectors) {
      return NextResponse.json({ error: "Arquivo de backup inválido" }, { status: 400 });
    }

    // Executar a restauração dentro de uma transação garantindo a integridade
    await prisma.$transaction(async (tx) => {
      // 1. Limpar banco de dados na ordem inversa das dependências
      await tx.requisitionItem.deleteMany();
      await tx.requisition.deleteMany();
      await tx.item.deleteMany();
      await tx.sector.deleteMany();
      await tx.user.deleteMany();
      await tx.store.deleteMany();

      // 2. Inserir dados na ordem das dependências
      if (backupData.stores.length > 0) {
        await tx.store.createMany({ data: backupData.stores });
      }
      if (backupData.users.length > 0) {
        await tx.user.createMany({ data: backupData.users });
      }
      if (backupData.sectors.length > 0) {
        await tx.sector.createMany({ data: backupData.sectors });
      }
      if (backupData.items.length > 0) {
        await tx.item.createMany({ data: backupData.items });
      }
      if (backupData.requisitions.length > 0) {
        await tx.requisition.createMany({ data: backupData.requisitions });
      }
      if (backupData.requisitionItems.length > 0) {
        await tx.requisitionItem.createMany({ data: backupData.requisitionItems });
      }
    }, {
        maxWait: 5000, // default: 2000
        timeout: 10000, // default: 5000
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    return NextResponse.json({ error: "Erro ao restaurar backup" }, { status: 500 });
  }
}
