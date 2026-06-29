import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface PaymentResult {
  success: boolean;
  providerReference?: string;
  failureCode?: string;
  failureMessage?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly config: ConfigService) {}

  async charge(
    token: string,
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<PaymentResult> {
    if (token === "fail" || token.startsWith("fail_")) {
      return {
        success: false,
        failureCode: "PAYMENT_DECLINED",
        failureMessage: "Payment was declined",
      };
    }

    const ref = `mock_${Date.now()}_${metadata.orderId ?? "checkout"}`;
    console.log(
      `[payments] Mock charge: ${amount} ${currency}, token=${token.slice(0, 8)}..., ref=${ref}`,
    );

    return {
      success: true,
      providerReference: ref,
    };
  }
}
