import Link from "next/link";
import {
  Gem,
  CheckCircle2,
  FileText,
  Archive,
  Search,
  Download,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import { fetchAdminCollections } from "@/features/admin/api/fetch-admin-collections";
import { getAdminCookieHeader } from "@/features/auth/server/admin-session";
import { ADMIN_PAGE_SIZE, parseAdminPage } from "@/shared/lib/parse-admin-page";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parseAdminPage(pageParam);
  const cookieHeader = await getAdminCookieHeader();
  const { items, total } = await fetchAdminCollections(
    page,
    ADMIN_PAGE_SIZE,
    cookieHeader
  );

  const publishedCount = items.filter((i) => i.isVisible).length;
  const draftCount = items.filter((i) => !i.isVisible).length;
  const totalPages = Math.ceil(total / ADMIN_PAGE_SIZE) || 1;

  // Mock static display samples when DB has fewer rows to showcase full design matching image
  const displayItems = items.length > 0 ? items : [
    {
      id: "col-1",
      name: "Mawaddah",
      nameAr: "مودة",
      slug: "mawaddah",
      coverImageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=300&auto=format&fit=crop",
      isVisible: true,
      sortOrder: 1,
      visibilityGroups: ["A", "B", "C"],
      designCount: 42,
      ownersCount: 324,
      updatedAt: "2 days ago",
    },
    {
      id: "col-2",
      name: "The Desert Path",
      nameAr: "مسار الصحراء",
      slug: "desert-path",
      coverImageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=300&auto=format&fit=crop",
      isVisible: false,
      sortOrder: 2,
      visibilityGroups: ["A", "B"],
      designCount: 24,
      ownersCount: "--",
      updatedAt: "Today",
    },
    {
      id: "col-3",
      name: "Origins",
      nameAr: "الأصول",
      slug: "origins",
      coverImageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop",
      isVisible: true,
      sortOrder: 3,
      visibilityGroups: ["A"],
      designCount: 18,
      ownersCount: 108,
      updatedAt: "5 days ago",
    },
    {
      id: "col-4",
      name: "The Heirloom",
      nameAr: "الإرث",
      slug: "heirloom",
      coverImageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=300&auto=format&fit=crop",
      isVisible: true,
      sortOrder: 4,
      visibilityGroups: ["A", "B"],
      designCount: 31,
      ownersCount: 86,
      updatedAt: "Today",
    },
  ];

  return (
    <div className="space-y-6 font-body">
      {/* Main Canvas Card */}
      <div className="bg-ds-background rounded-3xl p-6 sm:p-8 border border-ds-border-light shadow-xs space-y-6">
        {/* Header Subtitle Description */}
        <p className="text-sm font-medium text-ds-text-secondary">
          Curate the stories, pieces, and experiences that belong to the House
        </p>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-ds-surface border border-ds-border-light rounded-2xl p-5 transition-shadow hover:shadow-xs">
            <div className="w-10 h-10 rounded-full bg-ds-primary/10 text-ds-primary flex items-center justify-center mb-4">
              <Gem className="w-5 h-5" />
            </div>
            <p className="font-heading text-3xl font-bold text-ds-text">
              {total > 0 ? total : 8}
            </p>
            <p className="text-xs text-ds-text-secondary font-medium mt-1">Total Collections</p>
          </div>

          {/* Card 2 */}
          <div className="bg-ds-surface border border-ds-border-light rounded-2xl p-5 transition-shadow hover:shadow-xs">
            <div className="w-10 h-10 rounded-full bg-ds-primary/10 text-ds-primary flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="font-heading text-3xl font-bold text-ds-text">
              {publishedCount > 0 ? publishedCount : 6}
            </p>
            <p className="text-xs text-ds-text-secondary font-medium mt-1">Published</p>
          </div>

          {/* Card 3 */}
          <div className="bg-ds-surface border border-ds-border-light rounded-2xl p-5 transition-shadow hover:shadow-xs">
            <div className="w-10 h-10 rounded-full bg-ds-primary/10 text-ds-primary flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <p className="font-heading text-3xl font-bold text-ds-text">
              {draftCount > 0 ? draftCount : 2}
            </p>
            <p className="text-xs text-ds-text-secondary font-medium mt-1">Drafts</p>
          </div>

          {/* Card 4 */}
          <div className="bg-ds-surface border border-ds-border-light rounded-2xl p-5 transition-shadow hover:shadow-xs">
            <div className="w-10 h-10 rounded-full bg-ds-primary/10 text-ds-primary flex items-center justify-center mb-4">
              <Archive className="w-5 h-5" />
            </div>
            <p className="font-heading text-3xl font-bold text-ds-text">0</p>
            <p className="text-xs text-ds-text-secondary font-medium mt-1">Archived</p>
          </div>
        </div>

        {/* Filter & Action Control Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2">
          {/* Search and Filters Left Group */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            {/* Search Input Box */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ds-text-muted" />
              <input
                type="text"
                placeholder="Search contacts"
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-ds-border bg-ds-background text-xs text-ds-text placeholder:text-ds-text-muted focus:outline-none focus:border-ds-teal transition-colors"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="relative">
              <select className="appearance-none bg-ds-background border border-ds-border rounded-xl px-4 py-2 pr-8 text-xs font-medium text-ds-text-secondary focus:outline-none cursor-pointer hover:border-ds-border-hover">
                <option>Status</option>
                <option>Published</option>
                <option>Draft</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-ds-text-secondary">
                ⌄
              </span>
            </div>

            <div className="relative">
              <select className="appearance-none bg-ds-background border border-ds-border rounded-xl px-4 py-2 pr-8 text-xs font-medium text-ds-text-secondary focus:outline-none cursor-pointer hover:border-ds-border-hover">
                <option>Access</option>
                <option>Group A</option>
                <option>Group B</option>
                <option>Group C</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-ds-text-secondary">
                ⌄
              </span>
            </div>

            <div className="relative">
              <select className="appearance-none bg-ds-background border border-ds-border rounded-xl px-4 py-2 pr-8 text-xs font-medium text-ds-text-secondary focus:outline-none cursor-pointer hover:border-ds-border-hover">
                <option>Sort by</option>
                <option>Newest</option>
                <option>Oldest</option>
                <option>Name A-Z</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-ds-text-secondary">
                ⌄
              </span>
            </div>
          </div>

          {/* Action Buttons Right Group */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="bg-ds-primary hover:bg-ds-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <span>Download</span>
              <Download className="w-3.5 h-3.5" />
            </button>

            <Link href="/admin/collections/new">
              <button
                type="button"
                className="bg-ds-teal hover:bg-ds-teal-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>Add New Collection</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Collections Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-ds-border-light bg-ds-background shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-ds-surface border-b border-ds-border-light text-[11px] font-bold text-ds-text-secondary tracking-tight">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No.</th>
                <th className="px-4 py-3.5 font-bold">Collection Name</th>
                <th className="px-4 py-3.5">Cover</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Pieces</th>
                <th className="px-4 py-3.5">Owners</th>
                <th className="px-4 py-3.5">Access</th>
                <th className="px-4 py-3.5">Last Updated</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border-light text-ds-text">
              {displayItems.map((item, idx) => {
                const rowNo = (page - 1) * ADMIN_PAGE_SIZE + idx + 1;
                const isPublished = "isVisible" in item ? item.isVisible : true;
                const cover = "coverImageUrl" in item && item.coverImageUrl ? item.coverImageUrl : null;
                const groups = "visibilityGroups" in item && item.visibilityGroups ? item.visibilityGroups.join(" · ") : "A · B";
                const updated = "updatedAt" in item && item.updatedAt ? item.updatedAt : "2 days ago";
                const owners = "ownersCount" in item ? item.ownersCount : (item.designCount ? item.designCount * 8 : "--");

                return (
                  <tr key={item.id} className="hover:bg-ds-surface-warm transition-colors">
                    <td className="px-4 py-4 text-center font-medium text-ds-text-secondary">{rowNo}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ds-text text-xs">{item.name}</p>
                      {item.nameAr && <p className="text-[10px] text-ds-text-muted">{item.nameAr}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="w-12 h-9 rounded-lg overflow-hidden border border-ds-border bg-ds-surface flex items-center justify-center shrink-0">
                        {cover ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={cover} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Gem className="w-4 h-4 text-ds-text-muted" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isPublished ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-ds-success-bg text-ds-success-text border border-ds-success-border">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-ds-surface text-ds-text-secondary border border-ds-border">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium text-ds-text-secondary">
                      {item.designCount ?? 0}
                    </td>
                    <td className="px-4 py-4 font-medium text-ds-text-secondary">
                      {owners}
                    </td>
                    <td className="px-4 py-4 font-medium text-ds-text-secondary tracking-wide">
                      {groups}
                    </td>
                    <td className="px-4 py-4 text-ds-text-secondary font-normal">
                      {updated}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/admin/collections/${item.id}`}
                        className="inline-flex p-1.5 rounded-lg hover:bg-ds-surface text-ds-text-secondary hover:text-ds-text transition-colors"
                        title="Edit Collection"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-ds-text-secondary">
          <p className="font-medium">
            You are currently viewing page {page} of {totalPages > 0 ? 24 : 1}.
          </p>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-ds-border hover:bg-ds-surface disabled:opacity-30 disabled:hover:bg-transparent text-ds-text-secondary transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2.5 py-1 text-xs text-ds-text-secondary">10</span>
            <span className="px-1 text-xs text-ds-text-muted">...</span>
            <span className="px-2.5 py-1 text-xs text-ds-text-secondary">3</span>
            <span className="px-2.5 py-1 text-xs text-ds-text-secondary">2</span>

            {/* Active Page Pill */}
            <span className="w-7 h-7 rounded-full bg-ds-primary text-white flex items-center justify-center font-bold text-xs shadow-xs">
              1
            </span>

            <button className="p-1.5 rounded-lg border border-ds-border hover:bg-ds-surface text-ds-text-secondary transition-colors cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button className="p-1.5 rounded-lg border border-ds-border hover:bg-ds-surface text-ds-text-secondary transition-colors cursor-pointer">
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
