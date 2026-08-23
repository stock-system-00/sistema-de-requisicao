# Documentação Técnica — Reqi

Este documento destina-se ao desenvolvedor responsável por dar manutenção, escalar ou atender novas solicitações do cliente no sistema **Reqi**.

---

## 🚀 1. Stack Tecnológica

- **Framework:** Next.js (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados & ORM:** PostgreSQL (hospedado na Neon Tech) via Prisma ORM
- **Estilização & Componentes:** Tailwind CSS, Radix UI / Base UI (shadcn/ui)
- **Gerenciador de Pacotes:** `pnpm`
- **Gráficos:** Recharts

---

## 📂 2. Estrutura de Diretórios Críticos

```text
sistema-de-requisicao/
├── app/
│   ├── actions/          # Server Actions (Lógica de negócio e banco de dados)
│   │   ├── auth.ts       # Autenticação, sessão e métricas de uso do Neon DB
│   │   ├── items.ts      # Gestão de insumos e importação em lote (Bulk)
│   │   ├── requisitions.ts # Lógica de separação, datas e transações
│   │   └── sectors.ts    # Gestão de setores
│   ├── admin/            # Painel de cadastros (Insumos, Setores)
│   ├── dashboard/        # Gráficos de consumo e KPIs operacionais
│   ├── historico/        # Histórico de separações, edição e exportação CSV
│   └── relatorios/       # Gerador de relatórios executivos dinâmicos (Preview e Print)
├── components/           # Componentes globais (Sidebar, UI primitives)
├── prisma/
│   └── schema.prisma     # Modelagem do Banco de Dados
└── public/               # Assets estáticos e PWA manifest

```

---

## ⚙️ 3. Como Rodar o Projeto em Ambiente de Desenvolvimento

1. Instale as dependências utilizando o pnpm:

```bash
pnpm install

```

2. Configure o arquivo `.env` na raiz do projeto contendo a string de conexão do banco PostgreSQL:

```env
DATABASE_URL="postgresql://usuario:senha@host/neondb?sslmode=require"

```

3. Sincronize o Prisma com o banco de dados (se necessário):

```bash
npx prisma db push

```

4. Inicie o servidor de desenvolvimento:

```bash
pnpm dev

```

---

## 🧠 4. Regras de Negócio e "Gotchas" Técnicos (Atenção aqui!)

### A. Flexibilidade de Datas nas Requisições (`app/actions/requisitions.ts`)

- **Problema anterior:** Lançar um item gerando requisição para uma data passada ou futura acabava agrupando com o dia corrente se houvesse requisição aberta.
- **Solução aplicada:** A função `createRequisition` recebe opcionalmente uma `customDateStr` (`YYYY-MM-DD`). Ela calcula o `startOfDay` e o `endOfDay` daquela data específica. O Prisma busca requisições com status `"ABERTA"` estritamente **dentro daquele dia**. Se o usuário mudar a data no front-end, o sistema cria uma nova requisição isolada para aquela data, sem misturar dias.

### B. Importação Inteligente de CSV (`components/csv-importer.tsx` e `app/actions/items.ts`)

- O leitor possui uma função customizada `parseCSVLine` que ignora vírgulas contidas dentro de aspas duplas (ex: nomes de produtos compostos).
- O arquivo gerado para exportação e integração com ERP Linx - Emsys, utiliza estritamente **ponto e vírgula (;)** como separador e **sem aspas**, respeitando o padrão numérico brasileiro (`1,5` em vez de `1.5`).
- A importação em lote (`bulkImportData`) processa os itens em memória utilizando mapas (`Map`) antes de enviar ao Prisma, evitando estouro de conexões simultâneas (limites do plano Free do Neon DB).

### C. Relatórios Executivos e Impressão (`app/relatorios/`)

- A página utiliza o padrão de **Prévia de Impressão** (`isPreviewMode`). O usuário configura o período, o setor e quais blocos quer exibir (custos, gráficos, tabela, assinaturas) antes de renderizar a folha A4 virtual.
- O componente de gráficos utiliza a propriedade `isAnimationActive={false}` para garantir que, ao acionar o atalho de impressão (`window.print()`), o PDF não gere gráficos em branco por causa de atrasos de animação do Recharts.

### D. Monitoramento do Banco de Dados (`app/actions/auth.ts`)

- A função `getDbStorageUsage` executa uma query nativa do PostgreSQL (`pg_database_size`) para calcular o uso real em Megabytes do banco Neon, comparando com o limite gratuito de `512 MB` e exibindo uma barra de progresso dinâmica na Sidebar.
