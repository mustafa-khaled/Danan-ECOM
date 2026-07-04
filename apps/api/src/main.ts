import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { JsonLogger } from "./common/logger/json-logger.service";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware";
import { requestLoggerMiddleware } from "./common/middleware/request-logger.middleware";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new JsonLogger(),
  });

  // Behind exactly one proxy hop (nginx) in production, so request.ip
  // reflects the real client IP and Redis rate limits key correctly.
  app.set("trust proxy", 1);

  // Request ID (generates x-request-id if not present) + request logging
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: [
      process.env.WEB_ORIGIN ?? "http://localhost:3000",
      process.env.BASE_URL,
    ].filter((origin): origin is string => Boolean(origin)),
    credentials: true,
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
