import { chromium } from '@playwright/test';

const BASE_URL = 'https://staging.chronicle.rip';
const ORG_BASE = 'https://staging-aus.chronicle.rip/customer-organization';
const CEM_SLUG = 'astana_tegal_gundul_aus';
const EMAIL = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function login() {
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
}

await login();

// ============ FLOW A: Click "more-btn" on edit page to find Delete ============
console.log('=== EDIT PAGE: MORE BUTTON ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Navigate to a VACANT plot (to check if delete is available)
// Find a vacant plot row
const matRows = await page.locator('mat-row').all();
let vacantRow = null;
for (const row of matRows) {
  const text = await row.textContent();
  if (text.includes('vacant') || text.includes('VACANT')) {
    vacantRow = row;
    break;
  }
}
if (vacantRow) {
  await vacantRow.click();
  await page.waitForTimeout(3000);
  console.log('Edit URL:', page.url());
  
  // Click the MORE button
  const moreBtn = page.locator('[data-testid="toolbar-manage-button-more-btn"]');
  if (await moreBtn.count() > 0) {
    await moreBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tmp_more_menu.png', fullPage: false });
    
    const menuItems = await page.locator('mat-menu-item, [role="menuitem"], .mat-mdc-menu-item, button.mat-mdc-menu-item').all();
    console.log(`MORE menu items: ${menuItems.length}`);
    for (const item of menuItems) {
      const testid = await item.getAttribute('data-testid');
      const text = (await item.textContent()).trim();
      const visible = await item.isVisible();
      console.log(`  menu: testid="${testid}" visible=${visible} text="${text}"`);
    }
    await page.keyboard.press('Escape');
  }
}

// ============ FLOW B: Cemetery map - search for a plot ============
console.log('\n=== MAP: SEARCH FOR PLOT ===');
await page.goto(`${ORG_BASE}/${CEM_SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

// Use the search input
const searchInput = page.locator('[data-testid="autocomplete-input-input-autocomplete-search-input"]');
if (await searchInput.count() > 0) {
  console.log('Found search input - typing plot name...');
  await searchInput.click();
  await searchInput.fill('B G 9');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tmp_map_search.png', fullPage: false });
  
  // Check for search results/autocomplete
  const results = await page.locator('mat-option, [role="option"], [data-testid*="search-result"], [data-testid*="autocomplete"]').all();
  console.log(`Search results: ${results.length}`);
  for (const result of results.slice(0,5)) {
    const testid = await result.getAttribute('data-testid');
    const text = (await result.textContent()).trim();
    console.log(`  result: testid="${testid}" text="${text.substring(0,60)}"`);
  }
  
  if (results.length > 0) {
    await results[0].click();
    await page.waitForTimeout(3000);
    console.log('After search select URL:', page.url());
    await page.screenshot({ path: 'tmp_map_search_result.png', fullPage: false });
    
    // Get testids
    const newEls = await page.locator('[data-testid]').all();
    const newIds = new Set();
    for (const el of newEls) {
      const id = await el.getAttribute('data-testid').catch(() => null);
      if (id) newIds.add(id);
    }
    for (const id of [...newIds].sort()) {
      if (id.includes('plot') || id.includes('sidebar') || id.includes('cemetery-info')) {
        console.log(`  ${id}`);
      }
    }
  }
}

// ============ FLOW C: Table view - check what "Scenario 3" means ============
console.log('\n=== TABLE: ROW CLICK → EDIT PAGE VERIFICATION ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const firstRow = page.locator('mat-row').first();
const plotText = (await firstRow.textContent()).trim().substring(0, 80);
console.log(`First row: "${plotText}"`);
await firstRow.click();
await page.waitForTimeout(3000);
console.log('After row click URL:', page.url());
// This gives us the edit page, let's check what plot info is shown
const plotTitle = await page.locator('[data-testid="plot-edit-span-edit-plot"], h1, h2, [data-testid*="title"], [data-testid*="plot-id"]').first().textContent().catch(() => '');
console.log(`Plot title on page: "${plotTitle?.trim()}"`);
// Check plot-edit form fields
const inputs = await page.locator('input[data-testid^="plot-edit"]').all();
for (const inp of inputs) {
  const testid = await inp.getAttribute('data-testid');
  const value = await inp.inputValue().catch(() => '');
  console.log(`  input: testid=${testid} value="${value}"`);
}
await page.screenshot({ path: 'tmp_plot_edit_from_table.png', fullPage: false });

await browser.close();
console.log('\nDone!');
