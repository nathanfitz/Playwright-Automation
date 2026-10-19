
import { test, expect } from '@playwright/test';

test('Save Hightouch session', async ({ page }) => {
  // 1. Buka halaman login Hightouch
  await page.goto('https://app.hightouch.com/login');

  // 2. Pause agar kamu bisa login secara manual
  await page.pause();

  // 3. Pastikan login berhasil sebelum menyimpan session
  await expect(page).not.toHaveURL(/\/login/);

  // 4. Simpan cookies dan local storage
  await page.context().storageState({
    path: 'auth.json',
  });
});
