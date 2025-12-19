const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BACKEND_PORTS = [4001, 3002, 3001, 4000, 3000];

test.beforeAll(async ({ request }) => {
  // find a running backend
  for (const p of BACKEND_PORTS) {
    try {
      const r = await request.get(`http://localhost:${p}/api/health`);
      if (r.ok()) {
        process.env.TEST_BACKEND = `http://localhost:${p}`;
        console.log('Found backend at', process.env.TEST_BACKEND);
        return;
      }
    } catch (e) {
      // ignore
    }
  }
  throw new Error('Backend not reachable on ports: ' + BACKEND_PORTS.join(', ') + '. Start backend before running tests.');
});

test('PointsAdmin: create point with upload and record click', async ({ page, request }) => {
  const title = 'e2e-test-' + Date.now();
  const lat = '35.1234';
  const lng = '129.1234';
  const desc = 'e2e test point';

  // Go to PointsAdmin
  await page.goto('/points-admin');

  // Login as admin and capture the auth request
  await page.fill('input[type="password"]', '756400');
  const [authResp] = await Promise.all([
    page.waitForResponse(resp => resp.url().endsWith('/api/points') && resp.request().method() === 'POST', { timeout: 10000 }),
    page.click('text=로그인')
  ]);
  const authStatus = authResp.status();
  const authBody = await authResp.json().catch(()=>null);
  console.log('auth status', authStatus, 'body', authBody);
  if (!authResp.ok()) throw new Error('Auth failed: ' + authStatus);

  // Wait for add form
  await page.waitForSelector('button:has-text("추가")', { timeout: 10000 });

  // Fill form
  await page.fill('input[placeholder="title"]', title);
  await page.fill('input[placeholder="lat"]', lat);
  await page.fill('input[placeholder="lng"]', lng);
  await page.fill('input[placeholder="desc"]', desc);

  // Upload image
  const imgPath = path.join(__dirname, 'fixtures', 'test-image.png');
  await page.setInputFiles('input[type="file"]', imgPath);

  // Click add
  await page.click('button:has-text("추가")');

  // Wait for the created point to appear in the list
  await page.waitForSelector(`text=${title}`);

  // Confirm via backend API that the point exists
  const backend = process.env.TEST_BACKEND;
  const list = await request.get(backend + '/api/points');
  expect(list.ok()).toBeTruthy();
  const points = await list.json();
  const created = points.find(p => p.title === title);
  expect(created).toBeTruthy();

  // Simulate marker click by POST /api/points/click
  const clickRes = await request.post(backend + '/api/points/click', {
    data: { pointId: created.id }
  });
  expect(clickRes.ok()).toBeTruthy();
  const clickBody = await clickRes.json();
  expect(clickBody.ok).toBeTruthy();

  // If backend reports recorded=true (Sheets or CSV), we're done. Otherwise, check CSV fallback
  if (!clickBody.recorded) {
    const repoCsv = path.join(process.cwd(), 'backend', 'logs', 'records.csv');
    let found = false;
    for (let i = 0; i < 6; i++) {
      if (fs.existsSync(repoCsv)) {
        const content = fs.readFileSync(repoCsv, 'utf8');
        if (content.indexOf(title) !== -1) { found = true; break; }
      }
      await new Promise(r => setTimeout(r, 500));
    }
    expect(found).toBeTruthy();
  }

  // Cleanup: remove created point
  await request.delete(backend + '/api/points/' + created.id, { headers: { 'x-admin-password': '756400' } });
});
