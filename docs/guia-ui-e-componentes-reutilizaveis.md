# Guia de UI e Componentes Reutilizaveis

## Objetivo

Este documento centraliza os padroes de UI do projeto para servir como fonte oficial em futuras implementacoes (novas paginas, novos fluxos e ajustes visuais).

Escopo principal:

- Componentes reutilizaveis de tabela e paginacao
- Padrao de notificacoes toast
- Estrutura de pagina sem analytics de topo
- Design system (tokens, paleta, tipografia, tema e estilo visual)

## Stack de UI

- Framework: Next.js (App Router)
- UI primitives: shadcn/ui
- Estilo base do shadcn: `new-york`
- Base de cor do shadcn: `neutral`
- Icones: `lucide-react`
- Theming: `next-themes`
- CSS utilitario: Tailwind CSS v4 + CSS variables

Arquivos de referencia:

- `components.json`
- `app/globals.css`
- `app/layout.tsx`
- `components/theme-provider.tsx`

## Design System do Projeto

### Tipografia

- Fonte principal: Geist Sans (`--font-geist-sans`)
- Fonte mono: Geist Mono (`--font-geist-mono`)
- Aplicacao global: `app/layout.tsx` no elemento `<html>`

### Radius e bordas

- Radius base: `--radius: 0.9rem`
- Variantes: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`
- Borda global via token `--border`

### Tokens de cor (light)

Definidos em `app/globals.css` (segmento `:root`):

- `--background: #f6f6f8`
- `--foreground: #131419`
- `--card: #ffffff`
- `--card-foreground: #131419`
- `--popover: #ffffff`
- `--popover-foreground: #131419`
- `--secondary: #eff1f5`
- `--secondary-foreground: #171717`
- `--muted: #eff1f5`
- `--muted-foreground: #666f80`
- `--accent: #eff1f5`
- `--accent-foreground: #171717`
- `--destructive: #dc2626`
- `--border: #e6e8ed`
- `--input: #eceef3`
- `--primary: #171717`
- `--primary-foreground: #fafafa`
- `--ring: #171717`

Charts:

- `--chart-1: #171717`
- `--chart-2: #2563eb`
- `--chart-3: #64748b`
- `--chart-4: #0f766e`
- `--chart-5: #b45309`

### Tokens de cor (dark)

Definidos em `app/globals.css` (segmento `.dark`):

- `--background: #09090b`
- `--foreground: #fafafa`
- `--card: #111113`
- `--card-foreground: #fafafa`
- `--popover: #111113`
- `--popover-foreground: #fafafa`
- `--secondary: #1f2937`
- `--secondary-foreground: #fafafa`
- `--muted: #1f2937`
- `--muted-foreground: #a1a1aa`
- `--accent: #27272a`
- `--accent-foreground: #fafafa`
- `--destructive: #ef4444`
- `--border: rgba(255, 255, 255, 0.1)`
- `--input: rgba(255, 255, 255, 0.14)`
- `--primary: #fafafa`
- `--primary-foreground: #171717`
- `--ring: #d4d4d8`

### Tema

- `ThemeProvider` com `defaultTheme="light"`
- `enableSystem={false}` (tema do sistema nao sobrepoe o padrao)
- Toaster global montado em `app/layout.tsx` via `AppToaster`

## Componentes Reutilizaveis de Tabela

### 1) `DataTable`

Arquivo: `components/shared/data-table.tsx`

Responsabilidade:

- Estrutura desktop de tabela reutilizavel
- Cabecalho dinamico por colunas
- Renderizacao de linha via callback
- Rodape opcional

API principal:

- `columns`: definicao das colunas
- `data`: itens
- `getRowKey`: chave da linha
- `renderRow`: renderer de celulas
- `footer`: opcional

Paginas que usam:

- `components/produtos/products-page-client.tsx`
- `components/clientes/customers-page-client.tsx`
- `components/pedidos/orders-page-client.tsx`

### 2) `TablePagination`

Arquivo: `components/shared/table-pagination.tsx`

Responsabilidade:

- Navegacao paginada padronizada
- Preservacao de query params
- Exibicao de range atual (ex.: Mostrando 1-12 de 35)
- Ellipsis para listas grandes

