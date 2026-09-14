"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui";
import {
  fetchHouseSettings,
  updateHouseSettings,
  type HouseSettings,
} from "@/features/admin/api/fetch-admin-settings";

export default function HouseAccess() {
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
  const keyValidity = String(settings?.keyValidityMonths ?? 12);

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="house">
          <AccordionTrigger className="py-[16px] px-6 border-b border-[#E1E4E8]">
            <div className="text-[#29343D]">
              <h2 className="font-bold text-h5 leading-[100%]">House Access</h2>
              <p className="text-[12px] font-semibold mt-3">
                Control how members enter the private House.
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
            <div className="grid grid-cols-2 items-end gap-x-[32px] gap-y-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="keyValidity"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Key validity
                </label>
                <Select
                  value={keyValidity}
                  onValueChange={(value) =>
                    save.mutate({ keyValidityMonths: Number(value) })
                  }
                  disabled={!settings || save.isPending}
                >
                  <SelectTrigger
                    id="keyValidity"
                    className="w-full border-none bg-[#F8FAFC] h-17.5 px-[16px] text-[#272D35]"
                  >
                    <SelectValue placeholder="Select validity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="3">3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AccessToggle
                id="requireKeyRenewal"
                label="Require key renewal"
                checked={settings?.requireKeyRenewal ?? true}
                disabled={!settings || save.isPending}
                onChange={(checked) => save.mutate({ requireKeyRenewal: checked })}
              />
            </div>
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
