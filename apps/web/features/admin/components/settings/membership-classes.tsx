"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MoveRight } from "lucide-react";

const classes = [
  {
    id: 1,
    title: "Class A",
    description: "Full House Access",
    membersCount: 124,
  },
  {
    id: 2,
    title: "Class B",
    description: "Full House Access",
    membersCount: 542,
  },
  {
    id: 3,
    title: "Class C",
    description: "Full House Access",
    membersCount: 582,
  },
] as const;

export default function MembershipClasses() {
  return (
    <section>
      <Accordion type="single" collapsible>
        <AccordionItem value="house">
          <AccordionTrigger className="py-[16px] px-6 border-b border-[#E1E4E8]">
            <div className="text-[#29343D]">
              <h2 className="font-bold text-h5 leading-[100%]">
                Membership Classes
              </h2>
              <p className="text-[12px] font-semibold mt-3">
                Default rules for Class A, B and C
              </p>
            </div>
          </AccordionTrigger>

          <AccordionContent className="p-6">
            <div className="border-t border-b border-[#E1E4E8] pb-6">
              <h4 className="font-heading my-5 text-h4 font-bold">
                Membership Classes
              </h4>

              <div className="grid grid-cols-2 gap-x-[16px] gap-y-5">
                {classes.map((c) => {
                  return (
                    <div key={c.id} className="p-[16px] bg-[#FBF7F7]">
                      <h4 className="font-bold text-h4 text-[#272D35] leading-[100%]">
                        {c.title}
                      </h4>
                      <h5 className="text-body-lg font-semibold text-[#353D48] mt-3 mb-[16px]">
                        {c.description}
                      </h5>
                      <h6 className="text-h6 font-medium text-[#4B5563] uppercase">
                        {c.membersCount} Members
                      </h6>
                      <p className="mt-[16px] cursor-pointer text-[#BF7266] flex items-center justify-between font-semibold text-h5">
                        <span>Manege Permissions</span>
                        <MoveRight className="size-6" />
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
