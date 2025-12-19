const { test, expect } = require('@playwright/test');

test('Uses sample fallback when APIs fail and sample flag is set', async ({ page }) => {
  // grant geolocation
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 35.1, longitude: 129.1 });

  await page.goto('/weather?sample=true');

  // Check that sample data (샘플항) is shown and values from sample file appear
  await expect(page.locator('text=위치: 샘플항')).toBeVisible();
  await expect(page.locator('text=기온: 21°C')).toBeVisible();
  await expect(page.locator('text=수온: 16°C')).toBeVisible();
  await expect(page.locator('text=고조')).toBeVisible();
});