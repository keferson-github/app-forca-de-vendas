import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  return new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "stdout", level: "warn" },
    ],
  });
}

type AppPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma?: AppPrismaClient };

function isIgnorablePrismaConnectionError(message: string) {
  return (
    message.includes("Error in PostgreSQL connection") &&
    message.includes("kind: Closed")
  );
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

prisma.$on("error", (event) => {
  if (isIgnorablePrismaConnectionError(event.message)) {
    return;
  }

  console.error(`prisma:error ${event.message}`);
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
