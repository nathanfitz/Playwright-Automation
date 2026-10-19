import { test, expect } from '@playwright/test';

test('HerokuApp test', async ({ page }) => {
  await page.goto('https://the-internet.herokuapp.com/');

  await expect(page).toHaveTitle(/The Internet/);
});