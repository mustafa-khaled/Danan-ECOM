import { getTranslations } from "next-intl/server";
import { Container, SectionHead } from "@/components/ui";
import {
  NotificationGroupSection,
  fetchNotifications,
  type NotificationGroup,
} from "@/features/notifications";
import { getSessionCookieHeader } from "@/features/auth/server/session";

export default async function NotificationsPage() {
  const t = await getTranslations("notifications");
  const cookie = await getSessionCookieHeader();
  const data = await fetchNotifications(cookie).catch(() => ({
    groups: [] as Array<{ key: "today" | "thisWeek"; items: NotificationGroup["items"] }>,
  }));

  const notificationGroups: NotificationGroup[] = data.groups
    .filter((group) => group.items.length > 0)
    .map((group) => ({
      label: t(group.key),
      items: group.items,
    }));

  return (
    <div className="bg-neutral-50 py-1">
      <Container>
        <SectionHead
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="space-y-8 pb-16">
          {notificationGroups.map((group) => (
            <NotificationGroupSection key={group.label} group={group} />
          ))}
        </div>
      </Container>
    </div>
  );
}
