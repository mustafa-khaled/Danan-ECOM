import { cn } from "@/lib/utils";

const mainStyles =
  "w-full lg:h-[54px] h-[43px] lg:text-left lg:px-[12px] lg:text-[16px] text-[14px] bg-ds-surface font-bold transition-colors duration-200 cursor-pointer";

export default function Sidebar({
  activeTab,
  setActiveTab,
  t,
}: {
  activeTab: "collection" | "wishlist";
  setActiveTab: (tab: "collection" | "wishlist") => void;
  t: (key: string) => string;
}) {
  return (
    <aside className="w-full xl:w-113.5 shrink-0">
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("collection")}
          className={cn(
            mainStyles,
            activeTab === "collection" ? "bg-ds-primary" : "bg-ds-surface",
          )}
        >
          {t("myCollection")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("wishlist")}
          className={cn(
            mainStyles,
            activeTab === "wishlist" ? "bg-ds-primary" : "bg-ds-surface",
          )}
        >
          {t("wishList")}
        </button>
      </div>
    </aside>
  );
}
