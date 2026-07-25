const DEFAULT_REDIRECT = "/beta/home";

/**
 * Validates a post-login redirect target. Only same-origin relative paths
 * under /beta/ are allowed — blocks open redirects (//evil.com, https://…).
 */
export function validateRedirectPath(next: string | null | undefined): string {
  if (!next) {
    return DEFAULT_REDIRECT;
  }

  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return DEFAULT_REDIRECT;
  }

  const segments = trimmed.split("/");
  if (segments.some((segment) => segment === "..")) {
    return DEFAULT_REDIRECT;
  }

  if (trimmed === "/beta" || trimmed.startsWith("/beta/")) {
    return trimmed;
  }

  return DEFAULT_REDIRECT;
}
