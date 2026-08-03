"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useClientContext } from "@/shared/providers/client-context";
import { DesktopHeader } from "./DesktopHeader";
import { MobileMenuDrawer } from "./MobileMenuDrawer";

function getGreetingKey(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function SiteHeader() {
  const { displayName } = useClientContext();
  const t = useTranslations("greeting");
  const pathname = usePathname();
  const greeting = t(getGreetingKey());

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll & listen for Escape key when menu is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.body.style.overscrollBehavior = "";
      document.documentElement.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <DesktopHeader
        greeting={greeting}
        displayName={displayName}
        pathname={pathname}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        pathname={pathname}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
