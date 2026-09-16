import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { JsonLogger } from "./common/logger/json-logger.service";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware";
import { requestLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  requestTimeoutMiddleware,
} from "./common/middleware/request-timeout.middleware";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new JsonLogger(),
    // Raw body is required to verify payment webhook signatures.
    rawBody: true,
  });

  // Behind exactly one proxy hop (nginx) in production, so request.ip
  // reflects the real client IP and Redis rate limits key correctly.
  app.set("trust proxy", 1);

  // Request ID (generates x-request-id if not present) + request logging
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(
    requestTimeoutMiddleware(
      Number(process.env.REQUEST_TIMEOUT_MS) || DEFAULT_REQUEST_TIMEOUT_MS,
    ),
  );

  // L-04: Explicitly disable x-powered-by as defense-in-depth (Helmet also does this)
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // L-02: Explicit body size limit to prevent memory exhaustion
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  // M-02: Only allow the web frontend origin in CORS; the API should not CORS-trust itself.
  // env.validation.ts requires WEB_ORIGIN in production, so a missing value here
  // can only mean local development.
  const webOrigin = process.env.WEB_ORIGIN;
  if (!webOrigin && process.env.NODE_ENV === "production") {
    throw new Error("WEB_ORIGIN is required in production");
  }
  app.enableCors({
    origin: [webOrigin ?? "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Language", "X-Request-ID"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // M-11: Only expose Swagger in development (not staging/test) to limit reconnaissance
  if (process.env.NODE_ENV === "development") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("DADAN API")
      .setDescription(
        "Private digital jewelry house API. Client auth uses a House Key " +
          "(httpOnly cookie); admin auth uses email/password.",
      )
      .setVersion("1.0")
      .addCookieAuth("dadan_session", { type: "apiKey", in: "cookie" })
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
