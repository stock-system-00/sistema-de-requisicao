// app/historico/_components/export-utils.ts
export function formatDatePTBR(iso: string | Date) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

export interface FullRequisition {
  id: string;
  createdAt: Date;
  status: string;
  sector: {
    id: string;
    name: string;
    code: string;
    erpOriginCode?: string | null;
    erpDestCode?: string | null;
    store?: {
      defaultOriginCode?: string | null;
    };
  };
  items: {
    id: string;
    quantity: number;
    item: { id: string; name: string; code: string; unit: string };
  }[];
}

// ============================================================================
// EXPORT CSV — layout de importação do ERP
// ============================================================================
// Formato de linha: codInsumo;qtd;codOrigem;codDestino
// - Sem aspas nos campos (parser do ERP não trata QUOTE_MINIMAL)
// - Separador ";" (não "," — parser do ERP quebra com vírgula por causa do decimal BR)
// - Decimal com vírgula (padrão BR)
export const exportCSV = (reqs: FullRequisition[], title: string) => {
  let csvContent = "";

  reqs.forEach((req) => {
    // 1. Destino: se houver erpDestCode definido no cadastro de almoxarifados ERP, usa ele; senão usa o código do setor
    const codDestino =
      (req.sector.erpDestCode && req.sector.erpDestCode.trim()) ||
      req.sector.code;

    // 2. Origem: se o setor tiver erpOriginCode personalizado, usa ele; senão usa a origem padrão da loja (ou "17")
    const defaultStoreOrigin =
      req.sector.store?.defaultOriginCode &&
      req.sector.store.defaultOriginCode.trim();
    const codOrigem =
      (req.sector.erpOriginCode && req.sector.erpOriginCode.trim()) ||
      defaultStoreOrigin ||
      "17";

    req.items.forEach((reqItem) => {
      const codInsumo = reqItem.item.code;
      const qtd = reqItem.quantity.toString().replace(".", ",");

      csvContent += `${codInsumo};${qtd};${codOrigem};${codDestino}\n`;
    });
  });

  // BOM UTF-8 (\uFEFF) necessário para o Excel não corromper acentuação PT-BR
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${title}.csv`;
  link.click();
};

// ============================================================================
// EXPORT PDF — impressão via window.print() em janela auxiliar (A4)
// ============================================================================
export const exportPDF = (reqs: FullRequisition[], title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return; // bloqueado por popup blocker — sem fallback tratado

  const cleanTitle = title.replace(/_/g, " ");

  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <title>${cleanTitle}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', system-ui, sans-serif; 
            color: #334155; 
            line-height: 1.5; 
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          
          .doc-header { 
            text-align: center; 
            border-bottom: 2px solid #e2e8f0; 
            padding-bottom: 15px; 
            margin-bottom: 30px; 
          }
          .doc-header h1 { 
            font-size: 22px; 
            color: #0f172a; 
            margin: 0 0 5px 0; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-subtitle {
            font-size: 14px; 
            color: #64748b;
          }

          .req-block { 
            margin-bottom: 40px; 
            page-break-inside: avoid;
          }
          .req-header { 
            background-color: #f8fafc; 
            border: 1px solid #e2e8f0; 
            border-left: 4px solid #3b82f6; 
            padding: 12px 16px; 
            border-radius: 6px 6px 0 0; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
          }
          .req-title { 
            font-size: 15px; 
            font-weight: 700; 
            color: #1e293b; 
            margin: 0; 
          }
          .req-date { 
            font-size: 13px; 
            color: #64748b; 
            font-weight: 500;
          }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 1px solid #e2e8f0; 
            border-top: none; 
          }
          th, td { 
            padding: 10px 14px; 
            text-align: left; 
            font-size: 13px; 
            border-bottom: 1px solid #e2e8f0; 
          }
          th { 
            background-color: #f1f5f9; 
            font-weight: 600; 
            color: #475569; 
            text-transform: uppercase; 
            font-size: 11px; 
            letter-spacing: 0.5px;
          }
          
          .col-cod { width: 15%; }
          .col-desc { width: 55%; }
          .col-qtd { width: 15%; text-align: center; }
          .col-un { width: 15%; text-align: center; }
          
          td.col-qtd, td.col-un { text-align: center; }
          td.col-qtd { font-weight: 600; color: #0f172a; }
          
          .stripe:nth-child(even) { background-color: #f8fafc; }
          
          .footer { 
            text-align: center; 
            font-size: 10px; 
            color: #94a3b8; 
            margin-top: 40px; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 10px; 
          }
        </style>
      </head>
      <body>
        <div class="doc-header">
          <h1>Relatório de Separação de Estoque</h1>
          <div class="doc-subtitle">${cleanTitle}</div>
        </div>
  `;

  // Um bloco (header + tabela) por requisição/setor
  reqs.forEach((req) => {
    html += `
      <div class="req-block">
        <div class="req-header">
          <h2 class="req-title">Setor Destino: ${req.sector.name}</h2>
          <span class="req-date">Data: ${formatDatePTBR(req.createdAt)}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-cod">Código</th>
              <th class="col-desc">Descrição do Insumo</th>
              <th class="col-qtd">Quantidade</th>
              <th class="col-un">Unidade</th>
            </tr>
          </thead>
          <tbody>
            ${req.items
              .map(
                (reqItem) => `
              <tr class="stripe">
                <td class="col-cod">${reqItem.item.code}</td>
                <td class="col-desc">${reqItem.item.name}</td>
                <td class="col-qtd">${reqItem.quantity.toString().replace(".", ",")}</td>
                <td class="col-un">${reqItem.item.unit}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  });

  html += `
        <div class="footer">
          Gerado pelo Sistema de Requisição • ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  // Timeout necessário: print() disparado antes do reflow do CSS gera página em branco
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
