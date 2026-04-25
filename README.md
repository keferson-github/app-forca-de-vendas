This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Integracao Bling

Configure as variaveis abaixo no ambiente:

```bash
BLING_CLIENT_ID="..."
BLING_CLIENT_SECRET="..."
BLING_APP_URL="https://seu-dominio.com.br"
BLING_REDIRECT_URI="https://seu-dominio.com.br/api/bling/oauth/callback"
```

No cadastro do aplicativo Bling, use a URL de redirecionamento acima. Na aba
Webhooks, cadastre `https://seu-dominio.com.br/api/bling/webhook` como servidor
e habilite os recursos desejados com seus respectivos escopos.

A tela protegida `/integracoes/bling` inicia o fluxo OAuth e mostra as URLs
necessarias para configurar o aplicativo no Bling.

## Padrao de notificacoes toast

Para manter consistencia visual e de comportamento, o projeto usa um unico padrao para toast:

- Disparo de notificacao: `appToast` em `lib/toast.ts`
- Toaster global: `AppToaster` em `components/shared/app-toaster.tsx`
- Notices por query param (`?notice=`): `useNoticeToast` em `hooks/use-notice-toast.ts`

Regras de lint foram adicionadas para impedir novos imports diretos de `sonner` e de `components/ui/sonner` fora dos wrappers oficiais.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
