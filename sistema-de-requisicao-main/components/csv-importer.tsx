//components/csv-importer.tsx
"use client";

import { useRef } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

// Uma linha por par item+setor da planilha. O store faz o merge/dedup
// (mesmo item em setores diferentes = linhas separadas com o mesmo `name`).
export interface ParsedCSVItem {
  name: string;
  unit: string;
  sectorName: string;
  cost?: number;
}

// split() simples quebra quando tem delimitador dentro de aspas, então parseia char a char
function parseCSVLine(text: string, delimiter: string) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function CsvImporter({
  onImport,
}: {
  onImport: (data: ParsedCSVItem[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l);
      if (lines.length < 2) return;

      // Delimitador detectado pelo cabeçalho: aceita export PT-BR (;) e CSV
      // padrão (,) sem exigir configuração do usuário
      const delimiter = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0]
        .split(delimiter)
        .map((h) => h.trim().toLowerCase());

      // Matching por substring: a planilha não tem cabeçalho padronizado
      // entre setores/origens diferentes. Ordem importa — "cod" bate em
      // "cod item" e "cod setor", por isso "cod setor" exige "setor" junto.
      const idxDescItem = headers.findIndex((h) => h.includes("desc"));
      const idxUnit = headers.findIndex((h) => h.includes("uni"));
      const idxNomeSetor = headers.findIndex(
        (h) => h.includes("nome") && h.includes("setor"),
      );
      const idxCost = headers.findIndex(
        (h) => h.includes("cust") || h.includes("preco") || h.includes("valor"),
      );

      const rows: ParsedCSVItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], delimiter).map((c) =>
          c.replace(/^"|"$/g, ""),
        );

        const name = cols[idxDescItem];
        const unit = (cols[idxUnit] || "UN").toUpperCase();
        const sectorName = cols[idxNomeSetor];
        const rawCost = idxCost !== -1 ? cols[idxCost] : undefined;

        if (!name || !sectorName) continue;

        const cost = rawCost
          ? parseFloat(rawCost.replace(".", "").replace(",", "."))
          : undefined;

        rows.push({
          name,
          unit,
          sectorName,
          cost: cost !== undefined && !isNaN(cost) ? cost : undefined,
        });
      }

      onImport(rows);

      // Reseta o input pra permitir reimportar o mesmo arquivo (onChange não
      // dispara se o value não mudar)
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileRef.current?.click()}
        className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
      >
        <ArrowUpTrayIcon className="size-4" />
        <span className="hidden sm:inline">Importar Planilha</span>
      </Button>
    </>
  );
}
