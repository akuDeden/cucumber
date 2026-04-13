import { chromium } from '@playwright/test';

const BASE_URL = 'https://staging.chronicle.rip';
const ORG_BASE = 'https://staging-aus.chronicle.rip/customer-organization';
const EMAIL = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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

// Go to table and click any row
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const rows = await page.locator('mat-row').all();
console.log(`Rows: ${rows.length}`);
if (rows.length > 0) {
  // Get text of first row to know what we're clicking
  const rowText = (await rows[0].textContent()).substring(0, 80);
  console.log(`Clicking row: "${rowText}"`);
  await rows[0].click();
  await page.waitForURL('**/manage/edit/plot**', { timeout: 10000 });
  await page.waitForTimeout(2000);
  console.log('Edit page URL:', page.url());

  // Click MORE button
  const moreBtn = page.locator('[data-testid="toolbar-manage-button-more-btn"]');
  await moreBtn.waitFor({ state: 'visible', timeout: 5000 });
  await moreBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tmp_more_menu_final.png', fullPage: false });

  // Get ALL items in the dropdown
  const allMenuItems = await page.locator('[role="menuitem"], mat-menu-item, .mat-mdc-menu-item').all();
  console.log(`Menu items: ${allMenuItems.length}`);
  for (const item of allMenuItems) {
    const testid = await item.getAttribute('data-testid').catch(() => null);
    const text = (await item.textContent()).trim();
    const visible = await item.isVisible();
    console.log(`  item: testid="${testid}" visible=${visible} text="${text}"`);
  }
  
  // Also check map search result
  await page.keyboard.press('Escape');
}

// Check cemetery map search
const CEM_SLUG = 'astana_tegal_gundul_aus';
console.log('\n=== MAP SEARCH ===');
await page.goto(`${ORG_BASE}/${CEM_SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const searchInput = page.locator('[data-testid="autocomplete-input-input-autocomplete-search-input"]');
await searchInput.click();
await searchInput.fill('B G 9');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'tmp_map_search_final.png', fullPage: false });
// Check for results
const allVisible = await page.locator('[data-testid]').all();
const newIds = [];
for (const el of allVisible) {
  const id = await el.getAttribute('data-testid').catch(() => null);
  if (id && (id.includes('plot') || id.includes('result') || id.includes('search'))) newIds.push(id);
}
console.log('Search-related testids after typing:');
for (const id of [...new Set(newIds)]) console.log(`  ${id}`);

// Check for any dropdown/autocomplete that opened
const options = await page.locator('mat-option, [role="option"]').all();
console.log(`Options visible: ${options.length}`);
for (const opt of options.slice(0,5)) {
  const text = (await opt.textContent()).trim();
  const testid = await opt.getAttribute('data-testid').catch(() => null);
  console.log(`  option: testid="${testid}" text="${text.substring(0,60)}"`);
}

await browser.close();
