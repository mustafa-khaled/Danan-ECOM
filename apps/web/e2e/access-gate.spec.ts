import { test, expect } from "@playwright/test";

const VALID_HOUSE_KEY = process.env.E2E_HOUSE_KEY ?? "dadan-vip-key-001";

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([
    { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
  ]);
});

test.describe("Access Gate", () => {
  test("shows access gate page", async ({ page }) => {
    await page.goto("/beta");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows error on invalid house key", async ({ page }) => {
    await page.goto("/beta");
    await page.fill("#house-key", "invalid-key-12345");
    await page.getByRole("button", { name: /house key/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Language Toggle", () => {
  test("page has lang and dir attributes", async ({ page }) => {
    await page.goto("/beta");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", /ar|en/);
    await expect(html).toHaveAttribute("dir", /rtl|ltr/);
  });

  test("toggles locale via switcher", async ({ page }) => {
    await page.goto("/beta");
    const initialLang = await page.locator("html").getAttribute("lang");
    await page.getByRole("button", { name: /switch|التبديل/i }).click();
    await expect(page.locator("html")).not.toHaveAttribute("lang", initialLang ?? "", {
      timeout: 10_000,
    });
  });
});

test.describe("Authentication", () => {
  test("redirects unauthenticated users from protected routes", async ({ page }) => {
    await page.goto("/beta/home");
    await expect(page).toHaveURL(/\/beta(\?next=.*)?$/);
  });

  test("logs in with a valid house key", async ({ page }) => {
    await page.goto("/beta");
    await page.fill("#house-key", VALID_HOUSE_KEY);
    await page.getByRole("button", { name: /house key/i }).click();
    await expect(page).toHaveURL(/\/beta\/home/, { timeout: 15_000 });
  });

  test("blocks open redirect after login", async ({ page }) => {
    await page.goto("/beta?next=https://evil.com");
    await page.fill("#house-key", VALID_HOUSE_KEY);
    await page.getByRole("button", { name: /house key/i }).click();
    await expect(page).toHaveURL(/\/beta\/home/, { timeout: 15_000 });
    expect(page.url()).not.toContain("evil.com");
  });
});

test.describe("Checkout smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/beta");
    await page.fill("#house-key", VALID_HOUSE_KEY);
    await page.getByRole("button", { name: /house key/i }).click();
    await expect(page).toHaveURL(/\/beta\/home/, { timeout: 15_000 });
  });

  test("checkout page loads for authenticated user", async ({ page }) => {
    await page.goto("/beta/checkout");
    await expect(page.getByRole("heading", { name: /^Checkout$/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
