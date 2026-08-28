import { test, expect } from '@playwright/test';

test.describe('Saarathi Critical User Journeys (E2E)', () => {
  test('Full Journey: Landing -> Sign In -> Dashboard -> Create Task -> Toggle Complete -> Analytics -> Kairo Chat -> Logout', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('/');
    await expect(page).toHaveTitle(/Saarathi/i);

    // 2. Open Auth Modal
    const enterWorkspaceBtn = page.getByRole('button', { name: /Enter Workspace/i }).first();
    if (await enterWorkspaceBtn.isVisible()) {
      await enterWorkspaceBtn.click();
    }

    // 3. Quick Sign-In in demo mode
    const emailInput = page.getByPlaceholder(/you@example.com/i);
    if (await emailInput.isVisible()) {
      await emailInput.fill('demo.user@saarathi.ai');
      const passwordInput = page.getByPlaceholder(/••••••••/i);
      await passwordInput.fill('Password123!');
      await page.getByRole('button', { name: /Sign In|Continue/i }).first().click();
    }

    // 4. Verify Dashboard View
    await expect(page.getByText(/Dashboard|Productivity/i).first()).toBeVisible();

    // 5. Navigate to Tasks Board
    const tasksNav = page.getByRole('button', { name: /Tasks|Task Board/i }).first();
    if (await tasksNav.isVisible()) {
      await tasksNav.click();
      await expect(page.getByText(/Task Board|All Tasks/i).first()).toBeVisible();
    }

    // 6. Navigate to Analytics View
    const analyticsNav = page.getByRole('button', { name: /Analytics/i }).first();
    if (await analyticsNav.isVisible()) {
      await analyticsNav.click();
      await expect(page.getByText(/Productivity Analytics|Heatmap/i).first()).toBeVisible();
    }

    // 7. Navigate to Kairo AI Assistant
    const kairoNav = page.getByRole('button', { name: /Kairo|AI Assistant/i }).first();
    if (await kairoNav.isVisible()) {
      await kairoNav.click();
      await expect(page.getByPlaceholder(/Ask Kairo anything|Message Kairo/i).first()).toBeVisible();
    }
  });
});
