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
import { extractBlingCompanyId } from "@/lib/bling";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  bling?: string;
}>;

const INTEGRACOES_FONT_FAMILY =
  '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

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
        accessToken: true,
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
  let displayCompanyId = connection?.companyId ?? null;

  if (connection && !displayCompanyId) {
    const extractedCompanyId = extractBlingCompanyId(connection.accessToken);
    if (extractedCompanyId) {
      await prisma.blingConnection.update({
        where: { userId: session.user.id },
        data: { companyId: extractedCompanyId },
      });
      displayCompanyId = extractedCompanyId;
    }
  }

  return (
    <div
      className="flex flex-col gap-4 p-4 lg:p-6"
      style={{ fontFamily: INTEGRACOES_FONT_FAMILY }}
    >
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integração Bling</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Gerencie a conexão da sua conta e acompanhe o status da sincronização.
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
              Conexão da conta
            </CardTitle>
            <CardDescription>
              Autorize ou renove o acesso da sua conta Bling neste sistema.
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
            <div className="grid gap-1 text-muted-foreground">
              <div>Conectado em: {formatDate(connection?.connectedAt)}</div>
              <div>Empresa Bling: {displayCompanyId ?? "Não identificada"}</div>
              <div>Atualizado em: {formatDate(connection?.updatedAt)}</div>
              <div>Expira em: {formatDate(connection?.expiresAt)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWebhook className="size-5" />
              Sincronização
            </CardTitle>
            <CardDescription>
              Atualize os dados e acompanhe a atividade recente da integração.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="grid gap-2">
              <div className="font-medium">Atualização manual</div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/bling/sync/incremental?minutes=60" target="_blank">
                    Atualizar última hora
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/bling/sync/full" target="_blank">
                    Atualização completa
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-1 pt-2 border-t text-muted-foreground">
              <div>Eventos recebidos: {eventCount}</div>
              <div>
                Última atividade:{" "}
                {lastEvent
                   ? `${lastEvent.event} em ${formatDate(lastEvent.receivedAt)}`
                   : "Nenhum evento recebido"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
