import { test, expect } from "@playwright/test";

test("landing page loads with hero and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Professional email signatures");
  await expect(page.getByRole("link", { name: /Create Your Signature/i }).first()).toBeVisible();
});

test("pricing page shows free and pro plans", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.locator("h1")).toContainText("Simple, transparent pricing");
  await expect(page.getByText("$0")).toBeVisible();
  await expect(page.getByText("$4.99")).toBeVisible();
});

test("create page loads signature editor", async ({ page }) => {
  await page.goto("/create");
  await expect(page.locator("h1")).toContainText("Create Your Email Signature");
  await expect(page.getByPlaceholder("Jane Smith")).toBeVisible();
  await expect(page.getByText("Copy Signature")).toBeVisible();
});

test("navigation works between pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Pricing" }).first().click();
  await expect(page).toHaveURL("/pricing");
  await page.getByRole("link", { name: "Create" }).first().click();
  await expect(page).toHaveURL("/create");
});
