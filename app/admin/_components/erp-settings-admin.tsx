// app/admin/_components/erp-settings-admin.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getErpSettings,
  updateDefaultOriginCode,
  updateSectorErpCodes,
  updateMultipleSectorErpCodes,
} from "@/app/actions/sectors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BuildingStorefrontIcon,
  CheckIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface SectorRow {
  id: string;
  code: string;
  name: string;
  erpOriginCode: string | null;
  erpDestCode: string | null;
}

export function ErpSettingsAdmin() {
  const [loading, setLoading] = useState(true);
  const [defaultOrigin, setDefaultOrigin] = useState("17");
  const [initialDefaultOrigin, setInitialDefaultOrigin] = useState("17");
  const [savingDefaultOrigin, setSavingDefaultOrigin] = useState(false);

  const [sectors, setSectors] = useState<SectorRow[]>([]);
  // Armazena valores editados no form: { [sectorId]: { origin: string, dest: string } }
  const [drafts, setDrafts] = useState<
    Record<string, { origin: string; dest: string }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const data = await getErpSettings();
      setDefaultOrigin(data.defaultOriginCode);
      setInitialDefaultOrigin(data.defaultOriginCode);
      setSectors(data.sectors);

      const initialDrafts: Record<string, { origin: string; dest: string }> = {};
      data.sectors.forEach((s) => {
        initialDrafts[s.id] = {
          origin: s.erpOriginCode || "",
          dest: s.erpDestCode || "",
        };
      });
      setDrafts(initialDrafts);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar configurações de almoxarifados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Salvar almoxarifado de origem padrão
  async function handleSaveDefaultOrigin() {
    const trimmed = defaultOrigin.trim();
    if (!trimmed) {
      toast.error("O código de origem padrão não pode ser vazio.");
      return;
    }
    setSavingDefaultOrigin(true);
    try {
      const res = await updateDefaultOriginCode(trimmed);
      if (res.success) {
        setInitialDefaultOrigin(trimmed);
        toast.success("Origem padrão salva com sucesso!");
        // Limpa cache da sessão do histórico
        sessionStorage.removeItem("@val-historico-reqs");
      } else {
        toast.error(res.error || "Erro ao salvar.");
      }
    } catch {
      toast.error("Erro inesperado ao salvar.");
    } finally {
      setSavingDefaultOrigin(false);
    }
  }

  // Atualizar campo em rascunho
  function handleDraftChange(
    sectorId: string,
    field: "origin" | "dest",
    value: string,
  ) {
    setDrafts((prev) => ({
      ...prev,
      [sectorId]: {
        ...(prev[sectorId] || { origin: "", dest: "" }),
        [field]: value,
      },
    }));
  }

  // Salvar uma linha individual
  async function handleSaveRow(sector: SectorRow) {
    const draft = drafts[sector.id] || { origin: "", dest: "" };
    setSavingId(sector.id);
    try {
      const res = await updateSectorErpCodes(sector.id, {
        erpOriginCode: draft.origin.trim() || null,
        erpDestCode: draft.dest.trim() || null,
      });

      if (res.success) {
        toast.success(`Códigos de "${sector.name}" salvos!`);
        setSectors((prev) =>
          prev.map((s) =>
            s.id === sector.id
              ? {
                  ...s,
                  erpOriginCode: draft.origin.trim() || null,
                  erpDestCode: draft.dest.trim() || null,
                }
              : s,
          ),
        );
        sessionStorage.removeItem("@val-historico-reqs");
      } else {
        toast.error(res.error || "Não foi possível salvar.");
      }
    } catch {
      toast.error("Erro ao salvar setor.");
    } finally {
      setSavingId(null);
    }
  }

  // Redefinir para o padrão (limpar personalização do setor)
  async function handleResetToDefault(sector: SectorRow) {
    setSavingId(sector.id);
    try {
      const res = await updateSectorErpCodes(sector.id, {
        erpOriginCode: null,
        erpDestCode: null,
      });

      if (res.success) {
        toast.success(`Setor "${sector.name}" redefinido para os padrões.`);
        setDrafts((prev) => ({
          ...prev,
          [sector.id]: { origin: "", dest: "" },
        }));
        setSectors((prev) =>
          prev.map((s) =>
            s.id === sector.id
              ? { ...s, erpOriginCode: null, erpDestCode: null }
              : s,
          ),
        );
        sessionStorage.removeItem("@val-historico-reqs");
      }
    } catch {
      toast.error("Erro ao redefinir setor.");
    } finally {
      setSavingId(null);
    }
  }

  // Salvar todas as linhas modificadas de uma vez
  async function handleSaveAll() {
    setSavingAll(true);
    try {
      const updates = sectors.map((s) => {
        const draft = drafts[s.id] || { origin: "", dest: "" };
        return {
          id: s.id,
          erpOriginCode: draft.origin.trim() || null,
          erpDestCode: draft.dest.trim() || null,
        };
      });

      const res = await updateMultipleSectorErpCodes(updates);
      if (res.success) {
        toast.success("Todas as alterações foram salvas com sucesso!");
        setSectors((prev) =>
          prev.map((s) => {
            const draft = drafts[s.id] || { origin: "", dest: "" };
            return {
              ...s,
              erpOriginCode: draft.origin.trim() || null,
              erpDestCode: draft.dest.trim() || null,
            };
          }),
        );
        sessionStorage.removeItem("@val-historico-reqs");
      } else {
        toast.error(res.error || "Erro ao salvar alterações.");
      }
    } catch {
      toast.error("Erro ao salvar em lote.");
    } finally {
      setSavingAll(false);
    }
  }

  // Filtragem de setores
  const filteredSectors = useMemo(() => {
    if (!searchTerm.trim()) return sectors;
    const term = searchTerm.toLowerCase();
    return sectors.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term) ||
        (s.erpDestCode && s.erpDestCode.toLowerCase().includes(term)),
    );
  }, [sectors, searchTerm]);

  // Contagem de setores com customizações
  const customCount = useMemo(() => {
    return sectors.filter(
      (s) => (s.erpDestCode && s.erpDestCode.trim()) || (s.erpOriginCode && s.erpOriginCode.trim()),
    ).length;
  }, [sectors]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <ArrowPathIcon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Banner Didático Explicativo ── */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 p-4 sm:p-5 dark:border-blue-500/30 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-1 text-sm">
            <h4 className="font-semibold text-blue-950 dark:text-blue-200">
              Como funciona a exportação CSV para o ERP
            </h4>
            <p className="text-blue-900/80 dark:text-blue-300/80 leading-relaxed">
              O arquivo CSV gerado no Histórico possui 4 colunas:{" "}
              <code className="rounded bg-blue-100 px-1 py-0.5 text-xs font-mono font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                [Código Produto] ; [Quantidade] ; [Almoxarifado Origem] ; [Almoxarifado Destino]
              </code>
              . Aqui você configura de onde os produtos saem e para onde entram sem precisar mexer em programação.
            </p>
          </div>
        </div>
      </div>

      {/* ── Card 1: Origem Padrão ── */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BuildingStorefrontIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Almoxarifado de Origem Padrão (Almoxarifado Central)
              </CardTitle>
              <CardDescription className="text-xs">
                Código do almoxarifado principal de onde os insumos são retirados.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 max-w-xs">
              <Input
                value={defaultOrigin}
                onChange={(e) => setDefaultOrigin(e.target.value)}
                placeholder="Ex: 17"
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleSaveDefaultOrigin}
              disabled={
                savingDefaultOrigin ||
                defaultOrigin.trim() === initialDefaultOrigin
              }
              className="gap-2 shrink-0"
            >
              {savingDefaultOrigin ? (
                <ArrowPathIcon className="size-4 animate-spin" />
              ) : (
                <CheckIcon className="size-4" />
              )}
              Salvar Origem Padrão
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Todos os setores que não tiverem uma origem específica configurada usarão o código{" "}
            <span className="font-semibold text-foreground">
              {defaultOrigin.trim() || "17"}
            </span>.
          </p>
        </CardContent>
      </Card>

      {/* ── Card 2: Mapeamento de Almoxarifados por Setor ── */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ArrowsRightLeftIcon className="size-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Almoxarifados por Setor (Destino e Origem)
                </CardTitle>
                <CardDescription className="text-xs">
                  Personalize o código de destino (ex: 50) ou origem para setores específicos.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {customCount} setor(es) personalizado(s)
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAll}
                disabled={savingAll}
                className="gap-1.5 text-xs font-medium"
              >
                {savingAll ? (
                  <ArrowPathIcon className="size-3.5 animate-spin" />
                ) : (
                  <CheckIcon className="size-3.5" />
                )}
                Salvar Tudo
              </Button>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="relative mt-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar setor por nome ou código..."
              className="pl-9 text-sm"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3 pl-4 pr-3 sm:pl-6">Setor Cadastrado</th>
                  <th className="px-3 py-3 w-40">
                    Origem (ERP)
                    <span className="block text-[10px] font-normal normal-case text-muted-foreground">
                      Vazio = Padrão ({defaultOrigin})
                    </span>
                  </th>
                  <th className="px-3 py-3 w-40">
                    Destino (ERP)
                    <span className="block text-[10px] font-normal normal-case text-muted-foreground">
                      Vazio = Código do Setor
                    </span>
                  </th>
                  <th className="px-3 py-3 w-36 hidden md:table-cell">
                    Prévia no CSV
                  </th>
                  <th className="py-3 pl-3 pr-4 sm:pr-6 text-right w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSectors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Nenhum setor encontrado para &quot;{searchTerm}&quot;.
                    </td>
                  </tr>
                ) : (
                  filteredSectors.map((sector) => {
                    const draft = drafts[sector.id] || {
                      origin: sector.erpOriginCode || "",
                      dest: sector.erpDestCode || "",
                    };

                    const isSavingThis = savingId === sector.id;

                    const effectiveOrigin =
                      draft.origin.trim() || defaultOrigin || "17";
                    const effectiveDest = draft.dest.trim() || sector.code;

                    const hasCustomDest = Boolean(
                      draft.dest.trim() && draft.dest.trim() !== sector.code,
                    );
                    const hasCustomOrigin = Boolean(
                      draft.origin.trim() &&
                        draft.origin.trim() !== defaultOrigin,
                    );

                    const hasChanges =
                      draft.origin.trim() !== (sector.erpOriginCode || "") ||
                      draft.dest.trim() !== (sector.erpDestCode || "");

                    return (
                      <tr
                        key={sector.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        {/* Nome do Setor */}
                        <td className="py-3 pl-4 pr-3 sm:pl-6">
                          <div className="font-medium text-foreground flex items-center gap-2">
                            <span>{sector.name}</span>
                            <Badge
                              variant="outline"
                              className="font-mono text-[11px] text-muted-foreground"
                            >
                              Cód: {sector.code}
                            </Badge>
                          </div>
                          {(hasCustomDest || hasCustomOrigin) && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <SparklesIcon className="size-3" /> Personalizado
                            </span>
                          )}
                        </td>

                        {/* Origem no ERP */}
                        <td className="px-3 py-2">
                          <Input
                            value={draft.origin}
                            onChange={(e) =>
                              handleDraftChange(
                                sector.id,
                                "origin",
                                e.target.value,
                              )
                            }
                            placeholder={`Padrão (${defaultOrigin})`}
                            className="h-8 font-mono text-xs"
                          />
                        </td>

                        {/* Destino no ERP */}
                        <td className="px-3 py-2">
                          <Input
                            value={draft.dest}
                            onChange={(e) =>
                              handleDraftChange(
                                sector.id,
                                "dest",
                                e.target.value,
                              )
                            }
                            placeholder={`Padrão (${sector.code})`}
                            className="h-8 font-mono text-xs font-semibold"
                          />
                        </td>

                        {/* Prévia no CSV */}
                        <td className="px-3 py-2 hidden md:table-cell">
                          <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground">
                            <span>...</span>
                            <span className="text-foreground font-semibold">
                              ;{effectiveOrigin}
                            </span>
                            <span className="text-foreground font-semibold">
                              ;{effectiveDest}
                            </span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-2 pl-3 pr-4 sm:pr-6 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Button
                              variant={hasChanges ? "default" : "ghost"}
                              size="sm"
                              className="h-8 px-2 text-xs"
                              disabled={isSavingThis || !hasChanges}
                              onClick={() => handleSaveRow(sector)}
                              title="Salvar alterações deste setor"
                            >
                              {isSavingThis ? (
                                <ArrowPathIcon className="size-3.5 animate-spin" />
                              ) : (
                                <CheckIcon className="size-3.5" />
                              )}
                              <span className="sr-only sm:not-sr-only sm:ml-1">
                                Salvar
                              </span>
                            </Button>

                            {(sector.erpOriginCode || sector.erpDestCode) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-[11px] text-muted-foreground hover:text-destructive"
                                disabled={isSavingThis}
                                onClick={() => handleResetToDefault(sector)}
                                title="Voltar aos códigos padrões"
                              >
                                Limpar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Box de Dica / Exemplo Prático ── */}
      <div className="rounded-lg border border-border bg-card/60 p-4 text-xs text-muted-foreground space-y-1.5">
        <div className="font-medium text-foreground flex items-center gap-1.5">
          <span>💡 Exemplo prático:</span>
        </div>
        <p>
          Se os insumos de <strong>Embalagens - Lanchonete</strong> e{" "}
          <strong>Material de limpeza - Lanchonete</strong> devem ir para a
          planilha com destino <strong>50</strong>, basta preencher <strong>50</strong>{" "}
          na coluna <strong>Destino (ERP)</strong> dessas linhas e clicar em salvar.
        </p>
        <p>
          No momento em que você baixar o CSV no <strong>Histórico</strong>, o
          sistema usará automaticamente o código <strong>50</strong> na coluna D.
        </p>
      </div>
    </div>
  );
}
