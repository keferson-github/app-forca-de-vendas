import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const BLING_AUTHORIZE_URL = "https://www.bling.com.br/Api/v3/oauth/authorize";
const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";
const BLING_API_BASE_URL = "https://api.bling.com.br/Api/v3";

type BlingTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
};

type BlingJwtPayload = {
  companyId?: unknown;
  company_id?: unknown;
  empresa?: {
    id?: unknown;
  };
  organization?: {
    id?: unknown;
  };
};

export type BlingWebhookPayload = {
  eventId?: unknown;
  date?: unknown;
  version?: unknown;
  event?: unknown;
  companyId?: unknown;
  data?: unknown;
};

export function getBlingCredentials() {
  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Configure BLING_CLIENT_ID e BLING_CLIENT_SECRET no ambiente.");
  }

  return { clientId, clientSecret };
}

export function getBaseUrl(requestUrl?: string) {
  if (process.env.BLING_APP_URL) {
    return process.env.BLING_APP_URL.replace(/\/$/, "");
  }

  if (process.env.AUTH_URL) {
    return process.env.AUTH_URL.replace(/\/$/, "");
  }

  if (requestUrl) {
    const url = new URL(requestUrl);
    return url.origin;
  }

  return "http://localhost:3000";
}

export function getBlingRedirectUri(requestUrl?: string) {
  if (process.env.BLING_REDIRECT_URI) {
    return process.env.BLING_REDIRECT_URI;
  }

  return `${getBaseUrl(requestUrl)}/api/bling/oauth/callback`;
}

export function getBlingWebhookUrl(requestUrl?: string) {
  return `${getBaseUrl(requestUrl)}/api/bling/webhook`;
}

export function createBlingAuthorizationUrl(state: string) {
  const { clientId } = getBlingCredentials();
  const url = new URL(BLING_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("state", state);

  return url;
}

function getBasicAuthorizationHeader() {
  const { clientId, clientSecret } = getBlingCredentials();
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;
}

async function requestBlingToken(params: URLSearchParams) {
  const response = await fetch(BLING_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthorizationHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Falha ao obter token do Bling (${response.status}): ${JSON.stringify(body)}`
    );
  }

  return body as BlingTokenResponse;
}

export async function exchangeBlingAuthorizationCode(code: string) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
  });

  return requestBlingToken(params);
}

export async function refreshBlingToken(refreshToken: string) {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  return requestBlingToken(params);
}

export function getBlingTokenExpiresAt(expiresIn?: number) {
  if (!expiresIn) {
    return null;
  }

  return new Date(Date.now() + expiresIn * 1000);
}

export function extractBlingCompanyId(accessToken: string) {
  const [, payload] = accessToken.split(".");

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      Buffer.from(normalized, "base64").toString("utf8")
    ) as BlingJwtPayload;
    const companyId =
      decoded.companyId ??
      decoded.company_id ??
      decoded.empresa?.id ??
      decoded.organization?.id;

    return typeof companyId === "string" || typeof companyId === "number"
      ? String(companyId)
      : null;
  } catch {
    return null;
  }
}

export async function saveBlingConnection(userId: string, token: BlingTokenResponse) {
  return prisma.blingConnection.upsert({
    where: { userId },
    create: {
      userId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      companyId: extractBlingCompanyId(token.access_token),
      tokenType: token.token_type ?? "Bearer",
      scope: token.scope,
      expiresAt: getBlingTokenExpiresAt(token.expires_in),
    },
    update: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      companyId: extractBlingCompanyId(token.access_token),
      tokenType: token.token_type ?? "Bearer",
      scope: token.scope,
      expiresAt: getBlingTokenExpiresAt(token.expires_in),
    },
  });
}

export async function getValidBlingAccessToken(userId: string) {
  const connection = await prisma.blingConnection.findUnique({ where: { userId } });

  if (!connection) {
    throw new Error("Usuario ainda nao conectou o Bling.");
  }

  const refreshThreshold = new Date(Date.now() + 60_000);
  if (!connection.expiresAt || connection.expiresAt > refreshThreshold) {
    return connection.accessToken;
  }

  const token = await refreshBlingToken(connection.refreshToken);
  const updated = await saveBlingConnection(userId, token);

  return updated.accessToken;
}

export async function blingRequest<T>(
  userId: string,
  path: string,
  init: RequestInit = {}
) {
  const accessToken = await getValidBlingAccessToken(userId);
  const response = await fetch(`${BLING_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Falha na API do Bling (${response.status}) em ${path}: ${JSON.stringify(body)}`
    );
  }

  return body as T;
}

export function verifyBlingWebhookSignature(rawBody: string, signature: string | null) {
  const { clientSecret } = getBlingCredentials();

  if (!signature?.startsWith("sha256=")) {
    return false;
  }

  const expectedHash = crypto
    .createHmac("sha256", clientSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  const expected = `sha256=${expectedHash}`;

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}

export function parseBlingWebhookPayload(payload: BlingWebhookPayload) {
  if (typeof payload.eventId !== "string" || typeof payload.event !== "string") {
    throw new Error("Payload de webhook do Bling sem eventId ou event.");
  }

  const occurredAt = typeof payload.date === "string" ? new Date(payload.date) : null;

  return {
    eventId: payload.eventId,
    event: payload.event,
    companyId: typeof payload.companyId === "number" || typeof payload.companyId === "string"
      ? String(payload.companyId)
      : null,
    version: typeof payload.version === "number" || typeof payload.version === "string"
      ? String(payload.version)
      : null,
    occurredAt:
      occurredAt && Number.isNaN(occurredAt.getTime()) ? null : occurredAt,
    payload: payload as Prisma.InputJsonValue,
  };
}
