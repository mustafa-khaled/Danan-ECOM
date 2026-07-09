import { sendRequest } from "@/shared/lib/send-request";

export function saveDesign(designId: string): Promise<void> {
  return sendRequest<void>({
    method: "POST",
    url: "/client/saved",
    body: { designId },
  });
}
