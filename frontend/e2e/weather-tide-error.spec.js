const { test, expect } = require('@playwright/test');

test('Shows friendly message when tide service key is missing', async ({ page }) => {
  const mock = {
    weather: { T1H: '18', SKY: '3', PTY: '0', WSD: '2' },
    scuba: { water_temp: '17', wave_height: '0.6', current_speed: '0.4' },
    tide: [],
    tideError: 'invalid ServiceKey',
    nearestObs: { name: '테스트항' },
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

  await expect(page.locator('text=조석 데이터 접근 불가')).toBeVisible();
  await expect(page.locator('text=서비스 키가 필요합니다')).toBeVisible();
});