"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ApiError } from "@/shared/lib/send-request";
import {
  createAdminStaff,
  fetchAdminStaff,
  updateAdminStaff,
} from "@/features/admin/api/fetch-admin-settings";
import { useTranslations } from "next-intl";

const RULE_KEYS = [
  { id: 1, title: "superAdmin", description: "superAdminDesc" },
  { id: 2, title: "adminRole", description: "adminRoleDesc" },
  { id: 3, title: "curator", description: "curatorDesc" },
  { id: 4, title: "operationsRole", description: "operationsRoleDesc" },
] as const;

const STAFF_ROLES = ["SUPER_ADMIN", "STAFF", "CURATOR", "OPERATIONS", "VIEWER"] as const;

export default function RolesAndPermissions() {
  const t = useTranslations("admin.settings");
  const queryClient = useQueryClient();
  const staffQuery = useQuery({
    queryKey: ["admin-staff"],
    queryFn: () => fetchAdminStaff(),
    retry: false,
  });
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<(typeof STAFF_ROLES)[number]>("STAFF");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () => createAdminStaff({ email, displayName, role }),
    onSuccess: (staff) => {
      setTempPassword(staff.temporaryPassword);
      setEmail("");
      setDisplayName("");
      setRole("STAFF");
      void queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
  });
  const update = useMutation({
    mutationFn: (payload: { id: string; isActive?: boolean; role?: string }) =>
      updateAdminStaff(payload.id, {
        isActive: payload.isActive,
        role: payload.role,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-staff"] }),
  });

  const canManageStaff = !(
    staffQuery.error instanceof ApiError && staffQuery.error.status === 403
  );

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!email || !displayName) return;
    create.mutate();
  }

  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="house">
          <AccordionTrigger className="py-[16px] px-6 border-b border-[#E1E4E8]">
            <h2 className="font-bold text-h5 leading-[100%] text-[#29343D]">
              {t("roles")}
            </h2>
          </AccordionTrigger>

          <AccordionContent className="p-6">
            <div className="border-t border-b border-[#E1E4E8] py-6">
              <div className="p-[16px] rounded-lg bg-[#FBF7F7] flex flex-col gap-5">
                {RULE_KEYS.map((r) => (
                  <div key={r.id}>
                    <h4 className="font-semibold text-h5 text-[272D35] leading-[100%]">
                      {t(r.title)}
                    </h4>
                    <p className="text-h6 font-medium text-[#353D48] mt-3">
                      {t(r.description)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {canManageStaff && (
              <div className="mt-6 space-y-4">
                <h4 className="font-heading text-h5 font-bold">Staff users</h4>
                {tempPassword && (
                  <p className="text-sm text-[#353D48] bg-[#F8FAFC] p-3 rounded-lg">
                    Temporary password (shown once): <strong>{tempPassword}</strong>
                  </p>
                )}
                <form onSubmit={handleCreate} className="grid grid-cols-4 gap-3 items-end">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="border-none bg-[#F8FAFC] h-12 px-4"
                    required
                  />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    className="border-none bg-[#F8FAFC] h-12 px-4"
                    required
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as (typeof STAFF_ROLES)[number])}
                    className="border-none bg-[#F8FAFC] h-12 px-4"
                  >
                    {STAFF_ROLES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={create.isPending}
                    className="h-12 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
                  >
                    Add staff
                  </button>
                </form>
                <div className="space-y-2">
                  {(staffQuery.data ?? []).map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between bg-[#F8FAFC] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-[#272D35]">{staff.displayName}</p>
                        <p className="text-sm text-[#5D697A]">{staff.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={staff.role}
                          disabled={update.isPending}
                          onChange={(e) =>
                            update.mutate({ id: staff.id, role: e.target.value })
                          }
                          className="border-none bg-white h-10 px-3 text-sm"
                        >
                          {STAFF_ROLES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={update.isPending}
                          onClick={() =>
                            update.mutate({ id: staff.id, isActive: !staff.isActive })
                          }
                          className="text-sm font-medium text-[#BF7266]"
                        >
                          {staff.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
