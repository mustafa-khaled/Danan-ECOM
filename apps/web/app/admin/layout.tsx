export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="en" dir="ltr" data-theme="admin" className="min-h-dvh">
      {children}
    </div>
  );
}
