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
    return "Não informado";
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
          <h1 className="text-2xl font-semibold tracking-tight">Integração Bling</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Conexão OAuth 2.0 com API v3 e recebimento de webhooks assinados.
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "outline"} className="w-fit">
          {isConnected ? "Conectado" : "Não conectado"}
        </Badge>
      </div>

      {searchParams.bling === "success" ? (
        <div className="rounded-md bg-green-600/10 px-4 py-3 text-sm text-green-700 shadow-[var(--shadow-soft)] dark:text-green-300">
          Bling conectado com sucesso.
        </div>
      ) : null}

      {searchParams.bling === "error" ? (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-[var(--shadow-soft)]">
          Não foi possível concluir a autorização do Bling. Gere um novo acesso e tente novamente.
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
              Use o botão para autorizar este sistema na conta Bling.
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
              <div>Empresa Bling: {connection?.companyId ?? "Não identificada"}</div>
              <div>Atualizado em: {formatDate(connection?.updatedAt)}</div>
              <div>Expira em: {formatDate(connection?.expiresAt)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWebhook className="size-5" />
              Webhook & Sincronização
            </CardTitle>
            <CardDescription>
              Configurações de recebimento de dados e sincronização automática.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div>
              <div className="font-medium">URL do Webhook</div>
              <code className="mt-1 block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs">
                {webhookUrl}
              </code>
            </div>
            
            <div className="grid gap-2">
              <div className="font-medium">Sincronização Manual</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/bling/sync/incremental?minutes=60" target="_blank">
                    Sincronia Incremental (1h)
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/bling/sync/full" target="_blank">
                    Sincronia Completa
                  </a>
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * A sincronia incremental deve ser configurada em um serviço de CRON externo a cada 5-15 minutos.
              </p>
            </div>

            <div className="grid gap-1 pt-2 border-t text-muted-foreground">
              <div>Eventos de Webhook recebidos: {eventCount}</div>
              <div>
                Último evento:{" "}
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
          <CardTitle>Configuração no Bling</CardTitle>
          <CardDescription>
            O aplicativo cadastrado no Bling deve ter os escopos dos recursos usados pelo sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>
            No Bling, informe a URL de redirecionamento acima no cadastro do aplicativo.
            Depois, na aba Webhooks, adicione a URL do servidor e marque os recursos e
            ações que este sistema deve receber.
          </p>
          <p>
            O endpoint de webhook valida o cabeçalho X-Bling-Signature-256 e grava cada
            eventId uma única vez para suportar retentativas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
