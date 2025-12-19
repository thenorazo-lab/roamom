const { test, expect } = require('@playwright/test');

test('Shows friendly messages when weather and scuba APIs are unavailable', async ({ page }) => {
  const mock = {
    weather: null,
    weatherError: 'ServiceKey missing for KMA',
    scuba: null,
    scubaError: 'SkinScuba API unreachable',
    tide: [],
    nearestObs: { name: '테스트항' },
    recorded: true
  };

  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 35.1, longitude: 129.1 });

  await page.route('**/api/sea-info*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mock)
  }));

  await page.goto('/weather');

  await expect(page.locator('text=날씨 정보 접근 불가')).toBeVisible();
  await expect(page.locator('text=해양 정보 접근 불가')).toBeVisible();
});