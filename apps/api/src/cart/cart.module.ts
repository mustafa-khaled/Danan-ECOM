import { Module } from "@nestjs/common";
import { CartService, CartCleanupService } from "./cart.service";
import { RefundRecoveryService } from "./refund-recovery.service";
import { CartController } from "./cart.controller";
import { CheckoutController } from "./checkout.controller";
import { AuthModule } from "../auth/auth.module";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsModule } from "../payments/payments.module";

@Module({
  imports: [AuthModule, OrdersModule, PaymentsModule],
  controllers: [CartController, CheckoutController],
  providers: [CartService, CartCleanupService, RefundRecoveryService],
  exports: [CartService],
})
export class CartModule {}
