// app/historico/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FolderIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  EyeSlashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { FolderIcon as FolderSolid } from "@heroicons/react/24/solid";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRequisitions } from "@/app/actions/requisitions";
import {
  FullRequisition,
  formatDatePTBR,
  exportCSV,
  exportPDF,
} from "./_components/export-utils";
import { RequisitionCard } from "./_components/requisition-card";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const HIDE_EMPTY_KEY = "@val-historico-hide-empty";

export default function HistoricoPage() {
  const [requisitions, setRequisitions] = useState<FullRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [searchDate, setSearchDate] = useState<string>("");
  const [hideEmptyFolders, setHideEmptyFolders] = useState(false);

  // Carrega preferência de ocultar pastas vazias
  useEffect(() => {
    const saved = localStorage.getItem(HIDE_EMPTY_KEY);
    if (saved === "true") setHideEmptyFolders(true);
  }, []);

  function toggleHideEmptyFolders() {
    setHideEmptyFolders((prev) => {
      const next = !prev;
      localStorage.setItem(HIDE_EMPTY_KEY, String(next));
      return next;
    });
  }

  async function fetchReqs(forceRefresh = false) {
    if (forceRefresh) setIsRefreshing(true);

    if (!forceRefresh) {
      const cached = sessionStorage.getItem("@val-historico-reqs");
      if (cached) {
        setRequisitions(JSON.parse(cached));
        setLoading(false);
      }
    }

    try {
      const data = await getRequisitions();
      // @ts-ignore
      setRequisitions(data);
      sessionStorage.setItem("@val-historico-reqs", JSON.stringify(data));
    } catch (error) {
      console.error("Erro ao atualizar histórico:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    fetchReqs();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set(
      requisitions.map((r) => new Date(r.createdAt).getFullYear().toString()),
    );
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [requisitions]);

  const isSearching = searchDate !== "";

  const displayRequisitions = useMemo(() => {
    let filtered = requisitions;

    if (isSearching) {
      filtered = requisitions.filter(
        (r) => new Date(r.createdAt).toISOString().slice(0, 10) === searchDate,
      );
    } else if (activeMonth !== null) {
      filtered = requisitions.filter((r) => {
        const date = new Date(r.createdAt);
        return (
          date.getFullYear().toString() === selectedYear &&
          date.getMonth() === activeMonth
        );
      });
    } else {
      return [];
    }

    return filtered.sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [requisitions, isSearching, searchDate, activeMonth, selectedYear]);

  const groupedByDay = useMemo(() => {
    const groups: Record<string, FullRequisition[]> = {};
    displayRequisitions.forEach((req) => {
      const day = new Date(req.createdAt).toISOString().slice(0, 10);
      if (!groups[day]) groups[day] = [];
      groups[day].push(req);
    });
    return groups;
  }, [displayRequisitions]);

  // Contagem de arquivos por mês (para o grid e para o filtro de vazios)
  const monthsWithCount = useMemo(() => {
    return MONTHS.map((month, index) => {
      const count = requisitions.filter((r) => {
        const date = new Date(r.createdAt);
        return (
          date.getFullYear().toString() === selectedYear &&
          date.getMonth() === index
        );
      }).length;
      return { month, index, count };
    });
  }, [requisitions, selectedYear]);

  const visibleMonths = hideEmptyFolders
    ? monthsWithCount.filter((m) => m.count > 0)
    : monthsWithCount;

  if (loading) {
    return (
      <AppShell title="Histórico e Relatórios">
        <div className="flex h-full flex-col -m-4 md:-m-6">
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">
              Buscando histórico...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Histórico e Relatórios">
      <div className="flex h-full flex-col -m-4 md:-m-6">
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              {/* Busca por data */}
              <div className="flex flex-col gap-1.5 w-full sm:w-52">
                <span className="text-xs font-medium text-muted-foreground ml-0.5">
                  Buscar por data exata
                </span>
                <div className="relative">
                  <CalendarDaysIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={searchDate}
                    onChange={(e) => {
                      setSearchDate(e.target.value);
                      if (e.target.value) setActiveMonth(null);
                    }}
                    className="pl-9 h-10"
                  />
                </div>
                {/* Ano */}
                {!isSearching && (
                  <div className="w-28">
                    <Select
                      value={selectedYear}
                      onValueChange={(val) => val && setSelectedYear(val)}
                    >
                      <SelectTrigger className="h-10 font-semibold text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((y) => (
                          <SelectItem key={y} value={y}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Ações da direita */}
              <div className="flex flex-wrap items-end gap-2">
                {/* Ocultar pastas vazias */}
                {!isSearching && activeMonth === null && (
                  <Button
                    variant={hideEmptyFolders ? "secondary" : "outline"}
                    size="sm"
                    className="h-10 gap-2"
                    onClick={toggleHideEmptyFolders}
                    title={
                      hideEmptyFolders
                        ? "Mostrar pastas vazias"
                        : "Ocultar pastas vazias"
                    }
                  >
                    {hideEmptyFolders ? (
                      <EyeIcon className="size-4" />
                    ) : (
                      <EyeSlashIcon className="size-4" />
                    )}
                    <span className="hidden sm:inline text-xs">
                      {hideEmptyFolders ? "Mostrar vazias" : "Ocultar vazias"}
                    </span>
                  </Button>
                )}

                {/* Sincronizar */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3"
                  onClick={() => fetchReqs(true)}
                  disabled={isRefreshing}
                  title="Sincronizar dados"
                >
                  <ArrowPathIcon
                    className={`size-4 ${isRefreshing ? "animate-spin text-primary" : ""}`}
                  />
                  <span className="ml-1.5 hidden sm:inline text-xs">
                    Sincronizar
                  </span>
                </Button>
              </div>
            </div>

            {/* LISTA DE MESES */}
            {!isSearching && activeMonth === null && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {visibleMonths.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-muted-foreground">
                    <FolderIcon className="mx-auto size-12 opacity-40 mb-3" />
                    <p>Nenhuma pasta com arquivos neste ano.</p>
                    {hideEmptyFolders && (
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={toggleHideEmptyFolders}
                      >
                        Mostrar pastas vazias
                      </Button>
                    )}
                  </div>
                ) : (
                  visibleMonths.map(({ month, index, count }) => (
                    <button
                      key={month}
                      onClick={() => setActiveMonth(index)}
                      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 text-center transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
                    >
                      <div className="relative text-muted-foreground transition-colors group-hover:text-primary">
                        {count > 0 ? (
                          <FolderSolid className="size-14 text-primary" />
                        ) : (
                          <FolderIcon className="size-14" />
                        )}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-foreground">
                          {month}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {count} {count === 1 ? "arquivo" : "arquivos"}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* VISUALIZAÇÃO DOS DIAS DENTRO DO MÊS/PESQUISA */}
            {(isSearching || activeMonth !== null) && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveMonth(null);
                      setSearchDate("");
                    }}
                    className="gap-2"
                  >
                    <ArrowLeftIcon className="size-4" />
                    Voltar
                  </Button>
                  <h2 className="text-lg font-bold">
                    {isSearching
                      ? `Resultados: ${formatDatePTBR(searchDate)}`
                      : `Arquivos de ${MONTHS[activeMonth!]} de ${selectedYear}`}
                  </h2>
                </div>

                {Object.keys(groupedByDay).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
                    <FolderIcon className="mx-auto size-12 opacity-40 mb-3" />
                    <p>Nenhuma requisição encontrada neste período.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-8">
                    {Object.entries(groupedByDay)
                      .sort(
                        ([dateA], [dateB]) =>
                          +new Date(dateB) - +new Date(dateA),
                      )
                      .map(([dayString, dayReqs]) => (
                        <div key={dayString} className="flex flex-col gap-3">
                          {/* Cabeçalho do Dia */}
                          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <CalendarDaysIcon className="size-4 text-primary" />
                              <h3 className="font-semibold">
                                {formatDatePTBR(dayString)}
                              </h3>
                              <span className="text-xs rounded-full bg-background px-2 py-0.5 border text-muted-foreground">
                                {dayReqs.length}{" "}
                                {dayReqs.length === 1 ? "resgate" : "resgates"}
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() =>
                                  exportCSV(dayReqs, `Consolidado_${dayString}`)
                                }
                              >
                                <TableCellsIcon className="size-3.5 text-emerald-600" />
                                <span className="hidden sm:inline">CSV</span>
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-8 gap-1.5 text-xs"
                                onClick={() =>
                                  exportPDF(dayReqs, `Consolidado_${dayString}`)
                                }
                              >
                                <DocumentArrowDownIcon className="size-3.5 text-rose-600" />
                                <span className="hidden sm:inline">PDF</span>
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {dayReqs.map((req) => (
                              <RequisitionCard
                                key={req.id}
                                req={req}
                                dayString={dayString}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
