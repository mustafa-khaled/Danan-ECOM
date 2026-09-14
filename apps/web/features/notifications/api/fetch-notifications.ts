import { sendRequest } from "@/shared/lib/send-request";
import type { NotificationGroup } from "../types";

export function fetchNotifications(cookieHeader?: string): Promise<{
  groups: Array<{ key: "today" | "thisWeek"; items: NotificationGroup["items"] }>;
}> {
  return sendRequest({
    method: "GET",
    url: "/client/notifications",
    cookieHeader,
  });
}
