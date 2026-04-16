import { chromium } from '@playwright/test';

const BASE_URL = 'https://staging.chronicle.rip';
const ORG_BASE = 'https://staging-aus.chronicle.rip/customer-organization';
const CEM_SLUG = 'astana_tegal_gundul_aus';
const EMAIL = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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

// ============ FLOW A: Cemetery MAP - find clickable plots ============
console.log('\n=== CEMETERY MAP PAGE ===');
await page.goto(`${ORG_BASE}/${CEM_SLUG}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);
await page.screenshot({ path: 'tmp_cemetery_map.png', fullPage: false });
console.log('Cemetery map URL:', page.url());

// Check map structure - look for SVG paths, canvas, or div markers for plots
const svgPaths = await page.locator('svg path').count();
console.log(`SVG paths in map: ${svgPaths}`);

const leafletPanes = await page.locator('[class*="leaflet-pane"]').all();
for (const pane of leafletPanes) {
  const cls = await pane.getAttribute('class');
  const children = await pane.evaluate(el => el.children.length);
  console.log(`  Leaflet pane: "${cls}" children=${children}`);
}

// Try clicking on the map center area to see if any plots are clickable
const mapDiv = page.locator('[data-testid="organization-div-map-wrapper"]').first();
if (await mapDiv.count() > 0) {
  const box = await mapDiv.boundingBox();
  if (box) {
    console.log(`Map box: x=${box.x}, y=${box.y}, w=${box.width}, h=${box.height}`);
    // Click on the map center
    await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tmp_cemetery_map_click.png', fullPage: false });
    console.log('After map click URL:', page.url());
  }
}

// Check for the sidebar plot info after clicking
const sidebarContent = page.locator('[data-testid="sidebar-div-content"]');
if (await sidebarContent.count() > 0) {
  const text = await sidebarContent.textContent();
  console.log(`Sidebar content: "${text?.substring(0,200)}"`);
}

// ============ FLOW B: Table - click blue Plot ID text link ============
console.log('\n=== TABLE - CLICK PLOT ID LINK ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// The blue plot ID links are styled as links - try to click them directly
// "A Z 4086" is the text we saw earlier
const plotLinks = await page.locator('a[class*="link"], a[class*="plot"]').all();
console.log(`Plot-style links: ${plotLinks.length}`);

// Try the div containing plot-id - find the parent that wraps the link
const plotIdDiv = page.locator('[data-testid="content-wrapper-div-plot-id"]').first();
if (await plotIdDiv.count() > 0) {
  // Get its inner HTML to understand structure
  const html = await plotIdDiv.innerHTML();
  console.log(`Plot ID div HTML: ${html.substring(0, 500)}`);
}

// Try right-content-link but scroll into view first
const rightLinks = await page.locator('[data-testid="content-wrapper-a-right-content-link"]').all();
console.log(`Right content links found: ${rightLinks.length}`);
if (rightLinks.length > 0) {
  await rightLinks[0].scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const href = await rightLinks[0].getAttribute('href');
  const isVis = await rightLinks[0].isVisible();
  console.log(`  First right link: href="${href}" visible=${isVis}`);
  // Try JS click
  await rightLinks[0].evaluate(el => el.click());
  await page.waitForTimeout(3000);
  console.log('After JS click URL:', page.url());
  if (!page.url().includes('advance-table?tab=plots') || page.url().includes('manage')) {
    await page.screenshot({ path: 'tmp_plot_detail.png', fullPage: false });
    console.log('Navigated to detail page!');
    // Get testids
    const detailEls = await page.locator('[data-testid]').all();
    const detailIds = new Set();
    for (const el of detailEls) {
      const id = await el.getAttribute('data-testid').catch(() => null);
      if (id) detailIds.add(id);
    }
    console.log('Detail page testids:');
    for (const id of [...detailIds].sort()) console.log(`  ${id}`);
  }
}

// ============ FLOW C: Delete - checkbox then bulk delete ============
console.log('\n=== TABLE - CHECKBOX DELETE ===');
await page.goto(`${ORG_BASE}/advance-table?tab=plots`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Check the FIRST data row checkbox (not header checkbox)
const checkboxes = await page.locator('input[type="checkbox"]').all();
console.log(`Checkboxes found: ${checkboxes.length}`);
if (checkboxes.length > 1) {
  // Click second checkbox (first data row, skip header)
  await checkboxes[1].click({ force: true });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tmp_table_checked.png', fullPage: false });
  
  // Look for any NEW buttons/actions that appeared
  const actionBtns = await page.locator('[data-testid*="delete"], [data-testid*="bulk"], [data-testid*="action"], button:has-text("Delete")').all();
  console.log(`Action buttons after checkbox: ${actionBtns.length}`);
  for (const btn of actionBtns) {
    const testid = await btn.getAttribute('data-testid').catch(() => null);
    const text = (await btn.textContent().catch(() => '')).trim();
    const visible = await btn.isVisible();
    console.log(`  btn: testid=${testid} visible=${visible} text="${text.substring(0,40)}"`);
  }
  
  // Get all testids to find new ones
  const allIds2 = await page.locator('[data-testid]').all();
  const ids2 = new Set();
  for (const el of allIds2) {
    const id = await el.getAttribute('data-testid').catch(() => null);
    if (id) ids2.add(id);
  }
  console.log('All testids with checkbox checked:');
  for (const id of [...ids2].sort()) console.log(`  ${id}`);
}

await browser.close();
console.log('\nDone!');
