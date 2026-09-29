import { test, expect } from "@playwright/test";

const VALID_HOUSE_KEY = process.env.E2E_HOUSE_KEY ?? "dadan-vip-key-001";

/**
 * Regression cover for the review finding "opening /beta/collections displays the
 * wrong content". The route always resolved; the page used to render the member's
 * owned/wishlist grid instead of the Collections catalog.
 */
test.describe("Collections catalog", () => {
  test.beforeEach(async ({ page }) => {
    // WelcomeModal opens on the first /beta/home visit of a fresh context and its
    // full-screen overlay intercepts the header nav click. Seeding the flag before
    // the app hydrates removes both the failure and the hydration race.
    await page.addInitScript(() => {
      try {
        localStorage.setItem("dadan_welcome_seen", "1");
      } catch {
        // Opaque origin has no localStorage; the real page load seeds it.
      }
    });
    await page.context().addCookies([
      { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
    ]);
    await page.goto("/beta");
    await page.fill("#house-key", VALID_HOUSE_KEY);
    await page.getByRole("button", { name: /house key/i }).click();
    await expect(page).toHaveURL(/\/beta\/home/, { timeout: 15_000 });
  });

  test("renders the catalog, not the member's wardrobe", async ({ page }) => {
    await page.goto("/beta/collections");

    await expect(
      page.getByRole("heading", { name: /^Collections$/i, level: 1 }),
    ).toBeVisible({ timeout: 15_000 });

    // Every card must point at a collection detail route.
    const cards = page.locator('a[href^="/beta/collections/"]');
    await expect(cards.first()).toBeVisible();

    // The old wrong content was the owned/wishlist tab pair.
    await expect(page.getByRole("button", { name: /wish list/i })).toHaveCount(0);
  });

  test("header Collections link opens the catalog", async ({ page }) => {
    await page.goto("/beta/home");
    await page
      .getByRole("navigation")
      .getByRole("link", { name: /^Collections$/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/beta\/collections$/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /^Collections$/i, level: 1 }),
    ).toBeVisible();
  });

  test("a catalog card opens its collection detail page", async ({ page }) => {
    await page.goto("/beta/collections");
    const firstCard = page.locator('a[href^="/beta/collections/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15_000 });

    const href = await firstCard.getAttribute("href");
    await firstCard.click();

    await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: 15_000 });
  });
});
