import type { Request, Response, NextFunction } from "express";

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const level =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: `${method} ${originalUrl} ${statusCode} ${duration}ms`,
      method,
      url: originalUrl,
      statusCode,
      duration,
      requestId: req.requestId,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    };

    const output = JSON.stringify(entry) + "\n";
    if (statusCode >= 500) {
      process.stderr.write(output);
    } else {
      process.stdout.write(output);
    }
  });

  next();
}
