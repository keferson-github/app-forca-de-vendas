import Link from "next/link";
import { IconExternalLink, IconPlugConnected, IconWebhook } from "@tabler/icons-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBlingRedirectUri, getBlingWebhookUrl } from "@/lib/bling";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  bling?: string;
}>;

function formatDate(date?: Date | null) {
  if (!date) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function BlingIntegrationPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [connection, eventCount, lastEvent] = await prisma.$transaction([
    prisma.blingConnection.findUnique({
      where: { userId: session.user.id },
      select: {
        companyId: true,
        connectedAt: true,
        updatedAt: true,
        expiresAt: true,
        scope: true,
      },
    }),
    prisma.blingWebhookEvent.count({
      where: { userId: session.user.id },
    }),
    prisma.blingWebhookEvent.findFirst({
      where: { userId: session.user.id },
      orderBy: { receivedAt: "desc" },
      select: {
        event: true,
        receivedAt: true,
      },
    }),
  ]);

  const isConnected = Boolean(connection);
  const redirectUri = getBlingRedirectUri();
  const webhookUrl = getBlingWebhookUrl();

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integracao Bling</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Conexao OAuth 2.0 com API v3 e recebimento de webhooks assinados.
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "outline"} className="w-fit">
          {isConnected ? "Conectado" : "Nao conectado"}
        </Badge>
      </div>

      {searchParams.bling === "success" ? (
        <div className="rounded-md border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          Bling conectado com sucesso.
        </div>
      ) : null}

      {searchParams.bling === "error" ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Nao foi possivel concluir a autorizacao do Bling. Gere um novo acesso e tente novamente.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPlugConnected className="size-5" />
              API OAuth
            </CardTitle>
            <CardDescription>
              Use o botao para autorizar este sistema na conta Bling.
            </CardDescription>
            <CardAction>
              <Button asChild size="sm">
                <Link href="/api/bling/oauth/start">
                  <IconExternalLink />
                  Conectar
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <div className="font-medium">URL de redirecionamento</div>
              <code className="mt-1 block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">
                {redirectUri}
              </code>
            </div>
            <div className="grid gap-1 text-muted-foreground">
              <div>Conectado em: {formatDate(connection?.connectedAt)}</div>
              <div>Empresa Bling: {connection?.companyId ?? "Nao identificada"}</div>
              <div>Atualizado em: {formatDate(connection?.updatedAt)}</div>
              <div>Expira em: {formatDate(connection?.expiresAt)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWebhook className="size-5" />
              Webhook
            </CardTitle>
            <CardDescription>
              Cadastre esta URL na aba Webhooks do aplicativo no Bling.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div>
              <div className="font-medium">URL do servidor</div>
              <code className="mt-1 block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">
                {webhookUrl}
              </code>
            </div>
            <div className="grid gap-1 text-muted-foreground">
              <div>Eventos recebidos: {eventCount}</div>
              <div>
                Ultimo evento:{" "}
                {lastEvent
                  ? `${lastEvent.event} em ${formatDate(lastEvent.receivedAt)}`
                  : "Nenhum evento recebido"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuracao no Bling</CardTitle>
          <CardDescription>
            O aplicativo cadastrado no Bling deve ter os escopos dos recursos usados pelo sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>
            No Bling, informe a URL de redirecionamento acima no cadastro do aplicativo.
            Depois, na aba Webhooks, adicione a URL do servidor e marque os recursos e
            acoes que este sistema deve receber.
          </p>
          <p>
            O endpoint de webhook valida o cabecalho X-Bling-Signature-256 e grava cada
            eventId uma unica vez para suportar retentativas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
