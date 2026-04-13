import { chromium } from '@playwright/test';

const BASE_URL = 'https://staging.chronicle.rip';
const ORG_BASE = 'https://staging-aus.chronicle.rip/customer-organization';
const CEM_SLUG = 'astana_tegal_gundul_aus';
const EMAIL = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Login
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
console.log('Logged in:', page.url());

// ============ FLOW A: Cemetery page map ============
console.log('\n=== CEMETERY DETAIL PAGE ===');
await page.goto(`${ORG_BASE}/${CEM_SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
console.log('Cemetery URL:', page.url());
await page.screenshot({ path: 'tmp_cemetery_page.png' });

// Get all testids on cemetery page
const cemEls = await page.locator('[data-testid]').all();
const cemIds = new Set();
for (const el of cemEls) {
  const id = await el.getAttribute('data-testid').catch(() => null);
  if (id) cemIds.add(id);
}
console.log('Cemetery page testids:');
for (const id of [...cemIds].sort()) console.log(`  ${id}`);

// Look for map-related elements
const mapEls = await page.locator('[class*="map"], canvas, .leaflet-container').all();
console.log(`Map elements on cemetery page: ${mapEls.length}`);

// ============ FLOW B: Table - hover row for actions ============
console.log('\n=== TABLE - ROW HOVER ACTIONS ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Hover over first plot row to reveal hidden buttons
const firstPlotRow = page.locator('[data-testid="content-wrapper-div-plot-id-0"]').first();
const plotIdText = await firstPlotRow.textContent();
console.log(`First plot: "${plotIdText?.trim()}"`);

// Hover to reveal action buttons
await firstPlotRow.hover();
await page.waitForTimeout(500);
await page.screenshot({ path: 'tmp_table_hover.png' });

// Check for newly visible buttons
const visibleBtns = await page.locator('button:visible, a:visible').all();
console.log(`Visible buttons after hover: ${visibleBtns.length}`);

// Try clicking plot ID link (the blue link)
const plotLink = page.locator('[data-testid="content-wrapper-div-plot-id-0"] a, [data-testid="content-wrapper-div-plot-id"] a').first();
const plotLinkCount = await plotLink.count();
console.log(`Plot ID links: ${plotLinkCount}`);
if (plotLinkCount > 0) {
  const href = await plotLink.getAttribute('href');
  console.log(`  Plot link href: ${href}`);
}

// Try clicking the truncate div (plot ID text)
const truncateLink = page.locator('[data-testid="content-wrapper-div-truncate-0"] a, [data-testid="content-wrapper-div-truncate"] a').first();
const truncateLinkCount = await truncateLink.count();
console.log(`Truncate links: ${truncateLinkCount}`);
if (truncateLinkCount > 0) {
  const href = await truncateLink.getAttribute('href');
  const text = await truncateLink.textContent();
  console.log(`  Truncate link href=${href} text="${text?.trim()}"`);
}

// Get the "right-content-link" details
const rightContentLink = page.locator('[data-testid="content-wrapper-a-right-content-link"]').first();
if (await rightContentLink.count() > 0) {
  const href = await rightContentLink.getAttribute('href');
  const cls = await rightContentLink.getAttribute('class');
  const isVisible = await rightContentLink.isVisible();
  console.log(`Right content link: href=${href} visible=${isVisible} class="${cls}"`);
  // Try force click
  await rightContentLink.click({ force: true });
  await page.waitForTimeout(3000);
  console.log('After force click URL:', page.url());
  if (page.url() !== `${ORG_BASE}/advance-table?tab=plots`) {
    await page.screenshot({ path: 'tmp_plot_detail_force.png' });
    // Get testids
    const detailEls = await page.locator('[data-testid]').all();
    const detailIds = new Set();
    for (const el of detailEls) {
      const id = await el.getAttribute('data-testid').catch(() => null);
      if (id) detailIds.add(id);
    }
    console.log('Plot detail page testids:');
    for (const id of [...detailIds].sort()) console.log(`  ${id}`);
  }
}

// ============ FLOW C: Delete - check checkbox then delete ============
console.log('\n=== TABLE - DELETE FLOW ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Check the first row checkbox
const checkbox = page.locator('input[type="checkbox"]').first();
if (await checkbox.count() > 0) {
  await checkbox.click({ force: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'tmp_table_checkbox.png' });
  
  // Look for bulk action buttons
  const allTestIds2 = await page.locator('[data-testid]').all();
  const ids2 = new Set();
  for (const el of allTestIds2) {
    const id = await el.getAttribute('data-testid').catch(() => null);
    if (id) ids2.add(id);
  }
  // Show new testids
  console.log('Testids after checkbox:');
  for (const id of [...ids2].sort()) {
    if (id.includes('delete') || id.includes('bulk') || id.includes('action') || id.includes('select')) {
      console.log(`  ${id}`);
    }
  }
  
  // Look for delete-related buttons
  const deleteBtns = await page.locator('[data-testid*="delete"], button:has-text("Delete"), [aria-label*="delete"]').all();
  console.log(`Delete buttons after checkbox: ${deleteBtns.length}`);
  for (const btn of deleteBtns) {
    const testid = await btn.getAttribute('data-testid').catch(() => null);
    const text = (await btn.textContent().catch(() => '')).trim();
    const isVisible = await btn.isVisible();
    console.log(`  delete btn: testid=${testid} visible=${isVisible} text="${text}"`);
  }
}

await browser.close();
console.log('\nDone!');
