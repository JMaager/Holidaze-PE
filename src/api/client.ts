import { getToken } from "./auth";
import { throwApiError } from "./errors";

const BASE_URL =
  (import.meta.env.VITE_BASE_API_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://v2.api.noroff.dev";
const API_KEY = (import.meta.env.VITE_API_KEY as string | undefined) ?? "";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Additional headers to merge in. */
  headers?: Record<string, string>;
  /** URL query parameters appended to the path. */
  params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function buildHeaders(extra?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (API_KEY) {
    headers["X-Noroff-API-Key"] = API_KEY;
  }

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Core fetch wrapper.
 * Automatically attaches auth headers, serialises the body, and throws
 * an ApiError for any non-2xx response.
 *
 * Returns `null` for 204 No Content responses.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers: extraHeaders, params } = options;

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: buildHeaders(extraHeaders),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    await throwApiError(response);
  }

  return response.json() as Promise<T>;
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export const apiGet = <T>(
  path: string,
  options?: Omit<RequestOptions, "method" | "body">,
) => apiFetch<T>(path, { ...options, method: "GET" });

export const apiPost = <T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">,
) => apiFetch<T>(path, { ...options, method: "POST", body });

export const apiPut = <T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">,
) => apiFetch<T>(path, { ...options, method: "PUT", body });

export const apiDelete = <T = void>(
  path: string,
  options?: Omit<RequestOptions, "method" | "body">,
) => apiFetch<T>(path, { ...options, method: "DELETE" });
