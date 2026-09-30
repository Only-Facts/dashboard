import { test, expect, type Page } from '@playwright/test';

const examples = [
  { service: 'weather', type: 'temperature', title: 'Paris temperature', config: { city: 'Paris' }, rows: [['Location', 'Paris, France'], ['Temperature', '-4 °C'], ['Feels like', '-7 °C']] },
  { service: 'weather', type: 'forecast', title: 'Weekly forecast', config: { city: 'Paris', days: '3' }, rows: [['2026-09-30', '-4–2 °C · 1.5 mm rain'], ['2026-10-01', '-2–6 °C · 0 mm rain'], ['2026-10-02', '1–9 °C · 3 mm rain']] },
  { service: 'weather', type: 'wind', title: 'Wind and humidity', config: { city: 'Paris' }, rows: [['Wind', '14 km/h'], ['Humidity', '68%']] },
  { service: 'weather', type: 'precipitation', title: 'Precipitation', config: { city: 'Paris' }, rows: [['Precipitation', '2.4 mm'], ['Rain', '1.8 mm'], ['Snowfall', '0 cm']] },
  { service: 'weather', type: 'sun', title: 'Sunrise and sunset', config: { city: 'Paris' }, rows: [['Sunrise', '2026-09-30 · 07:48'], ['Sunset', '2026-09-30 · 19:32'], ['Timezone', 'Europe/Paris']] },
  { service: 'github', type: 'repository', title: 'Repository statistics', config: { repository: 'facebook/react' }, rows: [['Stars', '230,482'], ['Forks', '47,210'], ['Open issues and pull requests', '1,234']] },
  { service: 'github', type: 'commits', title: 'Recent commits', config: { repository: 'facebook/react' }, rows: [['Alex', 'Improve render scheduling in concurrent updates'], ['Sam', 'Fix hydration mismatch on initial render'], ['Maya', 'Update documentation examples']] },
  { service: 'github', type: 'issues', title: 'Open issues', config: {}, rows: [['#421', 'Hydration mismatch with nested suspense'], ['#420', 'Improve error messages for invalid hooks']] },
  { service: 'currency', type: 'rate', title: 'EUR to USD', config: { base: 'EUR', target: 'USD' }, rows: [['1 EUR', '1.1720 USD'], ['Rate date', '2026-09-30 · daily reference rate']] },
  { service: 'currency', type: 'convert', title: 'Travel budget', config: { base: 'EUR', target: 'USD', amount: '250' }, rows: [['250 EUR', '293.0000 USD'], ['Rate date', '2026-09-30 · daily reference rate']] },
  { service: 'news', type: 'popular', title: 'Popular stories', config: { query: 'design' }, rows: [['482 points · mira', 'The quiet craft of building better interfaces'], ['237 points · alex', 'A practical guide to design tokens'], ['103 points · sam', 'Making the web more accessible']] },
  { service: 'news', type: 'latest', title: 'Latest stories', config: { query: 'technology' }, rows: [['18 points · mira', 'A new chapter for the open web'], ['9 points · alex', 'Notes on building things that last'], ['4 points · sam', 'An independent approach to software']] },
  { service: 'air_quality', type: 'aqi', title: 'European air quality', config: { city: 'Paris' }, rows: [['European AQI', '32 (lower is better)']] },
  { service: 'air_quality', type: 'particles', title: 'Particulate pollution', config: { city: 'Paris' }, rows: [['PM₂.₅', '8.2 μg/m³'], ['PM₁₀', '18.6 μg/m³']] },
  { service: 'air_quality', type: 'gases', title: 'Air pollution gases', config: { city: 'Paris' }, rows: [['Nitrogen dioxide (NO₂)', '12 μg/m³'], ['Ozone (O₃)', '60 μg/m³'], ['Sulphur dioxide (SO₂)', '3 μg/m³']] },
  { service: 'steam', type: 'players', title: 'Team Fortress 2', config: { appid: '440' }, rows: [['Players online', '54820']] },
  { service: 'steam', type: 'game_news', title: 'Game dispatches', config: { appid: '440' }, rows: [['2026-09-30 · Steam', 'A new season begins: maps, updates and more'], ['2026-09-28 · Steam', 'Community highlights from this week']] },
  { service: 'steam', type: 'achievements', title: 'Global achievements', config: { appid: '440' }, rows: [['FIRST_STEPS', '82.5% of players'], ['TEAM_PLAYER', '56.3% of players'], ['MASTER_CLASS', '23.7% of players']] },
];

