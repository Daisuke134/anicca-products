import { test, expect } from "@playwright/test";

test("landing page renders hero and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Cold emails that");
  await expect(page.locator("h1")).toContainText("actually get replies");
  await expect(page.getByRole("link", { name: /Try Free/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /View Pricing/i })).toBeVisible();
});

test("landing page features section visible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Everything you need for cold outreach")).toBeVisible();
  await expect(page.getByText("Personalized in Seconds")).toBeVisible();
  await expect(page.getByText("A/B Variants Included")).toBeVisible();
});

test("pricing page renders plans", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText("Simple, transparent pricing")).toBeVisible();
  await expect(page.getByText("$0")).toBeVisible();
  await expect(page.getByText("$9.99")).toBeVisible();
  await expect(page.getByText("Most Popular")).toBeVisible();
});

test("generate page renders form", async ({ page }) => {
  await page.goto("/generate");
  await expect(page.getByText("Generate Cold Email")).toBeVisible();
  await expect(page.getByLabel("Prospect")).toBeVisible();
  await expect(page.getByLabel("Your product")).toBeVisible();
});

test("generate page produces email", async ({ page }) => {
  await page.goto("/generate");
  await page.getByLabel("Prospect").fill("Acme Corp");
  await page.getByLabel("Your product").fill("Our SaaS tool");
  await page.getByRole("button", { name: "Generate Email" }).click();
  await expect(page.getByText("Subject A:")).toBeVisible();
  await expect(page.getByText("Subject B:")).toBeVisible();
  await expect(page.getByText("Body:")).toBeVisible();
});

test("success page renders", async ({ page }) => {
  await page.goto("/success");
  await expect(page.getByText("Welcome to ColdCraft Pro")).toBeVisible();
});

test("navigation links work", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Generator" }).click();
  await expect(page).toHaveURL("/generate");
  await page.getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL("/pricing");
});
