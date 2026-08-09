import { sendRequest } from "@/shared/lib/send-request";
import type { MyCollection } from "../types";

export function fetchMyCollection(cookieHeader?: string): Promise<MyCollection> {
  return sendRequest<MyCollection>({
    method: "GET",
    url: "/client/wardrobe/my-collection",
    cookieHeader,
  });
}
