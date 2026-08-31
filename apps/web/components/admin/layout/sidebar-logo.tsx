import Image from "next/image";

export default function SidebarLogo() {
  return (
    <div className="h-21.5 flex items-center justify-between gap-2 border-b border-[#E0E2E5] px-4.75">
      <div>
        <h1 className="font-heading font-semibold text-h5 text-neutral-900">
          The House of DADAN
        </h1>
        <p className="text-neutral-600 font-medium text-[12px]">
          A Private House of Craftsmanship
        </p>
      </div>
      <Image
        src="/admin/admin-logo.png"
        alt="Dadan Logo"
        width={41}
        height={35}
      />
    </div>
  );
}
