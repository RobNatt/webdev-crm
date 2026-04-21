import { jsonNoStore } from "../../../lib/jsonNoStore";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

/** Quick check that the server and database are reachable. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return jsonNoStore({ ok: true, database: "connected" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return jsonNoStore(
      {
        ok: false,
        database: "error",
        error: message,
        hint: "Apply migrations: npx prisma migrate deploy (with DATABASE_URL set)"
      },
      { status: 503 }
    );
  }
}
