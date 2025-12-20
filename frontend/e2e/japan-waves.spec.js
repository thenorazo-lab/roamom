import { test, expect } from '@playwright/test';

// HashRouter is used, so routes include the hash
const route = '/#/jp-wave';

// Ensure backend is expected at 3002 via CRA proxy
// This test assumes backend is running on localhost:3002

test('일본 파고 페이지에서 이미지와 크레딧이 표시된다', async ({ page }) => {
  await page.goto(route);
  await expect(page.getByText('일본 파고 (타임시리즈)')).toBeVisible();
  await expect(page.getByText('ICOM 일본기상청 데이터')).toBeVisible();

  // Wait for at least one image to be visible (main or thumbnails)
  const images = page.locator('img');
  await expect(images.first()).toBeVisible({ timeout: 10000 });

  // Optional: ensure multiple time slots produce multiple images (thumbnails)
  const count = await images.count();
  expect(count).toBeGreaterThan(0);
});
