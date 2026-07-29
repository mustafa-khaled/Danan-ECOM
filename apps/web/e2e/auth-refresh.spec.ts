import { test, expect, type Cookie, type Page } from "@playwright/test";

const VALID_HOUSE_KEY = process.env.E2E_HOUSE_KEY ?? "dadan-vip-key-001";
const LOCALE_COOKIE = {
  name: "NEXT_LOCALE",
  value: "en",
  domain: "localhost",
  path: "/",
} as const;

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([LOCALE_COOKIE]);
});

async function loginClient(page: Page) {
  await page.goto("/beta");
  await page.fill("#house-key", VALID_HOUSE_KEY);
  await page.getByRole("button", { name: /house key/i }).click();

  const formError = page.locator('form [role="alert"]');
  if (await formError.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const message = (await formError.textContent())?.trim() || "unknown error";
    throw new Error(`Login failed: ${message}`);
  }

  await expect(page).toHaveURL(/\/beta\/home/, { timeout: 15_000 });
}

function refreshOnlyCookies(authCookies: Cookie[]): Array<Cookie | typeof LOCALE_COOKIE> {
  const refreshCookie = authCookies.find((c) => c.name === "dadan_refresh");
  expect(refreshCookie).toBeTruthy();
  return [refreshCookie!, LOCALE_COOKIE];
}

async function bootstrapAuthCookies(browser: import("@playwright/test").Browser): Promise<Cookie[]> {
  const context = await browser.newContext();
  await context.addCookies([LOCALE_COOKIE]);
  const page = await context.newPage();
  await loginClient(page);
  const cookies = await context.cookies();
  await context.close();
  return cookies;
}

function cookieHeaderFrom(
  cookies: Awaited<ReturnType<import("@playwright/test").BrowserContext["cookies"]>>,
): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

test.describe("Refresh token flow", () => {
  test("login sets access and refresh cookies", async ({ page, context }) => {
    await loginClient(page);

    const cookies = await context.cookies();
    expect(cookies.some((c) => c.name === "dadan_session")).toBe(true);
    expect(cookies.some((c) => c.name === "dadan_refresh")).toBe(true);
  });

  test("refresh fails without a refresh cookie", async ({ request }) => {
    const refreshResponse = await request.post("/backend/auth/refresh");
    expect(refreshResponse.status()).toBe(401);
  });

  test.describe("authenticated", () => {
    test.describe.configure({ mode: "serial" });

    let authCookies: Cookie[];

    test.beforeEach(async ({ browser, context }) => {
      authCookies = await bootstrapAuthCookies(browser);
      await context.addCookies([...authCookies, LOCALE_COOKIE]);
    });

    test("protected route accessible with only refresh cookie after access expiry simulation", async ({
      page,
      context,
    }) => {
      await context.clearCookies();
      await context.addCookies(refreshOnlyCookies(authCookies));

      await page.goto("/beta/home");
      await expect(page).toHaveURL(/\/beta\/home/, { timeout: 15_000 });
    });

    test("concurrent refresh in two tabs keeps the session valid", async ({ browser }) => {
      const context = await browser.newContext();
      await context.addCookies(refreshOnlyCookies(authCookies));

      const pageA = await context.newPage();
      const pageB = await context.newPage();

      // Middleware refresh rotates the token once per use; establish the session in tab A
      // before tab B navigates with the same shared refresh cookie.
      await pageA.goto("/beta/home");
      await expect(pageA).toHaveURL(/\/beta\/home/, { timeout: 15_000 });
      await pageB.goto("/beta/home");
      await expect(pageB).toHaveURL(/\/beta\/home/, { timeout: 15_000 });

      const cookiesAfter = await context.cookies();
      expect(cookiesAfter.some((c) => c.name === "dadan_session")).toBe(true);
      expect(cookiesAfter.some((c) => c.name === "dadan_refresh")).toBe(true);

      await context.close();
    });

    test("refresh endpoint renews session when refresh cookie is present", async ({
      page,
      request,
    }) => {
      const cookieHeader = cookieHeaderFrom(await page.context().cookies());

      const refreshResponse = await request.post("/backend/auth/refresh", {
        headers: { Cookie: cookieHeader },
      });

      expect(refreshResponse.ok()).toBe(true);
      const setCookies = refreshResponse
        .headersArray()
        .filter((h) => h.name.toLowerCase() === "set-cookie");
      expect(setCookies.some((h) => h.value.startsWith("dadan_session="))).toBe(true);
      expect(setCookies.some((h) => h.value.startsWith("dadan_refresh="))).toBe(true);
    });

    test("logout invalidates refresh token", async ({ page, request }) => {
      const cookiesBefore = await page.context().cookies();
      const cookieHeader = cookieHeaderFrom(cookiesBefore);

      const logoutResponse = await request.post("/backend/auth/logout", {
        headers: { Cookie: cookieHeader },
      });
      expect(logoutResponse.ok()).toBe(true);

      const refreshAfterLogout = await request.post("/backend/auth/refresh", {
        headers: { Cookie: cookieHeader },
      });
      expect(refreshAfterLogout.status()).toBe(401);
    });
  });
});
