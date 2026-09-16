"use client";

import { useEffect, useState } from "react";
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
import {
  fetchHouseSettings,
  updateHouseSettings,
} from "@/features/admin/api/fetch-admin-settings";
import { useTranslations } from "next-intl";

export default function General() {
  const t = useTranslations("admin");
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["admin-house-settings"],
    queryFn: () => fetchHouseSettings(),
  });
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("utc");
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
    setLanguage(settings.locale);
    setTimezone(settings.timezone);
  }, [settingsQuery.data]);

  const save = useMutation({
    mutationFn: () =>
      updateHouseSettings({
        houseName,
        description,
        contactEmail,
        supportContact,
        locale: language,
        timezone,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-house-settings"] }),
  });

  return (
    <section>
      <Accordion type="single" collapsible defaultValue="house">
        <AccordionItem value="house">
          <AccordionTrigger className="py-[16px] px-6 border-b border-[#E1E4E8]">
            <div className="text-[#29343D]">
              <h2 className="font-bold text-h5 leading-[100%]">{t("settings.general")}</h2>
              <p className="text-[12px] font-semibold mt-3">
                {t("settings.generalHint")}
              </p>
            </div>
          </AccordionTrigger>

          <AccordionContent className="p-6">
            <h4 className="font-heading mb-5 text-h4 font-bold">
              {t("settings.houseInfo")}
            </h4>
            <div className="grid py-5 border-t  border-b border-[#E1E4E8] grid-cols-2 gap-x-[32px] gap-y-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="houseName" className="text-[#272D35] text-h6 font-medium">
                  {t("settings.houseName")}
                </label>
                <input
                  type="text"
                  name="houseName"
                  id="houseName"
                  value={houseName}
                  onChange={(e) => setHouseName(e.target.value)}
                  placeholder="Enter house name"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-[#272D35] text-h6 font-medium">
                  {t("common.description")}
                </label>
                <input
                  type="text"
                  name="description"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="contactEmail" className="text-[#272D35] text-h6 font-medium">
                  {t("settings.contactEmail")}
                </label>
                <input
                  type="text"
                  name="contactEmail"
                  id="contactEmail"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="[EMAIL_ADDRESS]"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="supportContact" className="text-[#272D35] text-h6 font-medium">
                  {t("settings.supportContact")}
                </label>
                <input
                  type="text"
                  name="supportContact"
                  id="supportContact"
                  value={supportContact}
                  onChange={(e) => setSupportContact(e.target.value)}
                  placeholder="***"
                  className="border-none bg-[#F8FAFC] h-17.5 p-[16px]"
                />
              </div>
            </div>

            <h4 className="font-heading my-5 text-h4 font-bold">{t("settings.regional")}</h4>
            <div className="grid grid-cols-2 gap-x-[32px] gap-y-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="language" className="text-[#272D35] text-h6 font-medium">
                  {t("settings.language")}
                </label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger
                    id="language"
                    className="w-full border-none bg-[#F8FAFC] h-17.5 px-[16px] text-[#272D35]"
                  >
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t("settings.english")}</SelectItem>
                    <SelectItem value="ar">{t("settings.arabic")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="timezone" className="text-[#272D35] text-h6 font-medium">
                  {t("settings.timezone")}
                </label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger
                    id="timezone"
                    className="w-full border-none bg-[#F8FAFC] h-17.5 px-[16px] text-[#272D35]"
                  >
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC (Gulf Standard Time - 4)</SelectItem>
                    <SelectItem value="Asia/Riyadh">GST (Gulf Standard Time)</SelectItem>
                    <SelectItem value="est">EST (Eastern Standard Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                type="button"
                onClick={() => save.mutate()}
                className="w-24 h-11 bg-[#BF7266] rounded-lg text-[14px] font-medium text-white"
              >
                {t("common.save")}
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
