import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Optional,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { I18nService } from "nestjs-i18n";
import { Prisma } from "@dadan/db";
import { resolveLocale } from "../i18n/locale";

interface ErrorResponse {
  statusCode: number;
  message: string;
  /** Stable machine-readable key (present when the error uses an i18n key). */
  messageKey?: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

const I18N_KEY_PATTERN = /^errors\.[A-Z0-9_]+$/;

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(@Optional() private readonly i18n?: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaMapping = this.mapPrismaError(exception);
      if (prismaMapping) {
        const errorResponse: ErrorResponse = {
          statusCode: prismaMapping.status,
          message: prismaMapping.message,
          error: prismaMapping.error,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        const requestId = request.headers["x-request-id"];
        if (typeof requestId === "string") {
          errorResponse.requestId = requestId;
        }

        this.logError(request, prismaMapping.status, exception, requestId as string | undefined);
        response.status(prismaMapping.status).json(errorResponse);
        return;
      }
    }

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage = isHttpException
      ? this.extractMessage(exception)
      : "errors.INTERNAL_SERVER_ERROR";

    const errorName = isHttpException
      ? exception.name
      : "InternalServerError";

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: this.translate(rawMessage, request),
      error: errorName,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (I18N_KEY_PATTERN.test(rawMessage)) {
      errorResponse.messageKey = rawMessage;
    }

    const requestId = request.headers["x-request-id"];
    if (typeof requestId === "string") {
      errorResponse.requestId = requestId;
    }

    this.logError(request, status, exception, requestId as string | undefined);

    response.status(status).json(errorResponse);
  }

  /** Translates `errors.*` keys to the request locale; passes other messages through. */
  private translate(message: string, request: Request): string {
    if (!this.i18n || !I18N_KEY_PATTERN.test(message)) {
      return message;
    }
    const lang = resolveLocale(request);
    const translated = this.i18n.t(message, { lang });
    return typeof translated === "string" ? translated : message;
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

  private mapPrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
  } | null {
    switch (exception.code) {
      case "P2002":
        return { status: HttpStatus.CONFLICT, message: "Resource already exists", error: "Conflict" };
      case "P2025":
        return { status: HttpStatus.NOT_FOUND, message: "Resource not found", error: "Not Found" };
      case "P2003":
        return { status: HttpStatus.BAD_REQUEST, message: "Related resource not found", error: "Bad Request" };
      default:
        return null;
    }
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
