import { HttpStatus } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";

/**
 * Slightly below nginx's 30s `proxy_read_timeout` so a stalled handler is
 * reported by the API as a 503 rather than surfacing as an nginx 504.
 */
export const DEFAULT_REQUEST_TIMEOUT_MS = 25_000;

/**
 * Bounds how long a handler may run before producing a response.
 *
 * The deadline covers time-to-first-byte only: once headers are sent the
 * request is streaming (file downloads, PDFs) and must be allowed to finish at
 * the client's pace. This targets handlers that are genuinely stuck or
 * expensive without capping legitimate slow transfers.
 *
 * Node cannot abort an in-flight handler, so the work continues in the
 * background; the point is to stop a request pile-up from holding connections
 * and to make overload visible instead of silent.
 */
export function requestTimeoutMiddleware(
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (res.headersSent || res.writableEnded) return;

      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: "errors.REQUEST_TIMEOUT",
        messageKey: "errors.REQUEST_TIMEOUT",
        error: "ServiceUnavailable",
        timestamp: new Date().toISOString(),
        path: req.url,
        requestId: req.requestId,
      });
    }, timeoutMs);

    const clear = () => clearTimeout(timer);
    res.on("finish", clear);
    res.on("close", clear);

    next();
  };
}
