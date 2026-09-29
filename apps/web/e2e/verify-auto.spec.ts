import { test, expect, type Page } from "@playwright/test";

const VALID_HOUSE_KEY = process.env.E2E_HOUSE_KEY ?? "dadan-vip-key-001";
const LOCALE_COOKIE = {
  name: "NEXT_LOCALE",
  value: "en",
  domain: "localhost",
  path: "/",
} as const;

/**
 * Regression cover for certificate verification.
 *
 * Verification runs server-side: opening /beta/verify?serial=..&token=..
 * executes fetchVerification() in the server component, so the result ships in
 * the RSC payload and a soft navigation and a hard reload of the same URL
 * render identically. The client only verifies on an explicit form submit, via
 * POST /verify.
 *
 * The public QR link printed on certificates (/verify?serial=..&token=..,
 * rewritten to /en/verify) uses the same server-side path, so it must render
 * the result too.
 *
 * Assertions avoid hardcoding a serial or verification token: seed.ts derives
 * the token from the randomly generated certificate id, so any literal breaks
 * on re-seed. The flow is driven the way a customer drives it — open an owned
 * piece, press "Verify Authenticity".
 */

async function loginClient(page: Page) {
  await page.goto("/beta");
  await page.fill("#house-key", VALID_HOUSE_KEY);
  await page.getByRole("button", { name: /house key/i }).click();
  const formError = page.locator("form [role=alert]");
  if (await formError.isVisible({ timeout: 2_000 }).catch(() => false)) {
    throw new Error(`Login failed: ${(await formError.textContent())?.trim()}`);
  }
  await expect(page).toHaveURL(/\/beta\/home/, { timeout: 15_000 });
}

async function openOwnedPiece(page: Page) {
  await page.goto("/beta/profile/wardrobe");
  const pieceLink = page.locator('a[href^="/beta/profile/wardrobe/"]').first();
  await expect(pieceLink).toBeVisible({ timeout: 15_000 });
  await pieceLink.click();
  await expect(page.getByRole("button", { name: /verify authenticity/i })).toBeVisible({
    timeout: 15_000,
  });
}

/** Drives the customer path: owned piece → Verify Authenticity → soft nav. */
async function verifyOwnedPiece(page: Page) {
  await openOwnedPiece(page);
  await page.getByRole("button", { name: /verify authenticity/i }).click();
  await expect(page).toHaveURL(/\/beta\/verify\?serial=.+&token=/, { timeout: 20_000 });
}

function credentialsFromUrl(page: Page) {
  const url = new URL(page.url());
  return {
    serial: url.searchParams.get("serial") ?? "",
    token: url.searchParams.get("token") ?? "",
  };
}

const serialInput = (page: Page) => page.getByLabel(/serial number/i);
const tokenInput = (page: Page) => page.getByLabel(/verification token/i);
const submitButton = (page: Page) => page.locator('form button[type="submit"]').first();
const resultCard = (page: Page) => page.getByText(/verified piece/i).first();

/** The form must be usable again once verification settles. */
async function expectFormRecovered(page: Page) {
  await expect(serialInput(page)).toBeEnabled();
  await expect(tokenInput(page)).toBeEnabled();
  await expect(submitButton(page)).toBeEnabled();
}

test.describe("Certificate verification", () => {
  test.beforeEach(async ({ page }) => {
    // The welcome modal overlays the header on a fresh context and would
    // intercept navigation clicks.
    await page.addInitScript(() => {
      try {
        localStorage.setItem("dadan_welcome_seen", "1");
      } catch {
        // Opaque origin has no localStorage.
      }
    });
    await page.context().addCookies([LOCALE_COOKIE]);
    await loginClient(page);
  });

  test("renders the server-side result on soft navigation and hard reload", async ({
    page,
  }) => {
    await verifyOwnedPiece(page);

    // Soft navigation: the result arrives with the server-rendered page.
    await expect(resultCard(page)).toBeVisible({ timeout: 20_000 });
    await expect(serialInput(page)).toHaveValue(/DADAN-\d{4}-[A-Z]{2}-\d{6}/);
    await expect(tokenInput(page)).not.toHaveValue("");
    await expectFormRecovered(page);

    const { serial, token } = credentialsFromUrl(page);
    expect(serial).toMatch(/DADAN-\d{4}-[A-Z]{2}-\d{6}/);
    expect(token).not.toBe("");

    // Hard reload of the very same URL must reach the same terminal state.
    await page.reload();
    await expect(resultCard(page)).toBeVisible({ timeout: 20_000 });
    await expectFormRecovered(page);
  });

  test("manual re-verification disables the form while pending, then renders weight and issued date", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await verifyOwnedPiece(page);
    await expect(resultCard(page)).toBeVisible({ timeout: 20_000 });

    // Hold the client-side POST open so the pending state is observable without
    // outlasting the request timeout.
    await page.route("**/backend/verify", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });

    await submitButton(page).click();

    // Submitting clears the previous result; the form is disabled in flight.
    await expect(serialInput(page)).toBeDisabled();
    await expect(tokenInput(page)).toBeDisabled();
    await expect(submitButton(page)).toBeDisabled();
    await expect(resultCard(page)).toBeHidden();

    // A slow response must still settle — never wedge the form.
    await expect(resultCard(page)).toBeVisible({ timeout: 25_000 });
    await expectFormRecovered(page);

    // verify.weight and verify.issuedAt were absent from both locales, so these
    // two rows rendered their raw key and logged a MISSING_MESSAGE.
    await expect(page.getByText("Weight", { exact: true })).toBeVisible();
    await expect(page.getByText("Issued At", { exact: true })).toBeVisible();
    expect(consoleErrors.filter((e) => e.includes("MISSING_MESSAGE"))).toEqual([]);
  });

  test("the public QR link verifies server-side", async ({ page }) => {
    await verifyOwnedPiece(page);
    await expect(resultCard(page)).toBeVisible({ timeout: 20_000 });
    const { serial, token } = credentialsFromUrl(page);

    // The URL printed in the certificate QR code: /verify → /en/verify.
    await page.goto(
      `/verify?serial=${encodeURIComponent(serial)}&token=${encodeURIComponent(token)}`,
    );

    await expect(resultCard(page)).toBeVisible({ timeout: 20_000 });
    await expect(serialInput(page)).toHaveValue(serial);
    await expectFormRecovered(page);
  });
});
