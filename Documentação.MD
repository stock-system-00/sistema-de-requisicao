
# 🏪 Reqi - Documentação do Projeto

> **Sistema de Requisição Digital** para operações internas de suprimentos no varejo e serviços de alimentação

---

## 📖 Visão Geral

**Reqi** é um aplicativo Next.js completo que transforma a maneira como as equipes de loja solicitam, rastreiam e geram relatórios sobre a entrada de materiais. Este documento fornece o **mapa conceitual do sistema** antes do início do desenvolvimento de código.

O sistema substitui os fluxos de trabalho de requisição em papel por um **PWA baseado em navegador** que lida com tudo, desde solicitações de itens por setor até exportações CSV prontas para ERP e relatórios executivos com visualização para impressão.

---

### 🎯 O que a Reqi faz

O Reqi resolve um problema operacional concreto: **como as equipes de loja requisitam suprimentos em vários setores e rastreiam essas solicitações desde a criação até a entrega.**

O fluxo de trabalho principal é simples:

```
Usuário → Seleciona Setor → Adiciona Itens com Quantidades → Envia Requisição
```

Porém, por trás dessa simplicidade, o sistema implementa **comportamentos inteligentes** que refletem restrições do mundo real:

- 🔄 **Mesclagem automática:** Requisições para o mesmo setor e dia são mescladas automaticamente (os itens acumulam quantidades em vez de criar duplicatas)
- 🗑️ **Soft-delete inteligente:** Itens podem ser "excluídos temporariamente" e posteriormente recuperados sem perda de dados
- 🌍 **Suporte multilíngue:** Importações de CSV lidam com formatos de delimitadores em português e inglês de forma transparente

### ✨ Funcionalidades Além da Criação de Requisições

- 📊 **Painel de controle** com KPIs de consumo
- 📅 **Histórico completo** com transições de status e exportação para CSV
- 📄 **Gerador de relatórios executivos** que renderiza visualizações de impressão prontas para A4 com blocos de conteúdo configuráveis

---

## 🛠️ Conjunto de Tecnologias

A arquitetura é **intencionalmente minimalista** — cada dependência tem uma função específica e não há camadas redundantes.

| Camada | Tecnologia | Propósito |
|--------|------------|-----------|
| **Estrutura** | Next.js 16 (App Router) | Páginas renderizadas pelo servidor, ações do servidor, roteamento |
| **Linguagem** | TypeScript 5.7 | Segurança de tipos em todo o código do servidor e do cliente |
| **Banco de Dados** | PostgreSQL (Neon Tech) | Armazenamento relacional hospedado com 512 MB de espaço gratuito |
| **ORM** | Prisma 6.4 | Modelagem de esquemas, migrações, construtor de consultas |
| **Componentes UI** | shadcn/ui + Radix/UI Base | Primitivos acessíveis com estilo Tailwind |
| **Estilização** | Tailwind CSS 4 | Sistema de design com foco na utilidade |
| **Gráficos** | Recharts 3.8 | Gráficos de área/barras e visualizações de KPIs |
| **Autenticação** | bcryptjs | Hashing e comparação de senhas |
| **PWA** | @ducanh2912/next-pwa | Cache offline, registro de service worker |
| **Notificações** | Sonner | Notificações pop-up para feedback do usuário |
| **Gerenciador de Pacotes** | pnpm | Gerenciamento de dependências rápido e eficiente |

> ⚠️ **Nota sobre Next.js 16:** O projeto utiliza Next.js 16, que renomeou "Middleware" para "Proxy". O mecanismo de autenticação reside em `proxy.ts` (e não em `middleware.ts`). A função exportada deve ter o nome `proxy`; misturar os dois arquivos causa comportamento indefinido.

---

## 🏗️ Arquitetura de Alto Nível

Antes de examinar arquivos individuais, é essencial entender como os dados fluem pelo sistema.

### 📊 Diagrama de Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ /login   │  │/dashboard│  │/requisicao│ │ /historico │ │
│  └────┬─────┘  └────┬─────┘  └────┬──────┘  └─────┬──────┘ │
│       │             │             │               │         │
│       └─────────────┴─────────────┴───────────────┘         │
│                          │                                   │
│              Server Actions (app/actions/)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Proxy     │ ← Verifica session_token
                    │  (proxy.ts) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Prisma    │
                    │   ORM       │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ PostgreSQL  │
                    │  (Neon)     │
                    └─────────────┘
