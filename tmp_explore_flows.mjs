import { chromium } from '@playwright/test';

const BASE_URL = 'https://staging.chronicle.rip';
const EMAIL = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Login - click first to make readonly fields editable
await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.locator('[data-testid="login-mat-form-field-input-mat-input-element"]').click();
await page.waitForTimeout(300);
await page.locator('[data-testid="login-mat-form-field-input-mat-input-element"]').fill(EMAIL);
await page.locator('[data-testid="login-mat-form-field-input-password"]').click();
await page.waitForTimeout(300);
await page.locator('[data-testid="login-mat-form-field-input-password"]').fill(PASSWORD);
await page.locator('[data-testid="login-login-screen-button-mat-focus-indicator"]').click();
await page.waitForTimeout(5000);
const orgBase = page.url().replace(/\/$/, '');
console.log('After login URL:', orgBase);

// ============ FLOW 1: Find map page ============
console.log('\n=== FLOW 1: MAP / DASHBOARD ===');
await page.screenshot({ path: 'tmp_explore_dashboard.png' });

// Check all links
const allLinks = await page.locator('a').all();
for (const link of allLinks) {
  const href = (await link.getAttribute('href').catch(() => null)) || '';
  const text = (await link.textContent().catch(() => '')).trim();
  if (href && href !== '#') {
    console.log(`  Link: "${text.substring(0,40)}" → ${href}`);
  }
}

// Look for any sidebar with nav items
const navItems = await page.locator('mat-list-item, [role="listitem"] a, .nav-item').all();
console.log(`Nav items: ${navItems.length}`);

// ============ FLOW 2: Delete from table ============
console.log('\n=== FLOW 2: TABLE PAGE - ALL TESTIDS ===');
await page.goto(`${orgBase}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'tmp_explore_table.png' });

const allEls = await page.locator('[data-testid]').all();
const testids = [];
for (const el of allEls) {
  const id = await el.getAttribute('data-testid').catch(() => null);
  if (id) testids.push(id);
}
const unique = [...new Set(testids)].sort();
console.log('Testids on table page:');
for (const id of unique) console.log(`  ${id}`);

// ============ FLOW 3: Plot detail from table click ============
console.log('\n=== FLOW 3: PLOT DETAIL FROM TABLE ===');
const firstCell = page.locator('[data-testid*="content-wrapper-div-plot-id"]').first();
if (await firstCell.count() > 0) {
  const plotText = (await firstCell.textContent()).trim();
  console.log(`Clicking plot cell: "${plotText}"`);
  await firstCell.click();
  await page.waitForTimeout(3000);
  console.log('After click URL:', page.url());
  await page.screenshot({ path: 'tmp_explore_plot_detail_table.png' });
  
  const detailEls = await page.locator('[data-testid]').all();
  const detailIds = [];
  for (const el of detailEls) {
    const id = await el.getAttribute('data-testid').catch(() => null);
    if (id) detailIds.push(id);
  }
  const uniqueDetail = [...new Set(detailIds)].sort();
  console.log('Testids on plot detail page:');
  for (const id of uniqueDetail) console.log(`  ${id}`);
  
  // Go back to check map-related links from detail page
  const detailLinks = await page.locator('a').all();
  for (const link of detailLinks) {
    const href = (await link.getAttribute('href').catch(() => null)) || '';
    const text = (await link.textContent().catch(() => '')).trim();
    if (href && (href.includes('map') || text.toLowerCase().includes('map'))) {
      console.log(`  Map link from detail: "${text}" → ${href}`);
    }
  }
}

await browser.close();
console.log('\nDone!');