Paginas que usam:

- `components/produtos/products-page-client.tsx`
- `components/clientes/customers-page-client.tsx`
- `components/pedidos/orders-page-client.tsx`

## Padrao de Notificacoes Toast (Reutilizavel)

### Arquitetura

1. `components/ui/sonner.tsx`
- Define o componente visual do toaster
- Centraliza estilo, icones, `richColors`, `closeButton`, `position`

2. `components/shared/app-toaster.tsx`
- Wrapper unico para montar toaster no layout

3. `lib/toast.ts`
- API unica para disparar notificacoes (`appToast`)
- Metodos: `message`, `success`, `error`, `info`, `warning`, `loading`, `dismiss`, `promise`

4. `hooks/use-notice-toast.ts`
- Hook para mapear query param (`notice`) em notificacoes

### Regra de uso obrigatoria

- Em componentes de pagina: usar `appToast` (ou `useNoticeToast` quando for notice em URL)
- Nao importar `sonner` diretamente fora dos wrappers oficiais

### Enforcement por lint

Arquivo: `eslint.config.mjs`

- `no-restricted-imports` bloqueia imports diretos de:
  - `sonner`
  - `@/components/ui/sonner`
  - `@/components/ui/toaster`
- Excecoes apenas para arquivos de infra de toast:
  - `lib/toast.ts`
  - `components/ui/sonner.tsx`
  - `components/shared/app-toaster.tsx`
  - `components/ui/toaster.tsx`

## Atualizacao de Estrutura das Paginas (Sem Analytics no Topo)

Os cards de analytics no topo das paginas de listagem foram removidos.

Paginas impactadas:

- `/clientes`
- `/produtos`
- `/pedidos`
- `/transportadoras`

Novo padrao de estrutura de pagina:

1. Cabecalho da pagina
- Titulo
- Descricao
- Acoes (ex.: botao Novo)

2. Bloco principal
- Filtros/busca
- Conteudo principal (tabela/lista)
- Paginacao

### Regra para futuras paginas

- Nao usar bloco KPI no topo no formato de grid com 3 cards
- Nao reutilizar os rotulos antigos de KPI rapido

### Enforcement por lint

`eslint.config.mjs` contem `no-restricted-syntax` para bloquear:

- `className="grid gap-3 md:grid-cols-3"`
- Literais descontinuados:
  - `Total cadastrado`
  - `Com imagem`
  - `Itens vinculados`
  - `Confirmados`
  - `Cancelados`
  - `Com contato`
  - `Com telefone`

## Checklist para Novas Paginas

Sempre validar os itens abaixo ao criar novas features:

1. Estrutura de pagina
- [ ] Sem cards de analytics no topo
- [ ] Cabecalho + filtros + conteudo principal

2. Tabela/listagem
- [ ] Usar `DataTable` quando houver listagem desktop
- [ ] Usar `TablePagination` para pagina principal com volume

3. Toast
- [ ] Usar `appToast` para feedback de acao
- [ ] Usar `useNoticeToast` quando o fluxo vier por query param
- [ ] Nao importar `sonner` diretamente em paginas/feature components

4. UI consistency
- [ ] Usar tokens (`bg-background`, `text-foreground`, etc.)
- [ ] Evitar hardcode de cor fora dos tokens do design system
- [ ] Respeitar tema light/dark ja configurado

## Template recomendado para paginas de listagem

```tsx
<div className="flex flex-col gap-4 p-4 lg:p-6">
  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
    {/* titulo, descricao, acoes */}
  </div>

  <Card className="border-transparent shadow-sm">
    <CardHeader className="gap-4">
      {/* filtros */}
    </CardHeader>

    <CardContent>
      {/* DataTable / lista */}
      {/* TablePagination */}
    </CardContent>
  </Card>
</div>
```

## Manutencao

Sempre que houver alteracao relevante em:

- tokens de cor
- padrao de tabela/paginacao
- padrao de toast
- estrutura de pagina

atualize este arquivo para manter a documentacao como fonte oficial para desenvolvimento futuro.
