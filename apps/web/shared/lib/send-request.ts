import { getApiBase } from "./constants";
import { invokeUnauthorizedHandler } from "./unauthorized-handler";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface SendRequestConfig<TBody = unknown> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: TBody;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: HeadersInit;
  timeout?: number;
  signal?: AbortSignal;
  cookieHeader?: string;
}

function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const separator = base.endsWith("/") ? "" : "/";
  const basePath = `${base}${separator}${path.replace(/^\//, "")}`;
  if (!params) return basePath;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      sp.set(key, String(value));
    }
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export async function sendRequest<TResponse, TBody = unknown>(
  config: SendRequestConfig<TBody>,
): Promise<TResponse> {
  const { method, url, body, params, headers, timeout, signal: externalSignal, cookieHeader } = config;

  const apiBase = getApiBase();
  const fullUrl = buildUrl(apiBase, url, params);

  const controller = new AbortController();
  const timeoutId = timeout
    ? setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeout)
    : undefined;

  const combinedSignal = externalSignal
    ? combineAbortSignals(controller.signal, externalSignal)
    : controller.signal;

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (cookieHeader) {
    requestHeaders["Cookie"] = cookieHeader;
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body:
        body instanceof FormData
          ? (body as FormData)
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
      signal: combinedSignal,
      credentials: cookieHeader ? undefined : "include",
      cache: "no-store",
    });

    return await parseResponse<TResponse>(response);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status);
    }
    return undefined as T;
  }

  if (!response.ok) {
    if (response.status === 401) {
      invokeUnauthorizedHandler();
    }
    const errorBody = body as { message?: string; code?: string } | undefined;
    throw new ApiError(
      errorBody?.message ?? `HTTP ${response.status}`,
      response.status,
      errorBody?.code,
    );
  }

  return body as T;
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}
