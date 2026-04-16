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

// ============ FLOW A: Edit page from table - find delete button ============
console.log('=== EDIT PAGE FROM TABLE CLICK ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

const matRows = await page.locator('mat-row').all();
if (matRows.length > 0) {
  await matRows[0].click();
  await page.waitForTimeout(3000);
  console.log('Edit page URL:', page.url());
  await page.screenshot({ path: 'tmp_edit_from_table.png', fullPage: false });

  // Get all testids
  const allEls = await page.locator('[data-testid]').all();
  const allIds = new Set();
  for (const el of allEls) {
    const id = await el.getAttribute('data-testid').catch(() => null);
    if (id) allIds.add(id);
  }
  console.log('Edit page testids:');
  for (const id of [...allIds].sort()) console.log(`  ${id}`);
  
  // Check for delete button
  const deleteBtns = await page.locator('[data-testid*="delete"], button:has-text("Delete"), [aria-label*="delete"]').all();
  console.log(`\nDelete buttons: ${deleteBtns.length}`);
  for (const btn of deleteBtns) {
    const testid = await btn.getAttribute('data-testid');
    const text = (await btn.textContent()).trim();
    console.log(`  delete: testid=${testid} text="${text}"`);
  }
  
  // Get all visible buttons
  const allBtns = await page.locator('button:visible').all();
  console.log(`\nAll visible buttons: ${allBtns.length}`);
  for (const btn of allBtns) {
    const testid = await btn.getAttribute('data-testid');
    const text = (await btn.textContent()).trim();
    console.log(`  btn: testid="${testid}" text="${text.substring(0,50)}"`);
  }
}

// ============ FLOW B: Cemetery map - click at plot location coordinates ============
console.log('\n=== CEMETERY MAP: COORDINATE CLICK ===');
await page.goto(`${ORG_BASE}/${CEM_SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

// The map wrapper - find its bounds
const mapWrapper = page.locator('[data-testid="organization-div-map-wrapper"]');
const mapBox = await mapWrapper.boundingBox().catch(() => null);
console.log(`Map wrapper box: ${JSON.stringify(mapBox)}`);

// From the screenshot, plot polygons appear to be in the right 2/3 of the map
// Try clicking at different spots
const clickSpots = [
  { x: 0.55, y: 0.4 }, // center-ish
  { x: 0.7, y: 0.5 },
  { x: 0.6, y: 0.6 },
];

for (const spot of clickSpots) {
  if (!mapBox) break;
  const cx = mapBox.x + mapBox.width * spot.x;
  const cy = mapBox.y + mapBox.height * spot.y;
  await page.mouse.click(cx, cy);
  await page.waitForTimeout(1500);
  const url = page.url();
  const sidebarText = (await page.locator('[data-testid="sidebar-section-opened"]').textContent().catch(() => '')).substring(0,100);
  console.log(`Click (${spot.x},${spot.y}) → URL=${url} sidebar="${sidebarText}"`);
  
  // Take screenshot after first successful plot click
  if (sidebarText.includes('Section') || sidebarText.includes('Plot') || sidebarText.includes('Vacant')) {
    await page.screenshot({ path: 'tmp_map_plot_found.png', fullPage: false });
    console.log('Found plot in sidebar!');
    
    // Get all testids
    const allEls = await page.locator('[data-testid]').all();
    const allIds = new Set();
    for (const el of allEls) {
      const id = await el.getAttribute('data-testid').catch(() => null);
      if (id) allIds.add(id);
    }
    for (const id of [...allIds].sort()) {
      if (!id.startsWith('user-info') && !id.startsWith('side-menu') && !id.startsWith('swiper')) {
        console.log(`  ${id}`);
      }
    }
    break;
  }
}

await browser.close();
console.log('\nDone!');
