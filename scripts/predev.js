const { rmSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const workspaceRoot = process.cwd();
const nextDevCachePath = path.join(workspaceRoot, ".next", "dev");

try {
  rmSync(nextDevCachePath, { recursive: true, force: true });
} catch (error) {
  console.warn("[predev] Could not fully remove .next/dev cache:", error.message);
}

const prismaCommand = "npx prisma generate";
const result = spawnSync(prismaCommand, {
  cwd: workspaceRoot,
  stdio: "inherit",
  env: process.env,
  shell: true,
});

if (result.error) {
  console.error("[predev] Failed to run Prisma generate:", result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
