
# 📋 Sistema de Requisição - Estrutura do Projeto

> **Nível:** Iniciante  
> **Tempo de leitura:** 12 minutos

---

## 📖 Sobre

Esta documentação mapeia todo o repositório `sistema-de-requisicao` para que você possa navegar com confiança antes de explorar qualquer recurso específico. O projeto é uma aplicação **Next.js 16 App Router** escrita em **TypeScript**, usando **Prisma** sobre **PostgreSQL**, **shadcn/ui** com **Tailwind CSS v4** e configurada como um **Progressive Web App** — tudo orquestrado para servir um sistema de requisição digital em português para operações internas de varejo e alimentação.

---

## 🛠️ Visão Geral da Pilha de Tecnologias

Antes de explorar os diretórios, é útil saber quais tecnologias sustentam cada camada. A tabela abaixo resume as principais dependências e seus respectivos papéis dentro do projeto:

| Camada | Tecnologia | Pacote | Propósito |
|--------|------------|--------|-----------|
| **Estrutura** | Next.js 16 (App Router) | `next@16.1.6` | Componentes do servidor, roteamento, ações do servidor |
| **Kit de UI** | shadcn/ui (base-nova) | `shadcn@4.8.0` | Primitivas acessíveis pré-construídas (Botão, Diálogo, Select...) |
| **Estilização** | Tailwind CSS v4 | `tailwindcss@4.2.0` | CSS utilitário com variáveis CSS para temas |
| **Gráficos** | Recharts v3 | `recharts@3.8.1` | Gráficos de área/barras na página do dashboard |
| **ORM** | Prisma 6.4 | `prisma@6.4.1` / `@prisma/client@6.4.1` | Consultas PostgreSQL com segurança de tipos |
| **Ícones** | Heroicons + Lucide | `@heroicons/react@2.2.0` / `lucide-react@1.16.0` | Ícones de navegação e microícones da UI |
| **Autenticação** | bcryptjs + cookies | `bcryptjs@3.0.3` | Criptografia de senha; token de sessão baseado em cookie |
| **PWA** | next-pwa | `@ducanh2912/next-pwa@10.2.9` | Geração de service worker e prompt de instalação |
| **Notificações** | Sonner | `sonner@2.0.7` | Notificações pop-up para feedback do usuário |
| **Tema** | next-themes | `next-themes@0.4.6` | Alternar entre temas claro/escuro/sistema |
| **Runtime** | React 19 | `react@19.2.4` / `react-dom@19.2.4` | Renderização simultânea, suporte a RSC |
| **Gerenciador de Pacotes** | pnpm | `pnpm-lock.yaml` | Gerenciamento de dependências rápido e eficiente |

> **Fontes:** `package.json`, `components.json`, `next.config.mjs`

---

## 🗂️ Mapa de Diretório Visual

```
📦 sistema-de-requisicao/
│
├── 📁 app/                          # Rotas e Ações do Servidor
│   ├── 📄 layout.tsx               # Layout raiz (ThemeProvider, StoreProvider, Toaster)
│   ├── 📄 page.tsx                 # Redireciona para /login
│   │
│   ├── 📁 login/
│   │   └── 📄 page.tsx            # Página de autenticação (Server Component)
│   │
│   ├── 📁 dashboard/
│   │   └── 📄 page.tsx            # KPIs, gráficos (Client Component)
│   │
│   ├── 📁 requisicao/
│   │   └── 📄 page.tsx            # Criação de requisições
│   │
│   ├── 📁 historico/
│   │   └── 📄 page.tsx            # Histórico com calendário
│   │
│   ├── 📁 admin/
│   │   └── 📄 page.tsx            # CRUD de Setores e Itens
│   │
│   ├── 📁 relatorios/
│   │   └── 📄 page.tsx            # Relatórios com pré-visualização A4
│   │
│   └── 📁 actions/                # Server Actions
│       ├── 📄 auth.ts            # Autenticação (login, logout, sessão)
│       ├── 📄 itens.ts           # CRUD de itens + importação CSV
│       ├── 📄 requisicoes.ts     # Ciclo de vida das requisições
│       └── 📄 setores.ts         # CRUD de setores
│
├── 📁 components/                  # Componentes Compartilhados
│   ├── 📄 app-shell.tsx           # Layout principal (sidebar + header)
│   ├── 📄 sidebar.tsx            # Navegação e logout
│   ├── 📄 auth-form.tsx          # Formulário de login + PWA
│   ├── 📄 csv-importer.tsx       # Importação de arquivos CSV
│   ├── 📄 setores-admin.tsx      # Tabela CRUD de setores
│   ├── 📄 status-badge.tsx       # Badges de status
│   ├── 📄 pwa-updater.tsx        # Verificador de atualizações PWA
│   ├── 📄 theme-provider.tsx     # Provider de tema
│   ├── 📄 theme-toggle.tsx       # Botão claro/escuro
│   │
│   └── 📁 ui/                    # Primitivas shadcn/ui
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── pagination.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sonner.tsx
│       └── table.tsx
│
├── 📁 lib/                         # Utilitários e Serviços
│   ├── 📄 prisma.ts              # Singleton do PrismaClient
│   ├── 📄 store.tsx              # Context Store (legado)
│   ├── 📄 types.ts               # Definições de tipos TypeScript
│   ├── 📄 seed-data.ts           # Dados mock para desenvolvimento
│   └── 📄 utils.ts               # Função cn() para classes CSS
│
├── 📁 prisma/                      # Banco de Dados
│   └── 📄 schema.prisma          # Schema com 6 modelos
│
├── 📁 public/                      # Recursos Estáticos
│   ├── 📄 manifest.json          # Manifesto PWA
│   ├── 📄 sw.js                  # Service Worker
│   ├── 📄 workbox-*.js           # Biblioteca Workbox
│   └── 🖼️ favicon-*.png          # Ícones e favicons
│
└── ⚙️ Arquivos de Configuração
    ├── 📄 next.config.mjs        # Configuração Next.js + PWA
    ├── 📄 tsconfig.json          # Configuração TypeScript
    ├── 📄 components.json        # Configuração shadcn/ui
    ├── 📄 postcss.config.mjs     # Pipeline PostCSS
    ├── 📄 global.d.ts            # Declarações globais TS
    ├── 📄 pnpm-workspace.yaml    # Workspace pnpm
    └── 📄 proxy.ts               # Proxy de desenvolvimento
```

