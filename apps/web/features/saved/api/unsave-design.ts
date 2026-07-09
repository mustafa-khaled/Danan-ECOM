import { sendRequest } from "@/shared/lib/send-request";

export function unsaveDesign(designId: string): Promise<void> {
  return sendRequest<void>({
    method: "DELETE",
    url: `/client/saved/${designId}`,
  });
}
