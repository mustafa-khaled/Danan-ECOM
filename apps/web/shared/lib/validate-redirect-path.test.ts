import { describe, expect, it } from "vitest";
import { validateRedirectPath } from "./validate-redirect-path";

describe("validateRedirectPath", () => {
  it("returns default when next is null or empty", () => {
    expect(validateRedirectPath(null)).toBe("/beta/home");
    expect(validateRedirectPath(undefined)).toBe("/beta/home");
    expect(validateRedirectPath("")).toBe("/beta/home");
  });

  it("allows valid /beta paths", () => {
    expect(validateRedirectPath("/beta/home")).toBe("/beta/home");
    expect(validateRedirectPath("/beta/cart")).toBe("/beta/cart");
    expect(validateRedirectPath("/beta")).toBe("/beta");
  });

  it("blocks open redirects", () => {
    expect(validateRedirectPath("//evil.com")).toBe("/beta/home");
    expect(validateRedirectPath("https://evil.com")).toBe("/beta/home");
    expect(validateRedirectPath("/\\evil.com")).toBe("/beta/home");
    expect(validateRedirectPath("javascript:alert(1)")).toBe("/beta/home");
  });

  // The 3-D Secure return needs its ?tap_id= to survive a re-login.
  it("preserves the query string on allowed paths", () => {
    expect(validateRedirectPath("/beta/checkout/return?tap_id=chg_123")).toBe(
      "/beta/checkout/return?tap_id=chg_123",
    );
  });

  it("blocks paths outside /beta", () => {
    expect(validateRedirectPath("/admin/overview")).toBe("/beta/home");
    expect(validateRedirectPath("/")).toBe("/beta/home");
  });

  it("blocks dot-segment path traversal out of /beta", () => {
    expect(validateRedirectPath("/beta/../admin")).toBe("/beta/home");
    expect(validateRedirectPath("/beta/../../etc/passwd")).toBe("/beta/home");
    expect(validateRedirectPath("/beta/./../../admin")).toBe("/beta/home");
    expect(validateRedirectPath("/beta/cart/..")).toBe("/beta/home");
  });
});
