"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "'Manrope', system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#FFFFFF",
            color: "#1A1A1A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: "2.25rem",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: "#555555",
                marginBottom: "2rem",
                lineHeight: 1.6,
              }}
            >
              A critical error occurred. Please refresh the page or try again later.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#9CA3AF",
                  marginBottom: "1.5rem",
                  fontFamily: "monospace",
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#B56B5D",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "0.9375rem",
                }}
              >
                Try Again
              </button>
              <Link
                href="/"
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "transparent",
                  color: "#1A1A1A",
                  border: "1px solid #D4D4D4",
                  borderRadius: "6px",
                  fontWeight: 500,
                  textDecoration: "none",
                  fontSize: "0.9375rem",
                }}
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
