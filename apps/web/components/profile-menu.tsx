"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { User, LogOut } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useClientLogout } from "@/features/auth";
import { cn } from "@/lib/utils";

interface ProfileMenuProps {
  className?: string;
  triggerClassName?: string;
  iconSize?: number;
  onNavigate?: () => void;
}

export function ProfileMenu({
  className,
  triggerClassName,
  iconSize = 24,
  onNavigate,
}: ProfileMenuProps) {
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const { logout, isPending } = useClientLogout();

  const [selectedValue, setSelectedValue] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  function handleValueChange(value: string) {
    if (value === "profile") {
      onNavigate?.();
      router.push("/beta/profile/wardrobe");
    } else if (value === "logout") {
      setIsConfirmOpen(true);
    }
    // Reset so the select can be triggered repeatedly
    setSelectedValue("");
  }

  async function handleConfirmLogout() {
    await logout();
    setIsConfirmOpen(false);
    onNavigate?.();
    router.push("/beta");
    router.refresh();
  }

  return (
    <>
      <div className={cn("relative inline-flex items-center", className)}>
        <Select value={selectedValue} onValueChange={handleValueChange}>
          <SelectTrigger
            size="sm"
            aria-label={tNav("profile")}
            className={cn(
              "h-auto min-h-0 cursor-pointer border-none! bg-transparent px-0 py-0 shadow-none focus-visible:shadow-none focus-visible:border-none! flex items-center justify-center text-ds-secondary transition-colors hover:text-ds-text [&>svg:last-child]:hidden",
              triggerClassName,
            )}
          >
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2Z" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </SelectTrigger>
          <SelectContent align="end" className="min-w-44">
            <SelectItem
              value="profile"
              className="cursor-pointer flex items-center gap-2 py-2"
            >
              <div className="flex items-center gap-2">
                <User className="size-4 text-ds-text-secondary" aria-hidden />
                <span>{tNav("profile")}</span>
              </div>
            </SelectItem>
            <SelectItem
              value="logout"
              className="cursor-pointer flex items-center gap-2 py-2 text-ds-error focus:text-ds-error focus:bg-ds-surface"
            >
              <div className="flex items-center gap-2">
                <LogOut className="size-4 text-ds-error" aria-hidden />
                <span>{tAuth("logout")}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Modal
        open={isConfirmOpen}
        onClose={() => !isPending && setIsConfirmOpen(false)}
        title={tAuth("confirmLogoutTitle")}
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isPending}
            >
              {tAuth("cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmLogout}
              loading={isPending}
            >
              {tAuth("logout")}
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-ds-text-secondary">
          {tAuth("confirmLogoutMessage")}
        </p>
      </Modal>
    </>
  );
}
