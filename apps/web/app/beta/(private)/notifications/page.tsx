import { getTranslations } from "next-intl/server";
import { Container, SectionHead } from "@/components/ui";
import {
  NotificationGroupSection,
  type NotificationGroup,
} from "@/features/notifications";

export default async function NotificationsPage() {
  const t = await getTranslations("notifications");

  /* ═══════════════════════════════════════════════════════════════════════════
     MOCK DATA — will be replaced with API data
     ═══════════════════════════════════════════════════════════════════════════ */

  const notificationGroups: NotificationGroup[] = [
    {
      label: t("today"),
      items: [
        {
          id: "1",
          icon: "verified",
          title: t("title"),
          description: "Your ownership of Mawaddah Ring has been verified.",
          href: "#",
        },
        {
          id: "2",
          icon: "document",
          title: t("title"),
          description: "Your ownership of Mawaddah Ring has been verified.",
          href: "#",
        },
        {
          id: "3",
          icon: "clock",
          title: t("title"),
          description: "Your ownership of Mawaddah Ring has been verified.",
          href: "#",
        },
        {
          id: "4",
          icon: "envelope",
          title: t("title"),
          description: "Your ownership of Mawaddah Ring has been verified.",
          href: "#",
        },
      ],
    },
    {
      label: t("thisWeek"),
      items: [
        {
          id: "5",
          icon: "clock",
          title: t("title"),
          description: "Your ownership of Mawaddah Ring has been verified.",
          href: "#",
        },
        {
          id: "6",
          icon: "envelope",
          title: t("title"),
          description: "Your ownership of Mawaddah Ring has been verified.",
          href: "#",
        },
      ],
    },
  ];

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
