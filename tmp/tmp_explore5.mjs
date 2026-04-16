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

// ============ FLOW A: Click Plot ID link in table ============
console.log('\n=== TABLE: CLICK PLOT ID LINK ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Get all 'a' links in table
const tableLinks = await page.locator('[data-testid^="content-wrapper-a"]').all();
console.log(`Table a links: ${tableLinks.length}`);
for (const link of tableLinks.slice(0, 8)) {
  const testid = await link.getAttribute('data-testid');
  const href = await link.getAttribute('href');
  const text = (await link.textContent()).trim();
  const visible = await link.isVisible();
  console.log(`  testid=${testid} href=${href} visible=${visible} text="${text.substring(0,30)}"`);
}

// Click the first visible link that has a plot ID text
for (const link of tableLinks) {
  const text = (await link.textContent()).trim();
  const visible = await link.isVisible();
  const href = await link.getAttribute('href');
  if (visible && text.match(/^[A-Z] [A-Z] \d+/)) {
    console.log(`Clicking: "${text}" href=${href}`);
    await link.click();
    await page.waitForTimeout(3000);
    console.log('After click URL:', page.url());
    await page.screenshot({ path: 'tmp_table_to_detail.png', fullPage: false });
    
    if (!page.url().includes('advance-table')) {
      // Get testids on detail page
      const detailEls = await page.locator('[data-testid]').all();
      const detailIds = new Set();
      for (const el of detailEls) {
        const id = await el.getAttribute('data-testid').catch(() => null);
        if (id) detailIds.add(id);
      }
      console.log('Detail page testids:');
      for (const id of [...detailIds].sort()) console.log(`  ${id}`);
      
      // Check for delete button
      const deleteBtns = await page.locator('[data-testid*="delete"], button:has-text("Delete")').all();
      console.log(`Delete buttons on detail: ${deleteBtns.length}`);
      for (const btn of deleteBtns) {
        const testid = await btn.getAttribute('data-testid');
        const text = (await btn.textContent()).trim();
        const visible = await btn.isVisible();
        console.log(`  delete: testid=${testid} visible=${visible} text="${text}"`);
      }
    }
    break;
  }
}

// ============ FLOW B: Cemetery map - click SVG plot polygon ============
console.log('\n=== CEMETERY MAP: CLICK PLOT POLYGON ===');
await page.goto(`${ORG_BASE}/${CEM_SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
await page.screenshot({ path: 'tmp_cem_map_before.png', fullPage: false });

// Find SVG paths in the overlay pane (these are the plot polygons)
const overlayPane = page.locator('.leaflet-overlay-pane svg');
if (await overlayPane.count() > 0) {
  const svgPaths = await overlayPane.locator('path, polygon, rect, circle').all();
  console.log(`SVG shapes in overlay: ${svgPaths.length}`);
  
  for (const path of svgPaths.slice(0, 5)) {
    const cls = await path.getAttribute('class');
    const d = (await path.getAttribute('d') || '').substring(0, 50);
    const fill = await path.getAttribute('fill');
    const stroke = await path.getAttribute('stroke');
    console.log(`  shape: class="${cls}" fill="${fill}" stroke="${stroke}" d="${d}..."`);
  }
  
  // Click on first path
  if (svgPaths.length > 0) {
    console.log('Clicking first SVG path...');
    await svgPaths[0].click({ force: true }).catch(e => console.log('SVG click failed:', e.message));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tmp_cem_map_after_click.png', fullPage: false });
    console.log('After SVG click URL:', page.url());
    
    // Check sidebar for plot info
    const sidebar = page.locator('[data-testid="sidebar-div-content"]');
    if (await sidebar.count() > 0) {
      const text = (await sidebar.textContent()).trim();
      console.log(`Sidebar after click: "${text.substring(0, 300)}"`);
    }
    
    // Look for plot detail buttons in sidebar
    const sidebarBtns = await page.locator('[data-testid*="sidebar"] [data-testid], [data-testid*="plot-details"]').all();
    console.log(`Sidebar buttons: ${sidebarBtns.length}`);
    for (const btn of sidebarBtns.slice(0,10)) {
      const testid = await btn.getAttribute('data-testid');
      const text = (await btn.textContent()).trim();
      console.log(`  sidebar btn: testid=${testid} text="${text.substring(0,40)}"`);
    }
  }
} else {
  console.log('No overlay SVG found');
}

// ============ FLOW C: Table morevert per row ============
console.log('\n=== TABLE: ROW MOREVERT BUTTON ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Find morevert button (without -0 suffix = row level)
const rowMorevert = page.locator('[data-testid="content-wrapper-button-morevert"]').first();
if (await rowMorevert.count() > 0) {
  const isVis = await rowMorevert.isVisible();
  console.log(`Row morevert visible: ${isVis}`);
  // Scroll into view and click
  await rowMorevert.scrollIntoViewIfNeeded();
  await rowMorevert.click({ force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tmp_row_morevert.png', fullPage: false });
  
  const menuItems = await page.locator('mat-menu-item, [role="menuitem"], .mat-mdc-menu-item').all();
  console.log(`Row morevert menu items: ${menuItems.length}`);
  for (const item of menuItems) {
    const testid = await item.getAttribute('data-testid');
    const text = (await item.textContent()).trim();
    console.log(`  menu: testid=${testid} text="${text}"`);
  }
  await page.keyboard.press('Escape');
}

await browser.close();
console.log('\nDone!');
