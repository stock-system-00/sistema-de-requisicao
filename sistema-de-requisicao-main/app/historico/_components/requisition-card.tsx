// app/historico/_components/requisition-card.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TableCellsIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  exportCSV,
  exportPDF,
  FullRequisition,
  formatDatePTBR,
} from "./export-utils";

import {
  updateRequisitionStatus,
  deleteRequisition,
  deleteRequisitionItem,
  updateRequisitionDate,
  updateRequisitionItemQuantity,
} from "@/app/actions/requisitions";

const formatBRNumber = (num: number) => String(num).replace(".", ",");
const parseBRNumber = (str: string) => parseFloat(str.replace(",", "."));

export function RequisitionCard({
  req,
  dayString,
}: {
  req: FullRequisition;
  dayString: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // ── ESTADOS LOCAIS ──
  const [isVisible, setIsVisible] = useState(true);
  const [localItems, setLocalItems] = useState(req.items);
  const [localStatus, setLocalStatus] = useState(req.status);
  const [localDate, setLocalDate] = useState<Date | string>(req.createdAt);

  // ── ESTADOS DE CONFIRMAÇÃO INLINE (Fim dos alertas feios) ──
  const [confirmDeleteReq, setConfirmDeleteReq] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQtyValue, setEditQtyValue] = useState<string>("");

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState(() => {
    return new Date(req.createdAt).toISOString().split("T")[0];
  });

  // Mantém os estados locais sempre sincronizados com o servidor pós-refresh
  useEffect(() => {
    setLocalItems(req.items);
    setLocalStatus(req.status);
    setLocalDate(req.createdAt);
  }, [req]);

  if (!isVisible) return null;

  const currentReqData: FullRequisition = {
    ...req,
    status: localStatus,
    createdAt: new Date(localDate),
    items: localItems,
  };

  // --- HANDLERS ---

  async function handleCompleteRequisition() {
    setLocalStatus("CONCLUIDA");
    setOpen(false);

    const res = await updateRequisitionStatus(req.id, "CONCLUIDA");
    if (res.success) {
      router.refresh();
    } else {
      setLocalStatus(req.status);
      alert(res.error);
    }
  }

  async function handleDeleteRequisition() {
    setIsVisible(false);
    setOpen(false);

    const res = await deleteRequisition(req.id);
    if (res.success) {
      router.refresh();
    } else {
      setIsVisible(true);
      alert(res.error);
    }
  }

  async function handleSaveDate() {
    if (!dateValue) return;

    const [year, month, day] = dateValue.split("-");
    const newDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      12,
      0,
      0,
    );

    setLocalDate(newDate);
    setIsEditingDate(false);

    setIsPending(true);
    const res = await updateRequisitionDate(req.id, newDate);
    setIsPending(false);

    if (res.success) {
      router.refresh();
    } else {
      setLocalDate(req.createdAt);
      alert(res.error);
    }
  }

  async function handleDeleteItem(itemId: string) {
    const previousItems = [...localItems];
    setLocalItems((prev) => prev.filter((i) => i.id !== itemId));
    setItemToDelete(null);

    setIsPending(true);
    const res = await deleteRequisitionItem(itemId);
    setIsPending(false);

    if (res.success) {
      router.refresh();
    } else {
      setLocalItems(previousItems);
      alert(res.error);
    }
  }

  function startEditItem(itemId: string, currentQty: number) {
    setEditingItemId(itemId);
    setEditQtyValue(formatBRNumber(currentQty));
    setItemToDelete(null);
  }

  async function saveEditItem(itemId: string) {
    const newQuantity = parseBRNumber(editQtyValue);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      alert("Por favor, insira uma quantidade válida maior que zero.");
      return;
    }

    const previousItems = [...localItems];
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      ),
    );
    setEditingItemId(null);

    setIsPending(true);
    const res = await updateRequisitionItemQuantity(itemId, newQuantity);
    setIsPending(false);

    if (res.success) {
      router.refresh();
    } else {
      setLocalItems(previousItems);
      alert(res.error);
    }
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-lg text-primary group-hover:underline">
              {currentReqData.sector.name}
            </p>
            <p className="text-sm font-mono text-muted-foreground mt-0.5">
              Cód: {currentReqData.sector.code}
            </p>
          </div>
          <StatusBadge status={currentReqData.status as any} />
        </div>

        <div className="flex flex-col gap-1 text-sm bg-muted/30 p-3 rounded-lg border">
          {currentReqData.items.slice(0, 3).map((reqItem) => (
            <div key={reqItem.id} className="flex justify-between">
              <span className="truncate pr-2">{reqItem.item.name}</span>
              <span className="font-medium shrink-0">
                {formatBRNumber(reqItem.quantity)} {reqItem.item.unit}
              </span>
            </div>
          ))}
          {currentReqData.items.length > 3 && (
            <p className="text-xs text-muted-foreground mt-1 pt-1 border-t italic">
              + {currentReqData.items.length - 3} itens ocultos...
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mt-auto pt-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              exportCSV(
                [currentReqData],
                `Req_${currentReqData.sector.name}_${dayString}`,
              );
            }}
          >
            <TableCellsIcon className="size-4" /> CSV
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              exportPDF(
                [currentReqData],
                `Req_${currentReqData.sector.name}_${dayString}`,
              );
            }}
          >
            <DocumentArrowDownIcon className="size-4" /> PDF
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Detalhes da Separação</DialogTitle>
          </DialogHeader>

          <div className="bg-muted/50 p-4 rounded-xl border flex flex-col gap-1 shrink-0">
            <p className="text-sm text-muted-foreground">Setor de Destino:</p>
            <p className="text-lg font-bold">
              [{currentReqData.sector.code}] {currentReqData.sector.name}
            </p>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-muted-foreground">
                Data:
              </span>
              {isEditingDate ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateValue}
                    onChange={(e) => setDateValue(e.target.value)}
                    className="h-8 w-40 text-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-green-600 hover:bg-green-100"
                    onClick={handleSaveDate}
                    disabled={isPending}
                  >
                    <CheckIcon className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:bg-red-100"
                    onClick={() => setIsEditingDate(false)}
                    disabled={isPending}
                  >
                    <XMarkIcon className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {formatDatePTBR(currentReqData.createdAt)}
                  </p>
                  <button
                    onClick={() => setIsEditingDate(true)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <PencilIcon className="size-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm font-medium mt-1">
              Status: {currentReqData.status}
            </p>
          </div>

          <h3 className="font-semibold text-lg mt-2 flex justify-between items-center">
            <span>Insumos Separados ({currentReqData.items.length})</span>
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
            {currentReqData.items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic p-4 text-center border rounded-lg bg-muted/20">
                Nenhum insumo nesta requisição.
              </p>
            ) : (
              currentReqData.items.map((reqItem) => (
                <div
                  key={reqItem.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card group/item hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="font-semibold truncate">
                      {reqItem.item.name}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Cód: {reqItem.item.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* EDIÇÃO INLINE */}
                    {editingItemId === reqItem.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editQtyValue}
                          onChange={(e) => setEditQtyValue(e.target.value)}
                          className="h-8 w-16 text-center font-bold px-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditItem(reqItem.id);
                            if (e.key === "Escape") setEditingItemId(null);
                          }}
                        />
                        <span className="text-sm font-semibold">
                          {reqItem.item.unit}
                        </span>
                        <button
                          onClick={() => saveEditItem(reqItem.id)}
                          disabled={isPending}
                          className="ml-1 p-1.5 text-green-600 hover:bg-green-50 rounded-md"
                        >
                          <CheckIcon className="size-4" />
                        </button>
                        <button
                          onClick={() => setEditingItemId(null)}
                          disabled={isPending}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <XMarkIcon className="size-4" />
                        </button>
                      </div>
                    ) : itemToDelete === reqItem.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-600">
                          Excluir?
                        </span>
                        <button
                          onClick={() => handleDeleteItem(reqItem.id)}
                          disabled={isPending}
                          className="p-1.5 text-white bg-red-600 hover:bg-red-700 rounded-md"
                        >
                          <CheckIcon className="size-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(null)}
                          disabled={isPending}
                          className="p-1.5 text-muted-foreground hover:bg-muted rounded-md"
                        >
                          <XMarkIcon className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">
                            {formatBRNumber(reqItem.quantity)}
                          </span>
                          <span className="text-sm font-semibold ml-1">
                            {reqItem.item.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              startEditItem(reqItem.id, reqItem.quantity)
                            }
                            disabled={isPending}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(reqItem.id)}
                            disabled={isPending}
                            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <TrashIcon className="size-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="mt-4 flex-col sm:flex-row sm:justify-between gap-3 shrink-0">
            {/* EXCLUSÃO INLINE DA REQUISIÇÃO INTEIRA */}
            <div className="w-full sm:w-auto">
              {confirmDeleteReq ? (
                <div className="flex items-center gap-2 w-full">
                  <Button
                    variant="destructive"
                    className="flex-1 sm:flex-none"
                    onClick={handleDeleteRequisition}
                    disabled={isPending}
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => setConfirmDeleteReq(false)}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full sm:w-auto bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none"
                  onClick={() => setConfirmDeleteReq(true)}
                  disabled={isPending}
                >
                  <TrashIcon className="size-4 mr-2" />
                  Excluir Requisição
                </Button>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              {currentReqData.status === "ABERTA" && (
                <Button
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-bold"
                  onClick={handleCompleteRequisition}
                  disabled={isPending || currentReqData.items.length === 0}
                >
                  <CheckCircleIcon className="size-5 mr-2" />
                  Concluir
                </Button>
              )}
              <Button
                variant={
                  currentReqData.status === "ABERTA" ? "outline" : "default"
                }
                className="flex-1 sm:flex-none"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
