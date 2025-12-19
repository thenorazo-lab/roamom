const { test, expect } = require('@playwright/test');

test('Shows placeholder values when weather/scuba are missing', async ({ page }) => {
  const mock = {
    weather: null,
    scuba: null,
    tide: [],
    nearestObs: { name: '부산' },
    recorded: false
  };

  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 35.1, longitude: 129.1 });

  await page.route('**/api/sea-info*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mock)
  }));

  await page.goto('/weather');

  // Cards must still be visible with N/A or 정보 없음
  await expect(page.locator('text=위치: 부산')).toBeVisible();
  await expect(page.locator('text=상태: 정보 없음')).toBeVisible();
  await expect(page.locator('text=기온: N/A°C')).toBeVisible();
  await expect(page.locator('text=수온: N/A°C')).toBeVisible();
  await expect(page.locator('text=물때 정보가 없습니다')).toBeVisible();
});