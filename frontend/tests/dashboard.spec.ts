import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page, failOrder = false) {
  let widgets = [
    { id: 1, service: 'weather', type: 'temperature', title: 'Weather in Paris', config: { city: 'Paris' }, refreshSeconds: 300, position: 0 },
    { id: 2, service: 'currency', type: 'rate', title: 'Exchange rate', config: {}, refreshSeconds: 300, position: 1 },
    { id: 3, service: 'github', type: 'repository', title: 'Repository activity', config: {}, refreshSeconds: 300, position: 2 },
    { id: 4, service: 'air_quality', type: 'aqi', title: 'Air quality', config: {}, refreshSeconds: 300, position: 3 },
  ];
  const values = [
    [['Location', 'Paris, France'], ['Temperature', '21 °C'], ['Feels like', '20 °C']],
    [['EUR / USD', '1.17'], ['Base currency', 'EUR']],
    [['Stars', '2,480'], ['Forks', '182'], ['Open issues', '24']],
    [['Location', 'Paris, France'], ['European AQI', '24']],
  ];
  const orders: number[][] = [];
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    if (path === '/api/auth/me') return route.fulfill({ json: { id: 1, username: 'Samantha', email: 'test@example.com', emailVerified: true } });
    if (path === '/api/auth/csrf') return route.fulfill({ json: { token: 'test' } });
    if (path === '/api/widgets/order') {
      orders.push(route.request().postDataJSON().ids);
      if (failOrder) return route.fulfill({ status: 500, json: { error: 'Could not save layout.' } });
      widgets = orders.at(-1)!.map((id) => widgets.find((widget) => widget.id === id)!);
      return route.fulfill({ status: 204 });
    }
    if (path === '/api/widgets') return route.fulfill({ json: widgets });
    if (path === '/api/services') return route.fulfill({ json: widgets.map((widget) => ({ name: widget.service, label: widget.service, available: true, connected: true, oauth: false, widgets: [{ name: widget.type, description: widget.title, params: [] }] })) });
    const match = path.match(/\/api\/widgets\/(\d+)\/data/);
    if (match) return route.fulfill({ json: { source: 'Test source', updatedAt: new Date().toISOString(), items: values[Number(match[1]) - 1].map(([label, value]) => ({ label, value, url: null })) } });
    return route.fulfill({ status: 404 });
  });
  await page.goto('/');
  await expect(page.locator('.wigggle-widget')).toHaveCount(4);
  await expect(page.getByText('21 °C', { exact: true })).toBeVisible();
  return orders;
}

async function dragFirstToThird(page: Page, cancel = false) {
  const handle = await page.getByRole('button', { name: 'Drag Weather in Paris', exact: true }).boundingBox();
  const target = await page.locator('[data-widget-id="3"]').boundingBox();
  await page.mouse.move(handle!.x + 10, handle!.y + 10);
  await page.mouse.down();
  await page.mouse.move(target!.x + target!.width / 2, target!.y + 100, { steps: 12 });
  await expect(page.locator('.is-drop-target')).toHaveCount(1);
  if (cancel) await page.keyboard.press('Escape');
  await page.mouse.up();
}

const titles = (page: Page) => page.locator('.wigggle-widget__title');

test('drag saves the new order, survives reload and has no sidebar', async ({ page }, testInfo) => {
  const orders = await setup(page);
  await expect(page.locator('aside')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: true });
  await dragFirstToThird(page);
  await expect(titles(page)).toHaveText(['Exchange rate', 'Repository activity', 'Weather in Paris', 'Air quality']);
  await expect(page.getByText('Layout saved.', { exact: true })).toBeVisible();
  expect(orders).toEqual([[2, 3, 1, 4]]);
  await page.reload();
  await expect(titles(page)).toHaveText(['Exchange rate', 'Repository activity', 'Weather in Paris', 'Air quality']);
});

test('failed saving rolls back the optimistic move', async ({ page }) => {
  await setup(page, true);
  await dragFirstToThird(page);
  await expect(page.getByText('Could not save layout.')).toBeVisible();
  await expect(titles(page)).toHaveText(['Weather in Paris', 'Exchange rate', 'Repository activity', 'Air quality']);
});

test('Escape cancels dragging and keyboard handles reorder', async ({ page }) => {
  const orders = await setup(page);
  await dragFirstToThird(page, true);
  expect(orders).toEqual([]);
  const handle = page.getByRole('button', { name: 'Drag Weather in Paris', exact: true });
  await handle.focus();
  await page.keyboard.press('End');
  await expect(page.getByText('Layout saved.', { exact: true })).toBeVisible();
  expect(orders).toEqual([[2, 3, 4, 1]]);
  await expect(titles(page).last()).toHaveText('Weather in Paris');
  await page.getByLabel('Options for Weather in Paris').click();
  await page.getByRole('button', { name: 'Edit widget', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close widget editor' }).click();
  await page.getByRole('button', { name: 'Services', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Connect your services' })).toBeVisible();
});

test('mobile fits the viewport and supports touch dragging', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const orders = await setup(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
  await page.locator('[data-widget-id="1"]').evaluate(element => element.scrollIntoView({ block: 'start' }));
  const handle = await page.getByRole('button', { name: 'Drag Weather in Paris', exact: true }).boundingBox();
  const target = await page.locator('[data-widget-id="2"]').boundingBox();
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: handle!.x + 10, y: handle!.y + 10 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: target!.x + 100, y: target!.y + 60 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByText('Layout saved.', { exact: true })).toBeVisible();
  expect(orders).toEqual([[2, 1, 3, 4]]);
  await context.close();
});

test('Steam widget can be configured and added from the picker', async ({ page }) => {
  await setup(page);
  await page.route('**/api/services', (route) => route.fulfill({ json: [{
    name: 'steam', label: 'Steam', available: true, connected: true, oauth: false,
    widgets: [{ name: 'players', description: 'Current player count', params: [
      { name: 'appid', type: 'integer', label: 'Steam app ID', defaultValue: '440' },
    ] }],
  }] }));
  let submitted: unknown;
  await page.route('**/api/widgets', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    submitted = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: { ...route.request().postDataJSON(), id: 5, position: 4 } });
  });
  await page.route('**/api/widgets/5/data', (route) => route.fulfill({ json: {
    source: 'Steam · App 620', updatedAt: new Date().toISOString(),
    items: [{ label: 'Players online', value: '1234', url: null }],
  } }));
  await page.reload();
  await page.getByRole('button', { name: '+ Add widget', exact: true }).click();
  await page.getByLabel('Steam app ID').fill('620');
  await page.getByLabel('Title', { exact: true }).fill('Portal 2 players');
  await page.getByLabel('Refresh interval in seconds').fill('120');
  await page.getByRole('button', { name: 'Save widget', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Portal 2 players', exact: true })).toContainText('1234');
  expect(submitted).toEqual({ service: 'steam', type: 'players', title: 'Portal 2 players', config: { appid: '620' }, refreshSeconds: 120 });
});
