import { NextResponse } from "next/server";

/** JSON response with cache disabled (CDN / browser should not reuse empty or stale API bodies). */
export function jsonNoStore(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  return NextResponse.json(data, { ...init, headers });
}
