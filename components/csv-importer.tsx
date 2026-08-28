"use client";

import { useRef } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

export interface SmartImportData {
  items: {
    code: string;
    name: string;
    unit: string;
    cost?: number;
    sectorPairs: { code: string; name: string }[];
  }[];
  sectors: { code: string; name: string }[];
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
  onImport: (data: SmartImportData) => void;
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

      const delimiter = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0]
        .split(delimiter)
        .map((h) => h.trim().toLowerCase());

      const idxDescItem = headers.findIndex((h) => h.includes("desc"));
      const idxUnit = headers.findIndex((h) => h.includes("uni"));
      const idxNomeSetor = headers.findIndex(
        (h) => h.includes("nome") && h.includes("setor"),
      );
      const idxCost = headers.findIndex(
        (h) => h.includes("cust") || h.includes("preco") || h.includes("valor"),
      );

      let idxCodSetor = headers.findIndex((h) => h.includes("cod") && (h.includes("setor") || h.includes("almox")));
      let idxCodItem = headers.findIndex((h) => h.includes("cod") && (h.includes("item") || h.includes("insumo")));

      if (idxCodSetor === -1 || idxCodItem === -1) {
         const allCodIdx = headers.map((h, i) => (h === "cod" || h.includes("código") || h === "codigo" || (h.includes("cod") && !h.includes("desc"))) ? i : -1).filter(i => i !== -1);
         
         if (idxCodSetor !== -1 && idxCodItem === -1) {
           const fallbackItem = allCodIdx.find(i => i !== idxCodSetor);
           if (fallbackItem !== undefined) idxCodItem = fallbackItem;
         } else if (idxCodItem !== -1 && idxCodSetor === -1) {
           const fallbackSector = allCodIdx.find(i => i !== idxCodItem);
           if (fallbackSector !== undefined) idxCodSetor = fallbackSector;
         } else if (allCodIdx.length >= 2) {
           idxCodItem = allCodIdx[0]; 
           idxCodSetor = allCodIdx[1];
         }
      }

      if (idxCodSetor === -1 || idxCodItem === -1) {
         alert("ERRO NA PLANILHA: Não foi possível identificar com clareza a coluna de 'Código do Setor' e 'Código do Item'. Por favor, nomeie os cabeçalhos como 'Cod Setor' e 'Cod Item' e tente novamente.");
         if (fileRef.current) fileRef.current.value = "";
         return;
      }

      const itemsMap = new Map<string, SmartImportData["items"][0]>();
      const sectorsMap = new Map<string, { code: string; name: string }>();

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i], delimiter).map((c) =>
          c.replace(/^"|"$/g, ""),
        );

        const name = cols[idxDescItem];
        const unit = (cols[idxUnit] || "UN").toUpperCase();
        const sectorName = cols[idxNomeSetor];
        const rawCost = idxCost !== -1 ? cols[idxCost] : undefined;
        
        const sectorCode = idxCodSetor !== -1 && cols[idxCodSetor] ? cols[idxCodSetor] : sectorName;
        const itemCode = idxCodItem !== -1 && cols[idxCodItem] ? cols[idxCodItem] : name;

        if (!name || !sectorName) continue;

        const cost = rawCost
          ? parseFloat(rawCost.replace(".", "").replace(",", "."))
          : undefined;

        const sectorKey = `${sectorCode.toUpperCase()}|${sectorName.toUpperCase()}`;
        if (!sectorsMap.has(sectorKey)) {
          sectorsMap.set(sectorKey, { code: sectorCode, name: sectorName });
        }

        const itemKey = itemCode.toUpperCase();
        if (!itemsMap.has(itemKey)) {
          itemsMap.set(itemKey, {
            code: itemCode,
            name,
            unit,
            cost: cost !== undefined && !isNaN(cost) ? cost : undefined,
            sectorPairs: [{ code: sectorCode, name: sectorName }],
          });
        } else {
          const existingItem = itemsMap.get(itemKey)!;
          const hasSector = existingItem.sectorPairs.some(
             (s) => s.code.toUpperCase() === sectorCode.toUpperCase() && s.name.toUpperCase() === sectorName.toUpperCase()
          );
          if (!hasSector) {
            existingItem.sectorPairs.push({ code: sectorCode, name: sectorName });
          }
        }
      }

      const smartData: SmartImportData = {
        items: Array.from(itemsMap.values()),
        sectors: Array.from(sectorsMap.values()),
      };

      onImport(smartData);

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
