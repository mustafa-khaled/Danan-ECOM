export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="admin" className="min-h-dvh">
      {children}
    </div>
  );
}
