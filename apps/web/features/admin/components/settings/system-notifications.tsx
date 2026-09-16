"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui";
import {
  fetchHouseSettings,
  updateHouseSettings,
} from "@/features/admin/api/fetch-admin-settings";
import { useTranslations } from "next-intl";

const NOTIFICATION_TOGGLES = [
  { key: "ownershipTransferRequest" },
  { key: "transferCompleted" },
  { key: "newMemberInvitation" },
  { key: "certificateIssued" },
  { key: "accessRequest" },
  { key: "paymentCompleted" },
  { key: "paymentFailed" },
] as const;

export default function SystemNotifications() {
  const t = useTranslations("admin.settings");
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["admin-house-settings"],
    queryFn: () => fetchHouseSettings(),
  });
  const save = useMutation({
    mutationFn: (patch: {
      key: (typeof NOTIFICATION_TOGGLES)[number]["key"];
      checked: boolean;
    }) =>
      updateHouseSettings({
        notificationPrefs: { [patch.key]: patch.checked },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-house-settings"] }),
  });

  const prefs = settingsQuery.data?.notificationPrefs ?? {};

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="house">
          <AccordionTrigger className="py-[16px] px-6 border-b border-[#E1E4E8]">
            <h2 className="font-bold text-h5 leading-[100%] text-[#29343D]">
              {t("notifications")}
            </h2>
          </AccordionTrigger>

          <AccordionContent className="p-6">
            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              {NOTIFICATION_TOGGLES.map((toggle, index) => (
                <div
                  key={toggle.key}
                  className={`flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5 ${
                    index === NOTIFICATION_TOGGLES.length - 1 ? "col-span-2" : ""
                  }`}
                >
                  <span className="text-h6 text-[#5D697A]">{t(toggle.key)}</span>
                  <Switch
                    id={toggle.key}
                    variant="success"
                    checked={prefs[toggle.key] !== false}
                    disabled={!settingsQuery.data || save.isPending}
                    aria-label={t(toggle.key)}
                    onCheckedChange={(details) =>
                      save.mutate({ key: toggle.key, checked: details.checked })
                    }
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
