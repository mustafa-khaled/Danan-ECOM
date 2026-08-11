import Link from "next/link";
import type { Notification } from "../types";
import { NOTIFICATION_ICON_MAP } from "./notification-icons";

export function NotificationCard({
  notification,
}: {
  notification: Notification;
}) {
  const IconComponent = NOTIFICATION_ICON_MAP[notification.icon];

  return (
    <div className="flex items-start gap-4 rounded-lg bg-white px-5 py-4 transition-colors duration-200 hover:bg-neutral-50">
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brown-600">
        <IconComponent />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm font-semibold text-ds-text">
          {notification.title}
        </p>
        <p className="mt-0.5 font-body text-sm leading-relaxed text-ds-text-secondary">
          {notification.description}
        </p>
        <Link
          href={notification.href}
          className="mt-1.5 inline-flex items-center gap-1.5 font-body text-xs font-medium text-ds-primary transition-colors duration-150 hover:text-ds-primary-hover"
        >
          <span>View</span>
          <span className="rtl:rotate-180 inline-block" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}
