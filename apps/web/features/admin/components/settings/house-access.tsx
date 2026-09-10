"use client";

import { useState } from "react";
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

export default function HouseAccess() {
  const [keyValidity, setKeyValidity] = useState("12 months");

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
              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Private House Access
                </span>
                <Switch
                  id="accessKeyToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Private House Access"
                />
              </div>
              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Private Key Required
                </span>
                <Switch
                  id="privateKeyToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Private Key Required"
                />
              </div>

              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Admin Approval Required
                </span>
                <Switch
                  id="allowInvitations"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Admin Approval Required"
                />
              </div>
              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Allow Private Invitations
                </span>
                <Switch
                  id="adminApprovalToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Admin Approval"
                />
              </div>
            </div>

            <h4 className="font-heading my-5 text-h4 font-bold">House Key</h4>
            <div className="grid grid-cols-2 items-end gap-x-[32px] gap-y-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="language"
                  className="text-[#272D35] text-h6 font-medium"
                >
                  Key validity
                </label>
                <Select value={keyValidity} onValueChange={setKeyValidity}>
                  <SelectTrigger
                    id="keyValidity"
                    className="w-full border-none bg-[#F8FAFC] h-17.5 px-[16px] text-[#272D35]"
                  >
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12 months">12 months</SelectItem>
                    <SelectItem value="6 months">6 months</SelectItem>
                    <SelectItem value="3 months">3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Require key renewal
                </span>
                <Switch
                  id="accessKeyToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Private House Access"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
