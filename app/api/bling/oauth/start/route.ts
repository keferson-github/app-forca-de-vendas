import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createBlingAuthorizationUrl } from "@/lib/bling";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const state = randomBytes(24).toString("hex");
  await prisma.blingOAuthState.create({
    data: {
      userId: session.user.id,
      state,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  return NextResponse.redirect(createBlingAuthorizationUrl(state));
}
