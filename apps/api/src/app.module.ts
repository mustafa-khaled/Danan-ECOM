import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { validateEnv } from "./config/env.validation";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { I18nModule } from "nestjs-i18n";
import * as path from "node:path";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { GlobalAuthGuard } from "./common/guards/global-auth.guard";
import { DEFAULT_LOCALE } from "./common/i18n/locale";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { HealthModule } from "./health/health.module";
import { AuditModule } from "./audit/audit.module";
import { VisibilityModule } from "./visibility/visibility.module";
import { StorageModule } from "./storage/storage.module";
import { AuthModule } from "./auth/auth.module";
import { AdminAuthModule } from "./admin/auth/admin-auth.module";
import { ClientsModule } from "./clients/clients.module";
import { CollectionsModule } from "./collections/collections.module";
import { PiecesModule } from "./pieces/pieces.module";
import { CartModule } from "./cart/cart.module";
import { PaymentsModule } from "./payments/payments.module";
import { OrdersModule } from "./orders/orders.module";
import { CertificatesModule } from "./certificates/certificates.module";
import { VerifyModule } from "./verify/verify.module";
import { TransfersModule } from "./transfers/transfers.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ["../../.env", ".env"],
    }),
    ScheduleModule.forRoot(),
    // Global IP rate limit (Redis-backed so limits hold across instances).
    // Stricter per-endpoint limits (login, verify, transfers) remain in place.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ ttl: 60_000, limit: 120 }],
        storage: new ThrottlerStorageRedisService(
          config.getOrThrow<string>("REDIS_URL"),
        ),
      }),
    }),
    I18nModule.forRoot({
      fallbackLanguage: DEFAULT_LOCALE,
      loaderOptions: {
        path: path.join(__dirname, "i18n"),
        watch: false,
      },
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuditModule,
    VisibilityModule,
    StorageModule,
    AuthModule,
    AdminAuthModule,
    ClientsModule,
    CollectionsModule,
    PiecesModule,
    CartModule,
    PaymentsModule,
    OrdersModule,
    CertificatesModule,
    VerifyModule,
    TransfersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // Order matters: throttle first, then the default-deny auth safety net.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
  ],
})
export class AppModule {}
