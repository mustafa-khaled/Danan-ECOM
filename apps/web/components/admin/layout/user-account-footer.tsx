import React from "react";
import { LogOut } from "lucide-react";
import { useLogout } from "@/features/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function UserAccountFooter() {
  const router = useRouter();

  const { logout, isPending } = useLogout();

  async function handleLogout() {
    try {
      await logout(undefined);
    } catch {
      /* ignore */
    }
    router.push("/admin/login");
  }

  return (
    <div className="px-3">
      <div className="rounded-lg bg-[#F6F6F5] px-3 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/admin/user-admin.png"
            alt="use logo"
            width={40}
            height={40}
            className="rounded-full"
          />

          <div className="text-[12px]">
            <h6 className="font-semibold text-[#212630] flex gap-1 items-center">
              Account Manger
              <Image
                src="/admin/verified-fill.svg"
                alt="verified icon"
                width={20}
                height={20}
              />
            </h6>
            <span className="text-[#9096A1]">ahmedgad@gmail.com</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isPending}
          title="Sign Out"
          className="p-2 rounded-xl text-ds-error hover:bg-ds-error-bg transition-colors shrink-0 cursor-pointer"
        >
          <LogOut className="size-6 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
