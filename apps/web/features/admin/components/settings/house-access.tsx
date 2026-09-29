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
  type HouseSettings,
} from "@/features/admin/api/fetch-admin-settings";
import { useTranslations } from "next-intl";

export default function HouseAccess() {
  const t = useTranslations("admin.settings");
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["admin-house-settings"],
    queryFn: () => fetchHouseSettings(),
  });
  const save = useMutation({
    mutationFn: (patch: Partial<HouseSettings>) => updateHouseSettings(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-house-settings"] }),
  });

  const settings = settingsQuery.data;

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="house">
          <AccordionTrigger className="py-[16px] px-6 border-b border-[#E1E4E8]">
            <div className="text-[#29343D]">
              <h2 className="font-bold text-h5 leading-[100%]">{t("houseAccess")}</h2>
              <p className="text-[12px] font-semibold mt-3">
                {t("houseAccessHint")}
              </p>
            </div>
          </AccordionTrigger>

          <AccordionContent className="p-6">
            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <AccessToggle
                id="privateHouseAccess"
                label="Private House Access"
                checked={settings?.privateHouseAccess ?? true}
                disabled={!settings || save.isPending}
                onChange={(checked) => save.mutate({ privateHouseAccess: checked })}
              />
              <AccessToggle
                id="privateKeyRequired"
                label="Private Key Required"
                checked={settings?.privateKeyRequired ?? true}
                disabled={!settings || save.isPending}
                onChange={(checked) => save.mutate({ privateKeyRequired: checked })}
              />
              <AccessToggle
                id="adminApprovalRequired"
                label="Admin Approval Required"
                checked={settings?.adminApprovalRequired ?? true}
                disabled={!settings || save.isPending}
                onChange={(checked) => save.mutate({ adminApprovalRequired: checked })}
              />
              <AccessToggle
                id="allowInvitations"
                label="Allow Private Invitations"
                checked={settings?.allowInvitations ?? true}
                disabled={!settings || save.isPending}
                onChange={(checked) => save.mutate({ allowInvitations: checked })}
              />
            </div>

            <h4 className="font-heading my-5 text-h4 font-bold">House Key</h4>
            <p className="p-[16px] bg-[#F8FAFC] text-h6 text-[#5D697A]">
              {t("houseKeyPermanent")}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

function AccessToggle({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
      <span className="text-h6 text-[#5D697A]">{label}</span>
      <Switch
        id={id}
        variant="success"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onCheckedChange={(details) => onChange(details.checked)}
      />
    </div>
  );
}
