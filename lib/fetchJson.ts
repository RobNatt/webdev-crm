/**
 * Read fetch response as JSON without throwing on empty or non-JSON bodies.
 */
export async function fetchJson<T = Record<string, unknown>>(res: Response): Promise<{
  ok: boolean;
  status: number;
  data: T;
  rawText: string;
}> {
  const rawText = await res.text();
  if (!rawText.trim()) {
    return {
      ok: res.ok,
      status: res.status,
      data: {} as T,
      rawText: ""
    };
  }
  try {
    return {
      ok: res.ok,
      status: res.status,
      data: JSON.parse(rawText) as T,
      rawText
    };
  } catch {
    return {
      ok: res.ok,
      status: res.status,
      data: { error: rawText.slice(0, 300) } as T,
      rawText
    };
  }
}