```

### 🔐 Fluxo de Autenticação

A camada **Proxy** (middleware renomeado do Next.js 16) intercepta todas as requisições de rotas protegidas:

1. Verifica o cookie `session_token`
2. **Usuários não autenticados** → Redireciona para `/login`
3. **Usuários autenticados** → Redireciona para fora de `/login`

> 💡 **Vantagem:** Nenhum componente da página precisa verificar manualmente o estado de autenticação — a proteção ocorre antes mesmo da página ser carregada.

### 🔗 Ponte Servidor-Cliente

O Reqi segue a convenção do Next.js App Router:
- Diretórios de rotas (`app/`) são mapeados para URLs
- Toda lógica de negócios reside em **Ações do Servidor** (`app/actions/`)
- **Não há manipuladores de rotas de API separados**
- Componentes cliente chamam ações do servidor diretamente via ponte React
- Prisma lida com todas as interações com o banco de dados no lado do servidor

---

## 🗺️ Rotas Principais do Aplicativo

O projeto está organizado como um conjunto de **páginas funcionais distintas**, cada uma abordando uma necessidade operacional específica.

| Rota | Propósito | Principais Características |
|------|-----------|---------------------------|
| 🔐 **`/login`** | Ponto de entrada de autenticação | • Login com senha<br>• Redireciona usuários autenticados para `/dashboard` |
| 📊 **`/dashboard`** | Visão geral operacional | • Cartões de KPIs<br>• Gráficos de consumo por setor<br>• Filtragem por período (7/15/30/60/90 dias) |
| 📝 **`/requisicao`** | Criação de requisição | • Seleção de setor<br>• Seletor de itens com quantidades<br>• Flexibilidade de datas |
| 📅 **`/historico`** | Histórico de requisições | • Transições de status (ABERTA → CONCLUIDA)<br>• Edição em linha<br>• Exportação para CSV |
| ⚙️ **`/admin`** | Gestão de dados | • CRUD de itens com exclusão lógica<br>• Gerenciamento de setores<br>• Importação em massa de CSV |
| 📄 **`/relatorios`** | Relatórios executivos | • Pré-visualização de impressão A4<br>• Blocos configuráveis (custos, gráficos, tabelas, assinaturas) |

### 🔀 Fluxo de Navegação

```
/ (raiz)
  │
  └─→ /login (página inicial para não autenticados)
        │
        └─→ AppShell (wrapper para páginas autenticadas)
              │
              ├─→ /dashboard
              ├─→ /requisicao
              ├─→ /historico
              ├─→ /admin
              └─→ /relatorios
```

> 📌 O caminho raiz `/` redireciona imediatamente para `/login`, estabelecendo a autenticação como o primeiro passo obrigatório. Após o login, o componente `AppShell` envolve cada página autenticada com uma **barra lateral** e um **cabeçalho responsivos**, proporcionando navegação consistente em todas as rotas.

**Fontes:** `app/page.tsx`, `components/app-shell.tsx`, `components/sidebar.tsx`

---

## 🗄️ Resumo do Modelo de Dados

O esquema Prisma do Reqi modela uma **arquitetura de múltiplos armazenamentos**, embora a implementação atual opere com um único armazenamento padrão resolvido via `findFirst()`.

### 📐 Diagrama de Relacionamentos

```
┌──────────┐
│   Loja   │ (Store)
│ (Store)  │
└────┬─────┘
     │
     ├──────────┐
     │          │
┌────▼─────┐  ┌▼──────────┐
│ Usuário  │  │   Setor   │
│  (User)  │  │ (Sector)  │
└──────────┘  └─────┬─────┘
                    │
          ┌─────────┼─────────┐
          │         │         │
     ┌────▼───┐ ┌──▼────┐ ┌──▼──────────┐
     │  Item  │ │Requis.│ │ Requis. Item │
     │ (Item) │ │(Req.) │ │  (Req. Item) │
     └────────┘ └───┬───┘ └──────┬───────┘
                    │            │
                    └────────────┘
