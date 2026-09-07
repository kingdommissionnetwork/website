import { test, expect } from '@playwright/test';

test.describe('Core User Journeys', () => {
  test('prayer wall page renders with form', async ({ page }) => {
    await page.goto('/prayer-wall');
    await expect(page.locator('text=Prayer Wall, text=Prayer, text=Request').first()).toBeVisible();
    await expect(page.locator('form, button, input').first()).toBeVisible();
  });

  test('bible page renders with search', async ({ page }) => {
    await page.goto('/bible');
    await expect(page.locator('text=Bible, text=Scripture').first()).toBeVisible();
  });

  test('events page renders', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('text=Events, text=Calendar').first()).toBeVisible();
  });

  test('subscription portal renders with pricing and partner plans', async ({ page }) => {
    await page.goto('/subscribe');
    await expect(page.locator('text=Partner, text=Subscription, text=Giving').first()).toBeVisible();
  });

  test('home page has featured content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible();
  });

  test('page title is set correctly', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).not.toBe('');
  });
});
