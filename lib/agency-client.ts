/**
 * Thin client for the owner API.
 *
 * Identity travels in the signed HttpOnly session cookie, which the browser
 * attaches to every same-origin request automatically. Nothing here sends a
 * user id — the server resolves the caller from the cookie, and an id sent
 * from the browser would be forgeable and ignored anyway.
 *
 * The server still re-checks that the session's email matches OWNER_EMAIL on
 * every call; nothing here is trusted.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

async function parse<T>(res: Response): Promise<ApiResult<T>> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, status: res.status, error: (json as { error?: string }).error || "Request failed." };
  }
  return { ok: true, data: json as T };
}

export async function ownerGet<T>(url: string): Promise<ApiResult<T>> {
  try {
    return await parse<T>(await fetch(url));
  } catch {
    return { ok: false, status: 0, error: "Network error. Please check your connection." };
  }
}

export async function ownerSend<T>(
  url: string,
  method: "POST" | "PATCH",
  body?: Record<string, unknown>
): Promise<ApiResult<T>> {
  try {
    return await parse<T>(
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      })
    );
  } catch {
    return { ok: false, status: 0, error: "Network error. Please check your connection." };
  }
}

export async function ownerDelete<T>(url: string): Promise<ApiResult<T>> {
  try {
    return await parse<T>(await fetch(url, { method: "DELETE" }));
  } catch {
    return { ok: false, status: 0, error: "Network error. Please check your connection." };
  }
}