---

## 📱 O Diretório `app/` - Rotas e Ações do Servidor

O diretório `app/` é o núcleo do projeto, seguindo as convenções do Next.js App Router. Cada subdiretório que contém um `page.tsx` torna-se uma rota, e as subpastas `_components/` armazenam componentes locais da página (o prefixo underscore indica ao Next.js que não os trate como rotas).

### 🗺️ Rotas da Aplicação

| Rota | Arquivo | Renderização | Propósito |
|------|---------|-------------|-----------|
| `/` | `app/page.tsx` | Servidor | Redireciona imediatamente para `/login` |
| `/login` | `app/login/page.tsx` | Servidor | Renderiza `AuthForm` - senha + prompt PWA |
| `/dashboard` | `app/dashboard/page.tsx` | Cliente | Cartões de KPIs, gráficos via Recharts |
| `/requisicao` | `app/requisicao/page.tsx` | Cliente | Criação de requisição: setor → itens → carrinho |
| `/historico` | `app/historico/page.tsx` | Cliente | Histórico com calendário, exportação CSV/PDF |
| `/admin` | `app/admin/page.tsx` | Cliente | CRUD com abas para Setores e Itens |
| `/relatorios` | `app/relatorios/page.tsx` | Cliente | Relatórios com pré-visualização A4 |

### 📐 Layout Raiz

O layout raiz em `app/layout.tsx` envolve cada página com:
- `ThemeProvider` (next-themes)
- `StoreProvider` (Context API legado)
- `PWAUpdater`
- `Toaster` (Sonner)

Também carrega a fonte **Geist** e define o idioma como **português** (`lang="pt-BR"`).

> **Nota:** Todas as páginas exceto `/login` e o redirecionamento raiz são marcadas com `"use client"` — dependem do estado do navegador e invocam ações do servidor assíncronamente.

---

## ⚡ Ações do Servidor - A Ponte da Camada de Dados

Dentro de `app/actions/` encontram-se quatro módulos TypeScript marcados com `"use server"`. São **Server Actions** do Next.js — funções executadas exclusivamente no servidor, acessíveis a partir de componentes cliente.

| Módulo | Principais Exportações | Responsabilidade |
|--------|----------------------|------------------|
| **`auth.ts`** | `loginComSenha`, `logout`, `getUsuarioAtual`, `getDbStorageUsage` | Autenticação via bcrypt + cookies; monitor de armazenamento |
| **`itens.ts`** | `getItems`, `createItem`, `updateItem`, `deleteItem`, `deleteAllItems`, `bulkImportData` | CRUD de itens com soft-delete e importação CSV |
| **`requisicoes.ts`** | `createRequisition`, `getRequisitions`, `updateRequisitionStatus`, `deleteRequisition`, `deleteRequisitionItem` | Ciclo de vida da requisição: criação, fusão, transições |
| **`setores.ts`** | `getSectors`, `createSector`, `updateSector`, `deleteSector` | CRUD de setores (exclusão permanente) |

> 💡 Toda ação que modifica dados usa `revalidatePath()` para invalidar o cache do Next.js, garantindo UI atualizada sem reload completo.

---

## 🧩 O Diretório `components/` - Camada de UI Compartilhada

### 🎨 Componentes do Aplicativo

