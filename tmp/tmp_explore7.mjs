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

// ============ FLOW A: Plot detail page - check all buttons ============
console.log('=== PLOT DETAIL BUTTONS ===');
await page.goto(`${ORG_BASE}/${CEM_SLUG}/plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
const toggleBtns = await page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').all();
if (toggleBtns.length > 0) {
  await toggleBtns[0].click();
  await page.waitForTimeout(2000);
  const firstPlot = await page.getByText(/[A-Z] [A-Z] \d+ (Vacant|Reserved)/).first();
  if (await firstPlot.count() > 0) {
    await firstPlot.click();
    await page.waitForURL('**/plots/**', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tmp_plot_detail_btns.png', fullPage: false });
    console.log('Plot detail URL:', page.url());
    
    // Get all buttons
    const buttons = await page.locator('button[data-testid^="plot-details"]').all();
    console.log(`Plot detail buttons: ${buttons.length}`);
    for (const btn of buttons) {
      const testid = await btn.getAttribute('data-testid');
      const text = (await btn.textContent()).trim();
      const visible = await btn.isVisible();
      console.log(`  btn: testid=${testid} visible=${visible} text="${text.substring(0,50)}"`);
    }
  }
}

// ============ FLOW B: Map - click SVG plot and check result ============
console.log('\n=== MAP: CLICK PLOT POLYGON ===');
await page.goto(`${ORG_BASE}/${CEM_SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

const svgPaths = await page.locator('svg path').all();
let clicked = false;
for (const path of svgPaths) {
  const fill = await path.getAttribute('fill').catch(() => null);
  if (fill && fill !== 'none' && !fill.startsWith('#181') && !fill.startsWith('#673')) {
    const box = await path.boundingBox().catch(() => null);
    if (box && box.width > 10 && box.height > 10) {
      console.log(`Clicking plot path: fill=${fill} box=${JSON.stringify(box)}`);
      await path.click({ force: true });
      clicked = true;
      break;
    }
  }
}
if (!clicked) {
  // Try clicking the center of the map
  const mapWrapper = page.locator('[data-testid="organization-div-map-wrapper"]');
  const box = await mapWrapper.boundingBox().catch(() => null);
  if (box) {
    console.log(`Clicking map center: ${JSON.stringify(box)}`);
    await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.4);
  }
}
await page.waitForTimeout(3000);
await page.screenshot({ path: 'tmp_map_after_plot_click.png', fullPage: false });
console.log('URL after map click:', page.url());

// Check sidebar
const sidebarToggler = page.locator('[data-testid="sidebar-div-toggler"]');
const sidebarContent = page.locator('[data-testid="sidebar-div-content"]');
console.log(`Sidebar toggler visible: ${await sidebarToggler.isVisible()}`);
const sidebarText = (await sidebarContent.textContent().catch(() => '')).trim();
console.log(`Sidebar text: "${sidebarText.substring(0, 300)}"`);

// Get new testids that appeared in sidebar
const sidebarEls = await page.locator('[data-testid*="sidebar"]').all();
for (const el of sidebarEls) {
  const testid = await el.getAttribute('data-testid');
  const text = (await el.textContent()).trim();
  if (text) console.log(`  sidebar el: ${testid} text="${text.substring(0,60)}"`);
}

// ============ FLOW C: Table - navigate to detail ============
console.log('\n=== TABLE: NAVIGATE TO DETAIL ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Try clicking the mat-row (the row element itself)
const matRows = await page.locator('mat-row, [role="row"]').all();
console.log(`Mat rows: ${matRows.length}`);

// Click the first data row (index 1 - skip header)
if (matRows.length > 1) {
  const firstDataRow = matRows[1];
  const rowText = (await firstDataRow.textContent()).trim().substring(0, 80);
  console.log(`Clicking row: "${rowText}"`);
  await firstDataRow.click();
  await page.waitForTimeout(3000);
  console.log('After row click URL:', page.url());
  await page.screenshot({ path: 'tmp_table_row_click.png', fullPage: false });
}

// Also check if plot ID div click works via the parent mat-cell
const plotCells = await page.locator('mat-cell.mat-column-plotId').all();
console.log(`Plot ID cells: ${plotCells.length}`);
if (plotCells.length > 0) {
  const cellText = (await plotCells[0].textContent()).trim();
  console.log(`First cell text: "${cellText}"`);
  await plotCells[0].click();
  await page.waitForTimeout(3000);
  console.log('After cell click URL:', page.url());
}

await browser.close();
console.log('\nDone!');
