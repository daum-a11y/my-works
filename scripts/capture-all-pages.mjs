import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";

const baseUrl = "http://127.0.0.1:4176";
const outputDir = "/Users/gio.a/Documents/workspace/next/my-works/output/playwright";
const email = "daum.a11y@gmail.com";
const password = "daum1234";
const viewport = { width: 1440, height: 1024 };

const publicRoutes = [
  { route: "/login", file: "login-20260326-full.png" },
];

const protectedRoutes = [
  { route: "/dashboard", file: "dashboard-20260326-full.png" },
  { route: "/reports", file: "reports-20260326-full.png" },
  { route: "/reports/search", file: "reports-search-20260326-full.png" },
  { route: "/projects", file: "projects-20260326-full.png" },
  { route: "/tracking", file: "tracking-20260326-full.png" },
  { route: "/resource/summary", file: "resource-summary-20260326-full.png" },
  { route: "/resource/month", file: "resource-month-20260326-full.png" },
  { route: "/resource/type", file: "resource-type-20260326-full.png" },
  { route: "/resource/svc", file: "resource-svc-20260326-full.png" },
  { route: "/stats/qa", file: "stats-qa-20260326-full.png" },
  { route: "/stats/monitoring", file: "stats-monitoring-20260326-full.png" },
  { route: "/settings/password", file: "settings-password-20260326-full.png" },
  { route: "/admin/reports", file: "admin-reports-20260326-full.png" },
  { route: "/admin/members", file: "admin-members-20260326-full.png" },
  { route: "/admin/type", file: "admin-type-20260326-full.png" },
  { route: "/admin/group", file: "admin-group-20260326-full.png" },
  { route: "/profile", file: "profile-20260326-full.png" },
  { route: "/missing-route", file: "not-found-20260326-full.png" },
];

async function ensureOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function settle(page, waitForSelector) {
  await page.waitForLoadState("networkidle").catch(() => {});
  if (waitForSelector) {
    await page.locator(waitForSelector).first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  }
  await page.waitForTimeout(400);
}

async function capture(page, route, file, waitForSelector) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await settle(page, waitForSelector);
  await page.screenshot({
    path: path.join(outputDir, file),
    fullPage: true,
  });
}

async function login(page) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await settle(page, 'input[name="email"]');
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await settle(page, 'main');
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport });
const page = await context.newPage();

try {
  await ensureOutputDir();

  for (const item of publicRoutes) {
    await capture(page, item.route, item.file, "main");
  }

  await login(page);

  for (const item of protectedRoutes) {
    await capture(page, item.route, item.file, "main");
  }
} finally {
  await context.close();
  await browser.close();
}