```

### 🔑 Hierarquia de Relacionamentos

- Uma **Loja** possui → Usuários, Setores, Itens, Requisições
- **Setores** agrupam → Itens e Requisições
- Uma **Requisição** se conecta aos Itens → através da tabela `RequisitionItem` (armazena quantidades)

### 📋 Detalhamento dos Modelos

| Modelo | Campos-chave | Relacionamentos | Comportamento Especial |
|--------|-------------|-----------------|----------------------|
| 🏪 **Loja** (Store) | `name`, `cnpj` | Possui todos os outros modelos | Implantação em loja única via `findFirst()` |
| 👤 **Usuário** (User) | `name`, `email`, `password`, `role` | Pertence à Loja | Funções: `ADMIN`, `REPOSITOR`, `ESTOQUISTA` |
| 🏷️ **Setor** (Sector) | `code`, `name` | Pertence à Loja, possui Itens e Requisições | `code` é **único** em todo o sistema |
| 📦 **Item** | `code`, `name`, `unit`, `cost`, `isActive` | Pertence à Loja, vinculado aos Setores | **Soft-delete** via `isActive: false` |
| 📝 **Requisição** (Requisition) | `status`, `createdAt` | Pertence à Loja e ao Setor, possui Itens de Requisição | Status: `"ABERTA"` ou `"CONCLUIDA"` |
| 📎 **Item de Requisição** (RequisitionItem) | `quantity` | Vincula Requisição ao Item | **Cascade delete** com requisição principal |

### 🔄 Padrão de Soft-Delete

```
┌─────────────────────────────────────────────────────┐
│                  CICLO DE VIDA DO ITEM               │
│                                                      │
│  Criado ──→ isActive: true ──→ Em uso               │
│     │                                                 │
│     └────→ isActive: false ──→ "Excluído"            │
│                                    │                  │
│                                    └──→ Reimportado   │
│                                         ou Recriado   │
│                                            │          │
│                                            └──→ isActive: true
│                                                 (Recuperado)
└─────────────────────────────────────────────────────┘
```

> 💡 **Vantagem do Soft-Delete:** O padrão de exclusão lógica via `isActive: boolean` significa que itens excluídos permanecem no banco de dados e podem ser recuperados quando reimportados ou recriados — uma escolha de design crítica que **evita a perda de dados** durante operações em massa.

### ⚠️ Nota sobre Multi-tenant

A função auxiliar `getDefaultStoreId()` aparece em várias Ações do Servidor e sempre utiliza `findFirst()` — este é um atalho intencional para um **único locatário**. 

> 🔄 **Ponto de refatoração:** Caso seja necessário suporte a múltiplas lojas, esta função será o principal ponto de refatoração.

---

## 🔐 Sistema de Autenticação

### Fluxo de Login

```
Usuário → Digita Senha → bcrypt.compare()
                │
                ├─→ Senha correta? → Cria session_token (cookie)
                │                      └─→ Redireciona para /dashboard
                │
                └─→ Senha incorreta? → Mensagem de erro
```

### Verificação de Sessão (Proxy)

```
Requisição → proxy.ts
              │
              ├─→ session_token existe? ──→ Sim → Permite acesso
              │
              └─→ session_token ausente? → Redireciona para /login
```

---

## 📦 Ações do Servidor (Server Actions)

As ações do servidor são o **coração da lógica de negócios** do Reqi. Elas residem em `app/actions/` e são marcadas com `"use server"`.

| Arquivo | Responsabilidade | Principais Funções |
|---------|-----------------|-------------------|
| **`auth.ts`** | Autenticação e sessão | `loginComSenha`, `logout`, `getUsuarioAtual` |
| **`itens.ts`** | Gestão de itens | `getItems`, `createItem`, `updateItem`, `deleteItem`, `bulkImportData` |
| **`requisicoes.ts`** | Ciclo de vida das requisições | `createRequisition`, `getRequisitions`, `updateRequisitionStatus`, `deleteRequisition` |
| **`setores.ts`** | Gestão de setores | `getSectors`, `createSector`, `updateSector`, `deleteSector` |

---

## 🚀 Funcionalidades-Chave

### 🔄 Mesclagem Inteligente de Requisições
Quando um usuário cria uma requisição para o **mesmo setor no mesmo dia**, o sistema:
1. Verifica se já existe requisição para aquele setor/data
2. Se existe → Adiciona itens à requisição existente (acumula quantidades)
3. Se não existe → Cria nova requisição

### 🗑️ Soft-Delete de Itens
- Itens "excluídos" recebem `isActive: false`
- Permanecem no banco de dados
- Recuperáveis via reimportação ou recriação
- Mantém integridade referencial com requisições históricas

### 📥 Importação CSV
- Suporta delimitadores em português (`,`) e inglês (`.`)
- Validação de dados antes da importação
- Feedback detalhado de erros

---

## 📚 Referências Técnicas

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Recharts Documentation](https://recharts.org)
- [Neon Tech PostgreSQL](https://neon.tech)

---

> 📌 **Última atualização:** Julho 2026  
> 🏪 **Projeto:** Reqi - Sistema de Requisição Digital  
> 📋 **Versão da documentação:** 1.0.0
