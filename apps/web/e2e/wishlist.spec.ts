import { test, expect } from "@playwright/test";

const VALID_HOUSE_KEY = process.env.E2E_HOUSE_KEY ?? "dadan-vip-key-001";

/**
 * Coverage for the wish list at /beta/profile/wishlist. The seeded e2e member
 * (Amira Al-Rashid, house key dadan-vip-key-001) has three saved pieces.
 *
 * The unsave test mutates seeded SavedPiece rows, so this file runs serially.
 * No other spec reads SavedPiece, so there is no cross-file interference.
 */
test.describe.configure({ mode: "serial" });

test.describe("Wish list", () => {
  test.beforeEach(async ({ page }) => {
    // WelcomeModal's full-screen overlay intercepts header nav clicks.
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

  test("renders the saved pieces grid", async ({ page }) => {
    await page.goto("/beta/profile/wishlist");

    await expect(
      page.getByRole("heading", { name: /wish list/i }).first(),
    ).toBeVisible({ timeout: 15_000 });

    // The nav sidebar renders its own "Wish list" button, so scope to the card links.
    const cards = page.locator('a[href^="/beta/pieces/"], a[href^="/beta/profile/wardrobe/"]');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first()).toBeVisible();
  });

  test("marks the sidebar wish list entry as active", async ({ page }) => {
    await page.goto("/beta/profile/wishlist");

    const navLink = page
      .getByRole("link", { name: /wish list/i })
      .first();
    await expect(navLink).toBeVisible({ timeout: 15_000 });
    await expect(navLink.locator("button")).toHaveClass(/bg-ds-primary/);
  });

  test("redirects the legacy /beta/saved route", async ({ page }) => {
    await page.goto("/beta/saved");

    await expect(page).toHaveURL(/\/beta\/profile\/wishlist$/, {
      timeout: 15_000,
    });
  });

  test("opens a saved piece detail page", async ({ page }) => {
    await page.goto("/beta/profile/wishlist");

    const card = page
      .locator('a[href^="/beta/pieces/"], a[href^="/beta/profile/wardrobe/"]')
      .first();
    await expect(card).toBeVisible({ timeout: 15_000 });

    const href = await card.getAttribute("href");
    await card.click();

    await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: 15_000 });
  });

  test("unsaving a card removes it from the grid", async ({ page }) => {
    await page.goto("/beta/profile/wishlist");

    const cards = page.locator(
      'a[href^="/beta/pieces/"], a[href^="/beta/profile/wardrobe/"]',
    );
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    const before = await cards.count();

    // aria-label comes from the `piece.unsave` message.
    await page.getByRole("button", { name: /^unsave$/i }).first().click();

    await expect
      .poll(async () => cards.count(), { timeout: 15_000 })
      .toBe(before - 1);
  });
});
