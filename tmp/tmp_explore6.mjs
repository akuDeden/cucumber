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
console.log('Logged in:', page.url());

// ============ FLOW A: Navigate to plot detail via plots list ============
console.log('\n=== PLOT DETAIL PAGE ===');
// Navigate to cemetery → see all plots → plot detail
await page.goto(`${ORG_BASE}/${CEM_SLUG}/plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
console.log('Plots list URL:', page.url());

// Find first clickable plot
const plotItems = await page.locator('[data-testid*="plot-name"], button:has-text("Vacant"), li button').all();
console.log(`Plot items: ${plotItems.length}`);

// Try all-plots page directly
await page.goto(`${ORG_BASE}/${CEM_SLUG}/plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Click a specific known plot: B G 9 (Vacant, in section B)
// First expand section B
const toggleBtns = await page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').all();
console.log(`Section toggle buttons: ${toggleBtns.length}`);

if (toggleBtns.length > 0) {
  await toggleBtns[0].click();
  await page.waitForTimeout(2000);
  
  const firstPlot = await page.getByText(/[A-Z] [A-Z] \d+ (Vacant|Occupied|Reserved)/).first();
  if (await firstPlot.count() > 0) {
    const text = await firstPlot.textContent();
    console.log(`Clicking plot: "${text?.trim()}"`);
    await firstPlot.click();
    await page.waitForTimeout(3000);
    console.log('Plot detail URL:', page.url());
    await page.screenshot({ path: 'tmp_plot_detail_page.png', fullPage: false });
    
    // Get all testids on plot detail page
    const allEls = await page.locator('[data-testid]').all();
    const allIds = new Set();
    for (const el of allEls) {
      const id = await el.getAttribute('data-testid').catch(() => null);
      if (id) allIds.add(id);
    }
    console.log('Plot detail testids:');
    for (const id of [...allIds].sort()) console.log(`  ${id}`);
  }
}

// ============ FLOW B: Cemetery map - proper SVG click ============
console.log('\n=== CEMETERY MAP: SVG PLOT CLICK ===');
await page.goto(`${ORG_BASE}/${CEM_SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);
await page.screenshot({ path: 'tmp_map_loaded.png', fullPage: false });

// Find SVG paths directly  
const svgPaths = await page.locator('svg path, svg polygon').all();
console.log(`Total SVG paths: ${svgPaths.length}`);

// Filter for colored/clickable paths (not empty)
for (const path of svgPaths.slice(0, 10)) {
  const cls = await path.getAttribute('class').catch(() => null);
  const fill = await path.getAttribute('fill').catch(() => null);
  const stroke = await path.getAttribute('stroke').catch(() => null);
  const d = (await path.getAttribute('d').catch(() => '') || '').substring(0, 30);
  console.log(`  path: cls="${cls}" fill="${fill}" stroke="${stroke}" d="${d}"`);
}

// Try clicking the first path that has a fill color (plot marker)
for (const path of svgPaths) {
  const fill = await path.getAttribute('fill').catch(() => null);
  const cls = await path.getAttribute('class').catch(() => null);
  if (fill && fill !== 'none' && fill !== 'transparent') {
    console.log(`Clicking path with fill="${fill}" cls="${cls}"`);
    await path.click({ force: true }).catch(e => console.log('Click err:', e.message.substring(0,50)));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tmp_map_plot_clicked.png', fullPage: false });
    
    // Check sidebar
    const sidebar = page.locator('[data-testid="sidebar-div-content"]');
    if (await sidebar.count() > 0) {
      const text = (await sidebar.textContent()).trim();
      console.log(`Sidebar: "${text.substring(0, 300)}"`);
      
      // Get testids in sidebar
      const sidebarEls = await page.locator('[data-testid*="sidebar"], [data-testid*="plot-details"]').all();
      console.log(`Sidebar testids: ${sidebarEls.length}`);
      for (const el of sidebarEls.slice(0,15)) {
        const testid = await el.getAttribute('data-testid');
        const text = (await el.textContent()).trim();
        console.log(`  sidebar: testid=${testid} text="${text.substring(0,40)}"`);
      }
    }
    break;
  }
}

// ============ FLOW C: Table - find clickable plot row ============
console.log('\n=== TABLE: FIND CLICKABLE ROW ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Get the inner HTML of the first plot row container
const plotIdDiv = page.locator('[data-testid="content-wrapper-div-plot-id"]').first();
if (await plotIdDiv.count() > 0) {
  const outerHTML = await plotIdDiv.evaluate(el => el.outerHTML);
  console.log(`Plot ID div outer HTML:\n${outerHTML}`);
  
  // Check parent elements for click handlers
  const parent = plotIdDiv.locator('..');
  const parentHTML = await parent.evaluate(el => el.outerHTML.substring(0, 400));
  console.log(`Parent HTML: ${parentHTML}`);
}

// Look for all `a` tags that contain plot ID patterns
const allAnchors = await page.locator('a').all();
console.log(`All anchors: ${allAnchors.length}`);
for (const a of allAnchors) {
  const text = (await a.textContent()).trim();
  if (text.match(/^[A-Z] [A-Z] \d+/)) {
    const href = await a.getAttribute('href');
    const testid = await a.getAttribute('data-testid');
    console.log(`  Plot anchor: text="${text}" href="${href}" testid="${testid}"`);
  }
}

await browser.close();
console.log('\nDone!');
