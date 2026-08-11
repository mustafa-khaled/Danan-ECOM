import { Container, SectionHead } from "@/components/ui";
import {
  NotificationGroupSection,
  type NotificationGroup,
} from "@/features/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   MOCK DATA — will be replaced with API data
   ═══════════════════════════════════════════════════════════════════════════ */

const notificationGroups: NotificationGroup[] = [
  {
    label: "Today",
    items: [
      {
        id: "1",
        icon: "verified",
        title: "Ownership",
        description: "Your ownership of Mawaddah Ring has been verified.",
        href: "#",
      },
      {
        id: "2",
        icon: "document",
        title: "Ownership",
        description: "Your ownership of Mawaddah Ring has been verified.",
        href: "#",
      },
      {
        id: "3",
        icon: "clock",
        title: "Ownership",
        description: "Your ownership of Mawaddah Ring has been verified.",
        href: "#",
      },
      {
        id: "4",
        icon: "envelope",
        title: "Ownership",
        description: "Your ownership of Mawaddah Ring has been verified.",
        href: "#",
      },
    ],
  },
  {
    label: "This Week",
    items: [
      {
        id: "5",
        icon: "clock",
        title: "Ownership",
        description: "Your ownership of Mawaddah Ring has been verified.",
        href: "#",
      },
      {
        id: "6",
        icon: "envelope",
        title: "Ownership",
        description: "Your ownership of Mawaddah Ring has been verified.",
        href: "#",
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   NOTIFICATIONS PAGE
   ═══════════════════════════════════════════════════════════════════════════ */

export default function NotificationsPage() {
  return (
    <div className="bg-neutral-50 py-1">
      <Container>
        <SectionHead
          title="Notifications"
          subtitle="Stay informed about your collection, ownership, and the stories that matter"
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
