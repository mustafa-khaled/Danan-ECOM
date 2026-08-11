export type NotificationIconType = "verified" | "document" | "clock" | "envelope";

export interface Notification {
  id: string;
  icon: NotificationIconType;
  title: string;
  description: string;
  href: string;
}

export interface NotificationGroup {
  label: string;
  items: Notification[];
}
