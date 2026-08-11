import type { NotificationGroup } from "../types";
import { NotificationCard } from "./notification-card";

export function NotificationGroupSection({
  group,
}: {
  group: NotificationGroup;
}) {
  return (
    <section>
      {/* Group heading */}
      <h3 className="font-body mb-3 text-base font-bold text-ds-text">
        {group.label}
      </h3>

      {/* Notification list */}
      <div className="space-y-2">
        {group.items.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>
    </section>
  );
}
