import { NextResponse } from "next/server";
import {
  exchangeBlingAuthorizationCode,
  resolveBlingCompanyId,
} from "@/lib/bling";
import { prisma } from "@/lib/prisma";

function redirectToIntegration(requestUrl: string, status: "success" | "error") {
  const url = new URL("/integracoes/bling", requestUrl);
  url.searchParams.set("bling", status);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return redirectToIntegration(request.url, "error");
  }

  const oauthState = await prisma.blingOAuthState.findUnique({
    where: { state },
  });

  if (!oauthState || oauthState.usedAt || oauthState.expiresAt < new Date()) {
    return redirectToIntegration(request.url, "error");
  }

  try {
    const token = await exchangeBlingAuthorizationCode(code);
    const companyId = await resolveBlingCompanyId(token.access_token);
    await prisma.$transaction([
      prisma.blingOAuthState.update({
        where: { id: oauthState.id },
        data: { usedAt: new Date() },
      }),
      prisma.blingConnection.upsert({
        where: { userId: oauthState.userId },
        create: {
          userId: oauthState.userId,
          companyId,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          tokenType: token.token_type ?? "Bearer",
          scope: token.scope,
          expiresAt: token.expires_in
            ? new Date(Date.now() + token.expires_in * 1000)
            : null,
        },
        update: {
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          companyId,
          tokenType: token.token_type ?? "Bearer",
          scope: token.scope,
          expiresAt: token.expires_in
            ? new Date(Date.now() + token.expires_in * 1000)
            : null,
        },
      }),
    ]);

    return redirectToIntegration(request.url, "success");
  } catch (error) {
    console.error("Erro no callback OAuth do Bling", error);
    return redirectToIntegration(request.url, "error");
  }
}
