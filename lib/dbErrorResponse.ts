import { jsonNoStore } from "./jsonNoStore";

/** JSON body for Prisma / DB failures so clients never get an empty 500 body. */
export function dbErrorResponse(error: unknown, status = 503) {
  const message = error instanceof Error ? error.message : "Database error";
  console.error("[db]", message);
  return jsonNoStore(
    {
      error: message,
      hint: "Confirm DATABASE_URL (SSL if required) and apply migrations: npx prisma migrate deploy"
    },
    { status }
  );
}
