import { chromium } from '@playwright/test';

const BASE_URL = 'https://staging.chronicle.rip';
const EMAIL = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';

const browser = await chromium.launch({ headless: false, slowMo: 200 });
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
const orgBase = page.url().replace(/\/$/, '');
console.log('Logged in, base URL:', orgBase);

// ============ FLOW 1: MAP on dashboard ============
console.log('\n=== FLOW 1: MAP on DASHBOARD ===');
await page.screenshot({ path: 'tmp_map_dashboard.png' });

// Look for map/canvas elements
const mapEls = await page.locator('.leaflet-container, canvas, [class*="map"], [id*="map"]').all();
console.log(`Map elements: ${mapEls.length}`);
for (const el of mapEls.slice(0,5)) {
  const cls = await el.getAttribute('class').catch(() => null);
  const id = await el.getAttribute('id').catch(() => null);
  const tag = await el.evaluate(e => e.tagName).catch(() => null);
  console.log(`  ${tag}: class="${cls?.substring(0,60)}" id="${id}"`);
}

// Look for plot markers on the map
const markers = await page.locator('.leaflet-marker-icon, [class*="marker"], [class*="plot-marker"]').all();
console.log(`Map markers: ${markers.length}`);

// Check sidebar/nav for map-specific section
const sideMenuItems = await page.locator('[data-testid*="side-menu"]').all();
console.log(`Side menu items: ${sideMenuItems.length}`);
for (const item of sideMenuItems) {
  const id = await item.getAttribute('data-testid').catch(() => null);
  const text = (await item.textContent().catch(() => '')).trim();
  if (text) console.log(`  side-menu: testid=${id} text="${text.substring(0,50)}"`);
}

// Take screenshot of map area
await page.screenshot({ path: 'tmp_map_close.png', fullPage: false });

// Try clicking on a plot marker on the map
if (markers.length > 0) {
  console.log('Clicking first marker...');
  await markers[0].click().catch(e => console.log('Click failed:', e.message));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tmp_map_after_click.png' });
  console.log('After marker click URL:', page.url());
  
  // Look for popup/panel
  const popups = await page.locator('.leaflet-popup, mat-dialog, [class*="popup"], [class*="panel"]').all();
  console.log(`Popups after marker click: ${popups.length}`);
  for (const p of popups.slice(0,3)) {
    const text = (await p.textContent().catch(() => '')).trim();
    console.log(`  popup: "${text.substring(0,100)}"`);
  }
}

// ============ FLOW 2: morevert (3-dot) menu in table ============
console.log('\n=== FLOW 2: MOREVERT MENU IN TABLE ===');
await page.goto(`${orgBase}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Click the morevert button on first row
const morevertBtn = page.locator('[data-testid="content-wrapper-button-morevert-0"]').first();
if (await morevertBtn.count() > 0) {
  console.log('Clicking morevert button...');
  await morevertBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tmp_morevert_menu.png' });
  
  // Get menu items
  const menuItems = await page.locator('mat-menu-item, [role="menuitem"], .mat-menu-item').all();
  console.log(`Menu items: ${menuItems.length}`);
  for (const item of menuItems) {
    const testid = await item.getAttribute('data-testid').catch(() => null);
    const text = (await item.textContent().catch(() => '')).trim();
    console.log(`  menu item: testid=${testid} text="${text}"`);
  }
  
  // Press Escape to close menu
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

// ============ FLOW 3: Navigate to plot detail from table ============
console.log('\n=== FLOW 3: NAVIGATE TO PLOT DETAIL ===');
// Try clicking the right-content-link or the truncate div
const rightLink = page.locator('[data-testid="content-wrapper-a-right-content-link"]').first();
if (await rightLink.count() > 0) {
  const href = await rightLink.getAttribute('href');
  console.log(`Right content link href: ${href}`);
  await rightLink.click();
  await page.waitForTimeout(3000);
  console.log('After link click URL:', page.url());
  await page.screenshot({ path: 'tmp_plot_detail_from_link.png' });
  
  // Get testids on detail page
  const detailEls = await page.locator('[data-testid]').all();
  const detailIds = new Set();
  for (const el of detailEls) {
    const id = await el.getAttribute('data-testid').catch(() => null);
    if (id) detailIds.add(id);
  }
  console.log('Detail page testids:');
  for (const id of [...detailIds].sort()) console.log(`  ${id}`);
}

await browser.close();
console.log('\nDone!');
