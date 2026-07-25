import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { ClientSession, Locale } from "@dadan/types";
import type { Request } from "express";

export const DEFAULT_LOCALE: Locale = "ar";
export const SUPPORTED_LOCALES: readonly Locale[] = ["ar", "en"];

export function isLocale(value: unknown): value is Locale {
  return value === "ar" || value === "en";
}

/** Picks the first supported locale from an Accept-Language header. */
export function parseAcceptLanguage(header: string | undefined): Locale | null {
  if (!header) return null;
  const tags = header
    .split(",")
    .map((part) => part.split(";")[0]!.trim().toLowerCase())
    .filter(Boolean);
  for (const tag of tags) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}

/**
 * Resolution order: authenticated client's stored locale, then the
 * Accept-Language header, then Arabic (the platform's primary language).
 */
export function resolveLocale(
  request: Request & { client?: ClientSession },
): Locale {
  if (request.client && isLocale(request.client.locale)) {
    return request.client.locale;
  }
  return (
    parseAcceptLanguage(request.headers["accept-language"]) ?? DEFAULT_LOCALE
  );
}

export const CurrentLocale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Locale => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { client?: ClientSession }>();
    return resolveLocale(request);
  },
);
