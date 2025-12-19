const { test, expect } = require('@playwright/test');

test('Weather page shows weather, ocean info and today tides', async ({ page }) => {
  const mock = {
    weather: { T1H: '20', SKY: '1', PTY: '0', WSD: '3.5' },
    scuba: { water_temp: '16', wave_height: '0.8', current_speed: '0.5' },
    tide: [ { tide_time: '2025-12-19T05:30:00', tide_level: '123', hl_code: 'H' }, { tide_time: '2025-12-19T11:30:00', tide_level: '50', hl_code: 'L' } ],
    nearestObs: { name: '테스트항' },
    recorded: true
  };

  // grant geolocation permission and set location
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 35.1, longitude: 129.1 });

  // intercept sea-info API and return mock
  await page.route('**/api/sea-info*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mock)
  }));

  await page.goto('/weather');

  // Wait for weather card
  await expect(page.locator('text=날씨')).toBeVisible();
  await expect(page.locator('text=상태: 맑음')).toBeVisible();
  await expect(page.locator('text=기온: 20°C')).toBeVisible();

  // Ocean info
  await expect(page.locator('text=수온: 16°C')).toBeVisible();
  await expect(page.locator('text=파고: 0.8 m')).toBeVisible();

  // Tides: check icon/type/time/level
  await expect(page.locator('text=고조')).toBeVisible();
  await expect(page.locator('text=05:30')).toBeVisible();
  await expect(page.locator('text=(123cm)')).toBeVisible();
});