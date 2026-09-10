"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui";

export default function SystemNotifications() {
  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="house">
          <AccordionTrigger className="py-[16px] px-6 border-b border-[#E1E4E8]">
            <h2 className="font-bold text-h5 leading-[100%] text-[#29343D]">
              System Notifications
            </h2>
          </AccordionTrigger>

          <AccordionContent className="p-6">
            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Ownership Transfer Request
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
                  Transfer Completed
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
                  New Member Invitation
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
                  Certificate Issued
                </span>
                <Switch
                  id="adminApprovalToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Admin Approval"
                />
              </div>
              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">Access Request</span>
                <Switch
                  id="adminApprovalToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Admin Approval"
                />
              </div>

              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5">
                <span className="text-h6 text-[#5D697A]">
                  Payment Completed
                </span>
                <Switch
                  id="adminApprovalToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Admin Approval"
                />
              </div>

              <div className="flex items-center justify-between p-[16px] bg-[#F8FAFC] h-17.5 col-span-2">
                <span className="text-h6 text-[#5D697A]">Payment Failed</span>
                <Switch
                  id="adminApprovalToggle"
                  variant="success"
                  defaultChecked={true}
                  aria-label="Admin Approval"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