| Componente | Renderização | Função |
|-----------|-------------|--------|
| **`app-shell.tsx`** | Cliente | Layout básico: sidebar + header com título e toggle de tema |
| **`sidebar.tsx`** | Cliente | Links de navegação, avatar, modal de armazenamento, logout |
| **`auth-form.tsx`** | Cliente | Input de senha, banner PWA, login → redirect `/dashboard` |
| **`csv-importer.tsx`** | Cliente | Seletor de arquivo → Papa Parse → validação → `bulkImportData` |
| **`setores-admin.tsx`** | Cliente | Tabela CRUD de setores (aba `/admin`) |
| **`status-badge.tsx`** | Cliente | Badges coloridos para status das requisições |
| **`pwa-updater.tsx`** | Cliente | Verifica atualizações do service worker |
| **`theme-provider.tsx`** | Cliente | Wrapper do `ThemeProvider` (next-themes) |
| **`theme-toggle.tsx`** | Cliente | Botão Sol/Lua para alternar tema |

### 🎛️ Primitivas shadcn/ui (`components/ui/`)

Componentes não modificados seguindo o estilo `base-nova`:

`badge` · `button` · `card` · `checkbox` · `dialog` · `input` · `label` · `pagination` · `select` · `separator` · `sonner` · `table`

---

## 🔧 O Diretório `lib/` - Serviços e Estado do Cliente

| Módulo | Função |
|--------|--------|
| **`prisma.ts`** | Singleton do PrismaClient - evita exaustão do pool de conexões |
| **`store.tsx`** | Context Store legado com dados mock (substituído por Server Actions) |
| **`types.ts`** | Definições de tipo: `User`, `Sector`, `Item`, `Requisition`, `RequisitionItem` + enums |
| **`seed-data.ts`** | Dados mock para desenvolvimento |
| **`utils.ts`** | Helper `cn()` (clsx + tailwind-merge) para classes condicionais |

> ⚠️ **Nota sobre o Store:** O `StoreProvider` de `lib/store.tsx` é um artefato legado do mecanismo de estado original. As páginas de produção agora usam Server Actions diretamente, mas o provider ainda envolve a aplicação no layout raiz.

---

## 🗄️ O Diretório `prisma/` - Esquema do Banco de Dados

O arquivo `prisma/schema.prisma` define **6 modelos** com PostgreSQL (plano gratuito Neon, 512 MB limite):

| Modelo | Campos-chave | Relacionamentos |
|--------|-------------|-----------------|
| **`Store`** | `id`, `name`, `cnpj` (único) | Possui: Users, Sectors, Items, Requisitions |
| **`User`** | `name`, `email` (único), `password`, `role` (enum) | Pertence a Store |
| **`Sector`** | `code` (único), `name` | Pertence a Store; tem muitos Items e Requisitions |
| **`Item`** | `code` (único), `name`, `unit`, `cost?`, `isActive` | Pertence a Store; vinculado a Sectors (N:M) |
| **`Requisition`** | `status` (default "CONCLUIDA"), `createdAt` | Pertence a Store e Sector; tem muitos RequisitionItems |
| **`RequisitionItem`** | `quantity` (Float) | Pertence a Requisition (cascade delete) e Item |

> 💡 O campo `isActive` em `Item` implementa **soft-delete** — itens nunca são removidos, apenas ocultados, podendo ser recuperados via reimportação.

---

## 🌐 O Diretório `public/` - PWA e Recursos Estáticos

| Arquivo | Propósito |
|---------|-----------|
| **`manifest.json`** | Manifesto PWA: nome, ícones, URL inicial, modo display |
| **`sw.js`** | Service Worker gerado (next-pwa) |
| **`workbox-*.js`** | Biblioteca runtime Workbox |
| **`favicon.ico`** | Favicon principal |
| **`favicon-*.png`** | Favicons multi-resolução |
| **`android-chrome-*.png`** | Ícones Android |
| **`apple-touch-icon.png`** | Ícone iOS |

---

## ⚙️ Arquivos de Configuração (Raiz)

| Arquivo | Função |
|---------|--------|
| **`next.config.mjs`** | Plugin PWA, React strict mode, bypass erros TS |
| **`tsconfig.json`** | Target ES6, module resolution bundler, alias `@/*`, strict mode |
| **`components.json`** | Config shadcn/ui: estilo `base-nova`, RSC ativo, CSS variables |
| **`postcss.config.mjs`** | Pipeline PostCSS com `@tailwindcss/postcss` |
| **`global.d.ts`** | Declarações globais TypeScript (ex: `BeforeInstallPromptEvent`) |
| **`pnpm-workspace.yaml`** | Configuração do workspace pnpm |
| **`proxy.ts`** | Proxy de desenvolvimento para conexões DB |

---

## 🚀 Fluxo de Desenvolvimento

1. **Desenvolvimento local:** `pnpm dev`
2. **Build de produção:** `pnpm build`
3. **Gerenciar banco:** `npx prisma studio`
4. **Migrações:** `npx prisma migrate dev`

---

## 📚 Referências

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org)

---

> **Última atualização:** 2026  
> **Versão do projeto:** 1.0.0
