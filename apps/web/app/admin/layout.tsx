import "./admin.css";

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="en" dir="ltr" data-theme="admin" className="admin-shell min-h-dvh">
      {children}
    </div>
  );
}
