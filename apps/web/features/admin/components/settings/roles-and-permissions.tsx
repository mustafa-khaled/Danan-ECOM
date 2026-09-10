"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MoveRight } from "lucide-react";

const rules = [
  {
    id: 1,
    title: "Super Admin",
    description: "Full House Access",
  },
  {
    id: 2,
    title: "Admin",
    description: "House Management",
  },
  {
    id: 3,
    title: "Curator",
    description: "Collections & Stories",
  },
  {
    id: 4,
    title: "Operations",
    description: "Members & Ownership",
  },
] as const;

export default function RolesAndPermissions() {
  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="house">
          <AccordionTrigger className="py-[16px] px-6 border-b border-[#E1E4E8]">
            <h2 className="font-bold text-h5 leading-[100%] text-[#29343D]">
              Roles & Permissions
            </h2>
          </AccordionTrigger>

          <AccordionContent className="p-6">
            <div className="border-t border-b border-[#E1E4E8] py-6">
              <div className="p-[16px] rounded-lg bg-[#FBF7F7] flex flex-col gap-5">
                {rules.map((r) => (
                  <div key={r.id}>
                    <h4 className="font-semibold text-h5 text-[272D35] leading-[100%]">
                      {r.title}
                    </h4>
                    <p className="text-h6 font-medium text-[#353D48] mt-3">
                      {r.description}
                    </p>
                  </div>
                ))}

                <p className="cursor-pointer text-[#BF7266] flex items-center justify-between font-semibold text-h5">
                  <span>Manege</span>
                  <MoveRight className="size-6" />
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