async function gallery(page: Page, missing = false) {
  const widgets = examples.map((example, i) => ({ ...example, id: i + 1, position: i, refreshSeconds: 300 }));
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    if (path === '/api/auth/me') return route.fulfill({ json: { id: 1, username: 'Samantha', email: 'test@example.com', emailVerified: true } });
    if (path === '/api/widgets') return route.fulfill({ json: widgets });
    if (path === '/api/services') return route.fulfill({ json: [] });
    const match = path.match(/\/api\/widgets\/(\d+)\/data/);
    if (match) return route.fulfill({ json: { source: examples[Number(match[1]) - 1].service, updatedAt: '2026-09-30T12:00:00Z', items: examples[Number(match[1]) - 1].rows.map(([label, value]) => ({ label, value: missing ? 'Unavailable' : value, url: null })) } });
    return route.fulfill({ status: 404 });
  });
  await page.goto('/');
  await expect(page.locator('.widget-visual')).toHaveCount(18);
}

test('all eighteen widget types have distinct responsive views', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1600, height: 1100 });
  await gallery(page);
  for (const example of examples) await expect(page.locator(`.visual-${example.type}`)).toHaveCount(1);
  await expect(page.getByText('11h 44m of daylight')).toBeVisible();
  await expect(page.getByText('Feels 3.0° cooler than measured')).toBeVisible();
  await expect(page.locator('.player-chart')).toHaveCount(0);
  await expect(page.locator('.range-track')).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath('all-widgets-desktop.png'), fullPage: true });
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const overflowing = await page.locator('.widget-visual').evaluateAll(elements => elements.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.className));
    expect(overflowing).toEqual([]);
  }
  await page.screenshot({ path: testInfo.outputPath('all-widgets-mobile.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('missing readings never produce NaN or fabricated zero measurements', async ({ page }) => {
  await gallery(page, true);
  await expect(page.locator('.visual-temperature')).toContainText('Unavailable');
  await expect(page.locator('.visual-aqi')).toContainText('Measurement unavailable');
  await expect(page.locator('.visual-sun')).toContainText('Daylight duration unavailable');
  await expect(page.locator('.visual-players')).toContainText('Unavailable');
  await expect(page.locator('main')).not.toContainText('NaN');
  expect(await page.locator('[style]').evaluateAll(elements => elements.some(el => /NaN|Infinity/.test(el.getAttribute('style') ?? '')))).toBe(false);
});

test('player history uses real distinct updates and retains data on refresh failure', async ({ page }) => {
  let requests = 0;
  await gallery(page);
  await page.route('**/api/widgets/16/data', route => {
    requests++;
    if (requests === 3) return route.fulfill({ status: 503, json: { error: 'Steam temporarily unavailable' } });
    return route.fulfill({ json: { source: 'Steam', updatedAt: requests === 1 ? '2026-09-30T12:00:00Z' : '2026-09-30T12:05:00Z', items: [{ label: 'Players online', value: requests === 1 ? '54820' : '0', url: null }] } });
  });
  const card = page.getByRole('article', { name: 'Team Fortress 2', exact: true });
  const refresh = async () => { await card.getByLabel('Options for Team Fortress 2').click(); await card.getByRole('button', { name: 'Refresh', exact: true }).click(); };
  await refresh();
  await expect(card.locator('.player-chart')).toHaveCount(0);
  await refresh();
  await expect(card.locator('.player-chart > div')).toHaveCount(2);
  await expect(card.locator('.hero-number')).toHaveText('0');
  await refresh();
  await expect(card.getByRole('alert')).toContainText('Steam temporarily unavailable');
  await expect(card.locator('.hero-number')).toHaveText('0');
  await expect(card.locator('.player-chart > div')).toHaveCount(2);
});
