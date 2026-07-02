import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? this.extractMessage(exception)
      : "Internal server error";

    const errorName = isHttpException
      ? exception.name
      : "InternalServerError";

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    const requestId = request.headers["x-request-id"];
    if (typeof requestId === "string") {
      errorResponse.requestId = requestId;
    }

    this.logError(request, status, exception, requestId as string | undefined);

    response.status(status).json(errorResponse);
  }

  private extractMessage(exception: HttpException): string {
    const response = exception.getResponse();
    if (typeof response === "string") {
      return response;
    }
    if (typeof response === "object" && response !== null) {
      const resp = response as Record<string, unknown>;
      if (typeof resp.message === "string") {
        return resp.message;
      }
      if (Array.isArray(resp.message)) {
        return resp.message.join(", ");
      }
    }
    return exception.message;
  }

  private logError(
    request: Request,
    status: number,
    exception: unknown,
    requestId?: string,
  ) {
    const logContext = {
      method: request.method,
      url: request.url,
      statusCode: status,
      requestId,
      userAgent: request.headers["user-agent"],
      ip: request.ip,
    };

    const isProduction = process.env.NODE_ENV === "production";

    if (status >= 500) {
      const error = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        isProduction ? undefined : error.stack,
        JSON.stringify(logContext),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}`,
        JSON.stringify(logContext),
      );
    }
  }
}
