import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import cookieParser from "cookie-parser";
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

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.enableCors({
    origin: [
      process.env.WEB_ORIGIN ?? "http://localhost:3000",
      process.env.BASE_URL,
    ].filter((origin): origin is string => Boolean(origin)),
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

  // The catalog is private; never expose interactive API docs in production.
  if (process.env.NODE_ENV !== "production") {
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
