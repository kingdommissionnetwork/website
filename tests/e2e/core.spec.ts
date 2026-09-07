import { test, expect } from '@playwright/test';

test.describe('Core User Journeys', () => {
  test('prayer wall page renders with form', async ({ page }) => {
    await page.goto('/prayer-wall');
    await expect(page.locator('main').getByText(/Prayer/i).first()).toBeVisible();
    await expect(page.locator('main').locator('form, button, input').first()).toBeVisible();
  });

  test('bible page renders with search', async ({ page }) => {
    await page.goto('/bible');
    await expect(page.locator('main').getByText(/Bible|Scripture/i).first()).toBeVisible();
  });

  test('events page renders', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('subscription portal renders with pricing and partner plans', async ({ page }) => {
    await page.goto('/subscribe');
    await expect(page.locator('main').getByText(/Partner|Subscription|Giving|Seed/i).first()).toBeVisible();
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
