import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env.validation";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
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
    PrismaModule,
    RedisModule,
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
  controllers: [AppController],
})
export class AppModule {}
