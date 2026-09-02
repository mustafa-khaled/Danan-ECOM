import { describe, expect, it } from "vitest";
import { isSafePaymentRedirectUrl } from "./validate-payment-redirect";

describe("isSafePaymentRedirectUrl", () => {
  it("allows an https Tap 3DS host", () => {
    expect(
      isSafePaymentRedirectUrl("https://challenge.tap.company/3ds/abc"),
    ).toBe(true);
  });

  it("rejects a non-https Tap URL", () => {
    expect(isSafePaymentRedirectUrl("http://tap.company/3ds")).toBe(false);
  });

  it("rejects javascript and data URLs", () => {
    expect(isSafePaymentRedirectUrl("javascript:alert(1)")).toBe(false);
    expect(isSafePaymentRedirectUrl("data:text/html,hi")).toBe(false);
  });

  it("rejects an unrelated https host", () => {
    expect(isSafePaymentRedirectUrl("https://evil.example/phish")).toBe(false);
  });

  it("allows a same-origin mock 3DS return", () => {
    expect(
      isSafePaymentRedirectUrl(
        "http://localhost:3000/beta/checkout/return?tap_id=mock_1",
        "http://localhost:3000",
      ),
    ).toBe(true);
  });

  it("rejects a lookalike tap hostname", () => {
    expect(isSafePaymentRedirectUrl("https://tap.company.evil.com/x")).toBe(
      false,
    );
  });
});
