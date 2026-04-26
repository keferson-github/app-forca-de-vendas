import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function isIgnorablePrismaConnectionError(message: string) {
  return (
    message.includes("Error in PostgreSQL connection") &&
    message.includes("kind: Closed")
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "stdout", level: "warn" },
    ],
  });

prisma.$on("error", (event) => {
  if (isIgnorablePrismaConnectionError(event.message)) {
    return;
  }

  console.error(`prisma:error ${event.message}`);
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
