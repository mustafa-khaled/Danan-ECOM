import { sendRequest } from "@/shared/lib/send-request";
import type { ValidateKeyResponse } from "../types";

export function validateHouseKey(houseKey: string): Promise<ValidateKeyResponse> {
  return sendRequest<ValidateKeyResponse>({
    method: "POST",
    url: "/auth/validate-key",
    body: { houseKey },
  });
}
