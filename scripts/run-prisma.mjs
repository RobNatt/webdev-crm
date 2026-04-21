/**
 * Prisma CLI only reads DATABASE_URL from prisma/schema.prisma.
 * Vercel Postgres and some hosts expose POSTGRES_URL instead — map it when DATABASE_URL is unset.
 */
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL?.trim()) {
  const alt = process.env.POSTGRES_URL?.trim();
  if (alt) {
    process.env.DATABASE_URL = alt;
    console.warn("DATABASE_URL was unset; using POSTGRES_URL for this Prisma command.\n");
  }
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    "Prisma needs DATABASE_URL (see prisma/schema.prisma). Set it in .env or export it.\n" +
      "If you only have POSTGRES_URL (e.g. from Vercel), either export DATABASE_URL to the same value or rely on this script: POSTGRES_URL=... npm run db:deploy"
  );
  process.exit(1);
}

const prismaArgs = process.argv.slice(2);
if (!prismaArgs.length) {
  console.error("Usage: node scripts/run-prisma.mjs <prisma subcommand> [...args]");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", ...prismaArgs], {
  stdio: "inherit",
  env: process.env,
  shell: true
});

process.exit(result.status === 0 ? 0 : result.status ?? 1);
