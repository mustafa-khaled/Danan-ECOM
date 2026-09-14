"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui";
import {
  MembershipPermissionsTable,
  RolesPermissionsTable,
} from "@/features/admin/components/collections";
import {
  fetchHouseSettings,
  updateHouseSettings,
  type HouseSettings,
} from "@/features/admin/api/fetch-admin-settings";

export default function CollectionSettings() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["admin-house-settings"],
    queryFn: () => fetchHouseSettings(),
  });
  const [houseName, setHouseName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [supportContact, setSupportContact] = useState("");

  useEffect(() => {
    const settings = settingsQuery.data;
    if (!settings) return;
    setHouseName(settings.houseName);
    setDescription(settings.description ?? "");
    setContactEmail(settings.contactEmail ?? "");
    setSupportContact(settings.supportContact ?? "");
  }, [settingsQuery.data]);

  const saveGeneral = useMutation({
    mutationFn: () =>
      updateHouseSettings({
        houseName,
        description,
        contactEmail: contactEmail || undefined,
        supportContact,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-house-settings"] }),
  });
  const saveAccess = useMutation({
    mutationFn: (patch: Partial<HouseSettings>) => updateHouseSettings(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-house-settings"] }),
  });

  const settings = settingsQuery.data;

  return (
    <div>
      <div className="my-[32px] py-[32px] border-b border-t border-[#E1E4E8]">
        <div>
          <h4 className="font-heading mb-5 text-h4 font-bold">General</h4>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveGeneral.mutate();
            }}
          >
            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="houseName"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  House Name
                </label>
                <input
                  type="text"
                  name="houseName"
                  placeholder="Enter house name"
                  id="houseName"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="houseDescription"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  House Description
                </label>
                <input
                  type="text"
                  name="houseDescription"
                  placeholder="Enter house description"
                  id="houseDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contactEmail"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Contact Email
                </label>
                <input
                  type="text"
                  name="contactEmail"
                  placeholder="Enter contact email"
                  id="contactEmail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="supportContact"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Support Contact
                </label>
                <input
                  type="text"
                  name="supportContact"
                  placeholder="Enter support contact"
                  id="supportContact"
                  value={supportContact}
                  onChange={(e) => setSupportContact(e.target.value)}
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 w-full mt-[16px]">
              <button
                type="submit"
                disabled={saveGeneral.isPending}
                className="w-24 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="py-[32px] border-b border-[#E1E4E8]">
        <h4 className="font-heading mb-5 text-h4 font-bold">House Access</h4>

        <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
          <AccessToggle
            id="accessKeyToggle"
            label="Enter Your Access Key"
            checked={settings?.privateHouseAccess ?? true}
            disabled={!settings || saveAccess.isPending}
            onChange={(checked) => saveAccess.mutate({ privateHouseAccess: checked })}
          />
          <AccessToggle
            id="privateKeyToggle"
            label="Require Private Key"
            checked={settings?.privateKeyRequired ?? true}
            disabled={!settings || saveAccess.isPending}
            onChange={(checked) => saveAccess.mutate({ privateKeyRequired: checked })}
          />
          <AccessToggle
            id="adminApprovalToggle"
            label="Admin Approval"
            checked={settings?.adminApprovalRequired ?? true}
            disabled={!settings || saveAccess.isPending}
            onChange={(checked) => saveAccess.mutate({ adminApprovalRequired: checked })}
          />
          <AccessToggle
            id="allowInvitations"
            label="Allow Invitations"
            checked={settings?.allowInvitations ?? true}
            disabled={!settings || saveAccess.isPending}
            onChange={(checked) => saveAccess.mutate({ allowInvitations: checked })}
          />
        </div>
      </div>

      <MembershipPermissionsTable />

      <RolesPermissionsTable />
    </div>
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
