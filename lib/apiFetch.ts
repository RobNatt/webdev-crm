/** Browser fetch that avoids stale cached API responses (common after DB/env fixes). */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: "no-store" });
}
