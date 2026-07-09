import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-4 font-display text-6xl text-ivory">404</h1>
        <h2 className="mb-4 font-display text-2xl text-ivory">
          Page Not Found
        </h2>
        <p className="mb-8 text-ivory-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-[var(--radius-button)] bg-ivory px-6 py-3 font-medium text-void transition-opacity hover:opacity-90"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
