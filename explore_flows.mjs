/**
 * UI Flow Exploration Script for Cemetery Management App
 * Explores: Flow 1 (Map Edit), Flow 2 (Delete from advance-table), Flow 3 (View plot detail)
 * Run with: NODE_OPTIONS='--loader ts-node/esm' node --loader ts-node/esm explore_flows.mjs
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const BASE_URL = 'https://staging.chronicle.rip';
const EMAIL    = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';
const SS_DIR   = __dirname; // save screenshots to project root

// Will be set after login (staging redirects to staging-aus)
let ACTUAL_BASE_URL = BASE_URL;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
async function screenshot(page, name) {
  const p = path.join(SS_DIR, `tmp_explore_${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  📸 Screenshot: ${p}`);
  return p;
}

/** Dump all data-testid attributes visible on the page */
async function dumpTestIds(page, label) {
  const ids = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[data-testid]'));
    return [...new Set(els.map(el => el.getAttribute('data-testid')))].filter(Boolean);
  });
  console.log(`\n  [${label}] data-testid attributes (${ids.length}):`);
  ids.forEach(id => console.log(`    - ${id}`));
  return ids;
}

/** Safe evaluate avoiding Playwright-specific selectors in querySelectorAll */
async function safeEval(page, fn, label) {
  try {
    return await page.evaluate(fn);
  } catch (e) {
    console.log(`  [${label}] eval error: ${e.message.substring(0, 100)}`);
    return null;
  }
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
async function login(page) {
  console.log('\n=== LOGIN ===');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log(`  URL: ${page.url()}`);

  const emailSel = '[data-testid="login-mat-form-field-input-mat-input-element"]';
  await page.locator(emailSel).click();
  await page.waitForTimeout(300);
  await page.locator(emailSel).fill(EMAIL);

  const passSel = '[data-testid="login-mat-form-field-input-password"]';
  await page.locator(passSel).click();
  await page.waitForTimeout(300);
  await page.locator(passSel).fill(PASSWORD);

  const loginBtn = '[data-testid="login-login-screen-button-mat-focus-indicator"]';
  await page.locator(loginBtn).click();

  try {
    await page.waitForURL('**/customer-organization**', { timeout: 20000 });
  } catch {
    await page.waitForTimeout(5000);
  }

  // Capture actual base URL after redirect
  const currentUrl = page.url();
  const urlObj = new URL(currentUrl);
  ACTUAL_BASE_URL = `${urlObj.protocol}//${urlObj.host}`;
  console.log(`  Logged in. URL: ${currentUrl}`);
  console.log(`  Actual base URL: ${ACTUAL_BASE_URL}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW 1: Edit plot from MAP page
// ═══════════════════════════════════════════════════════════════════════════════
async function exploreFlow1_Map(page) {
  console.log('\n\n══════════════════════════════════════════════════════');
  console.log('FLOW 1: Edit plot from MAP page');
  console.log('══════════════════════════════════════════════════════');

  // Step 1: The MAP is the dashboard itself at /customer-organization
  // From Run 1, we know the dashboard has a Leaflet map and "Map" is sidebar item 0
  const mapUrl = `${ACTUAL_BASE_URL}/customer-organization`;
  console.log(`\n  [1a] Navigating to map (dashboard): ${mapUrl}`);
  await page.goto(mapUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);
  console.log(`  URL: ${page.url()}`);
  await screenshot(page, 'flow1_map_page');

  // Dump all testids on the map page
  await dumpTestIds(page, 'map-page');

  // Step 2: Examine map structure
  console.log('\n  [1b] Examining map elements...');
  const mapInfo = await safeEval(page, () => {
    // Look for Leaflet/map container
    const mapWrapper = document.querySelector('[data-testid="organization-div-map-wrapper"]');
    const canvas = document.querySelectorAll('canvas');
    const leaflet = document.querySelectorAll('.leaflet-container, .leaflet-pane, .leaflet-map-pane');
    const markers = document.querySelectorAll('.leaflet-marker-icon, .leaflet-marker-shadow, [class*="marker"]');
    const plotMarkers = document.querySelectorAll('[data-testid*="plot"]');

    return {
      mapWrapperExists: !!mapWrapper,
      mapWrapperTestId: mapWrapper?.getAttribute('data-testid'),
      canvasCount: canvas.length,
      leafletContainerCount: leaflet.length,
      markerCount: markers.length,
      plotMarkerCount: plotMarkers.length,
      plotMarkerTestIds: Array.from(plotMarkers).map(m => m.getAttribute('data-testid')),
      mapWrapperHTML: mapWrapper?.outerHTML.substring(0, 1000) || 'NOT FOUND'
    };
  }, 'map-info');
  console.log('  Map info:', JSON.stringify(mapInfo, null, 2));

  // Step 3: Look at cemetery list in sidebar
  console.log('\n  [1c] Examining cemetery list items...');
  const cemeteryItems = await safeEval(page, () => {
    const items = Array.from(document.querySelectorAll('[data-testid^="my-cemetery-item-"]'));
    const cemeteries = [];
    const seen = new Set();
    for (const item of items) {
      const testId = item.getAttribute('data-testid');
      const nameEl = item.querySelector('[data-testid*="cemetery-name"]');
      if (nameEl && !seen.has(nameEl.textContent?.trim())) {
        seen.add(nameEl.textContent?.trim());
        cemeteries.push({
          testId,
          name: nameEl.textContent?.trim(),
          nameTestId: nameEl.getAttribute('data-testid'),
          parentHref: item.closest('a')?.getAttribute('href') || item.getAttribute('href') || ''
        });
      }
    }
    // Also get all h6 cemetery names
    const h6Names = Array.from(document.querySelectorAll('h6[data-testid*="cemetery-name"]'));
    return {
      cemeteries,
      h6Names: h6Names.map(h => ({
        text: h.textContent?.trim(),
        testId: h.getAttribute('data-testid'),
        parentAHref: h.closest('a')?.getAttribute('href') || 'no-link'
      }))
    };
  }, 'cemetery-items');
  console.log('  Cemetery items:', JSON.stringify(cemeteryItems, null, 2));

  // Step 4: Try clicking a cemetery in the sidebar
  console.log('\n  [1d] Clicking first cemetery in sidebar...');
  const cemeteryItemEl = page.locator('[data-testid="my-cemetery-item-h6-cemetery-name"]').first();
  const cemetCount = await cemeteryItemEl.count();
  let cemeterySlug = '';

  if (cemetCount > 0) {
    const cemetText = await cemeteryItemEl.textContent();
    console.log(`  First cemetery: "${cemetText?.trim()}"`);
    await cemeteryItemEl.click();
    await page.waitForTimeout(3000);
    const urlAfterClick = page.url();
    console.log(`  URL after clicking cemetery: ${urlAfterClick}`);

    // Extract slug from URL
    const match = urlAfterClick.match(/customer-organization\/([^\/\?#]+)/);
    if (match) {
      cemeterySlug = match[1];
      console.log(`  Cemetery slug: ${cemeterySlug}`);
    }

    await screenshot(page, 'flow1_after_cemetery_click');
    await dumpTestIds(page, 'after-cemetery-click');
  }

  // Step 5: Examine what changed after clicking cemetery
  // Look for plot markers on the map
  console.log('\n  [1e] Looking for plot markers on map after cemetery click...');
  const plotMarkersAfterClick = await safeEval(page, () => {
    // Leaflet markers
    const leafletMarkers = Array.from(document.querySelectorAll('.leaflet-marker-icon'));
    const plotDataEls = Array.from(document.querySelectorAll('[data-testid*="plot"]'));

    // Check for any map popup/panel
    const popups = Array.from(document.querySelectorAll('.leaflet-popup, [class*="popup"], [data-testid*="popup"]'));

    return {
      leafletMarkerCount: leafletMarkers.length,
      leafletMarkerClasses: leafletMarkers.slice(0, 5).map(m => ({
        class: m.className,
        style: m.getAttribute('style')?.substring(0, 100),
        title: m.getAttribute('title'),
        alt: m.getAttribute('alt'),
        src: m.getAttribute('src')?.substring(0, 100)
      })),
      plotDataElCount: plotDataEls.length,
      plotDataEls: plotDataEls.slice(0, 5).map(e => ({
        testId: e.getAttribute('data-testid'),
        text: e.textContent?.trim().substring(0, 50)
      })),
      popupCount: popups.length,
      popups: popups.map(p => p.outerHTML.substring(0, 200))
    };
  }, 'plot-markers');
  console.log('  Plot markers:', JSON.stringify(plotMarkersAfterClick, null, 2));

  // Step 6: Try to click a Leaflet marker
  const markerEl = page.locator('.leaflet-marker-icon').first();
  const markerCount = await markerEl.count();
  console.log(`\n  [1f] Leaflet markers found: ${markerCount}`);

  if (markerCount > 0) {
    console.log('  Clicking first Leaflet marker...');
    await markerEl.click();
    await page.waitForTimeout(2000);
    await screenshot(page, 'flow1_marker_clicked');

    // Check for popup
    const popupInfo = await safeEval(page, () => {
      const popup = document.querySelector('.leaflet-popup, .leaflet-popup-content, [class*="popup"]');
      const panelEls = document.querySelectorAll('[data-testid*="panel"], [data-testid*="detail"], [data-testid*="plot-info"]');

      return {
        popupExists: !!popup,
        popupHTML: popup?.outerHTML.substring(0, 1000) || 'none',
        panelCount: panelEls.length,
        panelTestIds: Array.from(panelEls).map(e => e.getAttribute('data-testid')),
        newTestIds: Array.from(document.querySelectorAll('[data-testid]'))
          .map(e => e.getAttribute('data-testid'))
          .filter(id => id && (id.includes('plot') || id.includes('popup') || id.includes('panel') || id.includes('detail')))
      };
    }, 'marker-popup');
    console.log('  Popup info:', JSON.stringify(popupInfo, null, 2));

    // Dump all testids after marker click
    await dumpTestIds(page, 'after-marker-click');
  }

  // Step 7: Navigate back to map and try clicking a cemetery plot marker
  await page.goto(mapUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);

  // Click "Map" from sidebar
  console.log('\n  [1g] Clicking Map sidebar button...');
  const mapBtn = page.locator('[data-testid="side-menu-span-label-menu-sidebar-0"]:has-text("Map")');
  const mapBtnCount = await mapBtn.count();
  console.log(`  Map button count: ${mapBtnCount}`);

  // Verify the Map navigation works
  const mapSidebarItem = page.locator('[data-testid="side-menu-span-label-menu-sidebar-0"]').first();
  if (await mapSidebarItem.count() > 0) {
    const text = await mapSidebarItem.textContent();
    console.log(`  First sidebar item text: "${text?.trim()}"`);
  }

  // Step 8: Navigate to cemetery detail page and look for map tab
  if (cemeterySlug) {
    const cemetDetailUrl = `${ACTUAL_BASE_URL}/customer-organization/${cemeterySlug}`;
    console.log(`\n  [1h] Navigating to cemetery detail: ${cemetDetailUrl}`);
    await page.goto(cemetDetailUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(4000);
    console.log(`  URL: ${page.url()}`);
    await screenshot(page, 'flow1_cemetery_detail');
    await dumpTestIds(page, 'cemetery-detail');

    // Look for map tab
    const mapTab = await safeEval(page, () => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"], button, a'));
      return tabs
        .filter(el => el.textContent?.trim().toLowerCase().includes('map'))
        .map(el => ({
          tag: el.tagName,
          testId: el.getAttribute('data-testid'),
          text: el.textContent?.trim().substring(0, 60),
          href: el.getAttribute('href') || '',
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label') || ''
        }));
    }, 'map-tab');
    console.log('  Map tab elements:', JSON.stringify(mapTab, null, 2));

    // Check for tabs in cemetery detail
    const allTabs = await safeEval(page, () => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"], mat-tab'));
      return tabs.map(t => ({
        role: t.getAttribute('role'),
        testId: t.getAttribute('data-testid'),
        text: t.textContent?.trim().substring(0, 60),
        ariaLabel: t.getAttribute('aria-label') || ''
      }));
    }, 'all-tabs');
    console.log('  All tabs on cemetery page:', JSON.stringify(allTabs, null, 2));

    // Look for any navigation items at top of page
    const cemNavItems = await safeEval(page, () => {
      const navEls = Array.from(document.querySelectorAll('nav a, [role="tablist"] *, mat-tab-group mat-tab-header'));
      return navEls.map(el => ({
        tag: el.tagName,
        testId: el.getAttribute('data-testid'),
        text: el.textContent?.trim().substring(0, 60),
        href: el.getAttribute('href') || ''
      }));
    }, 'cem-nav');
    console.log('  Cemetery nav items:', JSON.stringify(cemNavItems, null, 2));

    // Try map URL from cemetery
    const cemetMapUrl = `${ACTUAL_BASE_URL}/customer-organization/${cemeterySlug}/map`;
    console.log(`\n  [1i] Trying cemetery map URL: ${cemetMapUrl}`);
    const resp = await page.goto(cemetMapUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000);
    console.log(`  Response: ${resp?.status()}, Final URL: ${page.url()}`);
    if (page.url() !== `${ACTUAL_BASE_URL}/customer-organization` && !page.url().includes('/login')) {
      await screenshot(page, 'flow1_cemetery_map');
      await dumpTestIds(page, 'cemetery-map');
    }

    // Go back to cemetery detail page and explore all buttons/links
    await page.goto(cemetDetailUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);

    console.log('\n  [1j] All buttons and links on cemetery detail page...');
    const cemButtons = await safeEval(page, () => {
      const btns = Array.from(document.querySelectorAll('button, a[href]'));
      return btns.slice(0, 40).map(el => ({
        tag: el.tagName,
        testId: el.getAttribute('data-testid'),
        text: el.textContent?.trim().substring(0, 60),
        href: el.getAttribute('href') || '',
        ariaLabel: el.getAttribute('aria-label') || ''
      })).filter(el => el.text || el.href || el.ariaLabel);
    }, 'cem-buttons');
    console.log('  Cemetery buttons/links:', JSON.stringify(cemButtons, null, 2));

    // Check for plots button
    const seeAllPlotsBtn = page.locator('[data-testid="plots-statistic-a-button"]');
    if (await seeAllPlotsBtn.count() > 0) {
      console.log('\n  [1k] "See all Plots" button found. Clicking...');
      await seeAllPlotsBtn.click();
      await page.waitForTimeout(3000);
      console.log(`  URL after: ${page.url()}`);
      await screenshot(page, 'flow1_plots_list');
      await dumpTestIds(page, 'plots-list');

      // Look for map view toggle on plots list page
      const mapToggle = await safeEval(page, () => {
        const allEls = Array.from(document.querySelectorAll('[data-testid], button, a'));
        return allEls
          .filter(el => {
            const text = el.textContent?.trim().toLowerCase();
            const testId = el.getAttribute('data-testid')?.toLowerCase() || '';
            return text?.includes('map') || testId.includes('map');
          })
          .map(el => ({
            tag: el.tagName,
            testId: el.getAttribute('data-testid'),
            text: el.textContent?.trim().substring(0, 60),
            href: el.getAttribute('href') || ''
          }));
      }, 'map-toggle');
      console.log('  Map toggle on plots list:', JSON.stringify(mapToggle, null, 2));
    }
  }

  // Step 9: Go back to main map page and try to interact with plot markers more carefully
  console.log('\n  [1l] Back to main map page - examining map markers in detail...');
  await page.goto(mapUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);

  // Get all clickable elements on the map
  const mapClickables = await safeEval(page, () => {
    const container = document.querySelector('[data-testid="organization-div-map-wrapper"]');
    if (!container) return { error: 'no map wrapper' };

    const clickables = Array.from(container.querySelectorAll('*'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.cursor === 'pointer' || el.tagName === 'A' || el.tagName === 'BUTTON';
      })
      .slice(0, 20)
      .map(el => ({
        tag: el.tagName,
        testId: el.getAttribute('data-testid'),
        class: el.className?.toString().substring(0, 80),
        title: el.getAttribute('title'),
        text: el.textContent?.trim().substring(0, 40),
        isVisible: el.offsetWidth > 0 && el.offsetHeight > 0
      }));

    return {
      clickables,
      containerHTML: container.outerHTML.substring(0, 2000)
    };
  }, 'map-clickables');
  console.log('  Map clickables:', JSON.stringify(mapClickables, null, 2));

  // Try to click any plot-related markers
  const plotSvgEls = page.locator('[data-testid*="plot"], .leaflet-marker-icon, [class*="plot-marker"]');
  const plotSvgCount = await plotSvgEls.count();
  console.log(`\n  [1m] Plot SVG/marker elements: ${plotSvgCount}`);

  if (plotSvgCount > 0) {
    for (let i = 0; i < Math.min(3, plotSvgCount); i++) {
      const el = plotSvgEls.nth(i);
      const testId = await el.getAttribute('data-testid');
      const text = await el.textContent();
      const cls = await el.getAttribute('class');
      console.log(`  Marker ${i}: testId=${testId}, class=${cls?.substring(0, 60)}, text="${text?.trim().substring(0, 40)}"`);
    }

    // Click the first marker
    try {
      await plotSvgEls.first().click({ timeout: 5000 });
      await page.waitForTimeout(2000);
      console.log(`  URL after marker click: ${page.url()}`);
      await screenshot(page, 'flow1_marker_first_click');

      // Check for popup/panel
      const popup = await safeEval(page, () => {
        const popupEl = document.querySelector('.leaflet-popup, .leaflet-popup-content-wrapper');
        const allNewTestIds = Array.from(document.querySelectorAll('[data-testid]'))
          .map(el => el.getAttribute('data-testid'))
          .filter(id => id && (
            id.includes('plot') || id.includes('popup') || id.includes('panel') ||
            id.includes('detail') || id.includes('marker') || id.includes('cemetery-item')
          ));
        return {
          popupExists: !!popupEl,
          popupHTML: popupEl?.outerHTML.substring(0, 500),
          relevantTestIds: allNewTestIds
        };
      }, 'first-marker-click-result');
      console.log('  After first marker click:', JSON.stringify(popup, null, 2));
    } catch (e) {
      console.log(`  Could not click marker: ${e.message}`);
    }
  }

  // Step 10: Try clicking the sidebar cemetery items to see if map zooms and shows plots
  console.log('\n  [1n] Clicking first cemetery sidebar item to zoom to its plots...');
  await page.goto(mapUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);

  const cemeteryCard = page.locator('[data-testid="my-cemetery-item-div-cemetery-info"]').first();
  if (await cemeteryCard.count() > 0) {
    await cemeteryCard.click();
    await page.waitForTimeout(3000);
    console.log(`  URL after cemetery card click: ${page.url()}`);
    await screenshot(page, 'flow1_after_cemetery_card_click');

    // Check if we're now on a cemetery page with map
    const newPageInfo = await safeEval(page, () => {
      return {
        url: window.location.href,
        testIds: Array.from(document.querySelectorAll('[data-testid]'))
          .map(e => e.getAttribute('data-testid'))
          .filter(id => id && (id.includes('map') || id.includes('plot') || id.includes('marker')))
      };
    }, 'after-cemetery-card');
    console.log('  New page info:', JSON.stringify(newPageInfo, null, 2));

    // Wait for any map markers to appear
    await page.waitForTimeout(2000);
    const markerCountAfter = await page.locator('.leaflet-marker-icon').count();
    console.log(`  Leaflet markers after cemetery click: ${markerCountAfter}`);

    if (markerCountAfter > 0) {
      // Get marker details
      const markerDetails = await safeEval(page, () => {
        const markers = Array.from(document.querySelectorAll('.leaflet-marker-icon'));
        return markers.slice(0, 5).map(m => ({
          src: m.getAttribute('src')?.substring(0, 100),
          class: m.className?.substring(0, 100),
          style: m.getAttribute('style')?.substring(0, 100),
          title: m.getAttribute('title'),
          alt: m.getAttribute('alt'),
          width: m.style?.width,
          height: m.style?.height,
          parentHTML: m.parentElement?.outerHTML?.substring(0, 300)
        }));
      }, 'marker-details');
      console.log('  Marker details:', JSON.stringify(markerDetails, null, 2));

      // Click the first plot marker
      const firstMarker = page.locator('.leaflet-marker-icon').first();
      console.log('\n  [1o] Clicking first plot marker on map...');
      await firstMarker.click({ force: true });
      await page.waitForTimeout(3000);
      await screenshot(page, 'flow1_plot_marker_clicked');

      const afterMarkerClickInfo = await safeEval(page, () => {
        // Check for popup
        const leafletPopup = document.querySelector('.leaflet-popup');
        const leafletPopupContent = document.querySelector('.leaflet-popup-content');

        // Check for side panel opening
        const sidePanel = document.querySelector('mat-sidenav.mat-drawer-opened, [class*="panel"][class*="open"]');

        // Get all testids
        const allTestIds = Array.from(document.querySelectorAll('[data-testid]'))
          .map(e => e.getAttribute('data-testid'));

        // Check for plot-related new elements
        const plotEls = allTestIds.filter(id => id && (
          id.includes('plot') || id.includes('popup') || id.includes('sidebar') ||
          id.includes('panel') || id.includes('detail') || id.includes('cemetery-item')
        ));

        return {
          currentUrl: window.location.href,
          leafletPopupExists: !!leafletPopup,
          leafletPopupHTML: leafletPopup?.outerHTML.substring(0, 800),
          leafletPopupContent: leafletPopupContent?.textContent?.trim().substring(0, 200),
          sidePanelExists: !!sidePanel,
          plotRelatedTestIds: plotEls,
          totalTestIds: allTestIds.length
        };
      }, 'plot-marker-clicked');
      console.log('  After plot marker click:', JSON.stringify(afterMarkerClickInfo, null, 2));

      if (afterMarkerClickInfo?.leafletPopupExists) {
        console.log('\n  POPUP FOUND! Examining popup content...');

        // Check for edit button in popup
        const popupButtons = await safeEval(page, () => {
          const popup = document.querySelector('.leaflet-popup-content');
          if (!popup) return [];
          const btns = Array.from(popup.querySelectorAll('button, a, [role="button"]'));
          return btns.map(b => ({
            tag: b.tagName,
            testId: b.getAttribute('data-testid'),
            text: b.textContent?.trim().substring(0, 60),
            href: b.getAttribute('href') || '',
            ariaLabel: b.getAttribute('aria-label') || ''
          }));
        }, 'popup-buttons');
        console.log('  Popup buttons:', JSON.stringify(popupButtons, null, 2));

        // Get full popup DOM
        const fullPopupDOM = await safeEval(page, () => {
          const popup = document.querySelector('.leaflet-popup');
          return popup?.outerHTML.substring(0, 3000);
        }, 'popup-full-dom');
        console.log('  Full popup DOM:', fullPopupDOM);

        await screenshot(page, 'flow1_popup_detail');
      }

      // Try navigating to URL after clicking marker
      const finalUrl = page.url();
      if (finalUrl !== `${ACTUAL_BASE_URL}/customer-organization` && !finalUrl.includes('/login')) {
        console.log(`\n  Marker click navigated to: ${finalUrl}`);
        await dumpTestIds(page, 'after-marker-nav');

        // Look for edit button
        const editBtnOnNav = await safeEval(page, () => {
          const editEls = Array.from(document.querySelectorAll('[data-testid*="edit"], button'));
          return editEls.map(e => ({
            testId: e.getAttribute('data-testid'),
            text: e.textContent?.trim().substring(0, 60),
            tag: e.tagName
          })).filter(e => e.testId?.includes('edit') || e.text?.toLowerCase().includes('edit'));
        }, 'edit-buttons-nav');
        console.log('  Edit buttons after nav:', JSON.stringify(editBtnOnNav, null, 2));
      }
    }
  }

  // Step 11: Summary of map edit flow
  console.log('\n  [FLOW 1 KEY FINDINGS]');
  console.log(`  - Main map URL: ${mapUrl}`);
  console.log(`  - Map is the dashboard (Leaflet-based)`);
  console.log(`  - Cemetery sidebar items testid: "my-cemetery-item-div-cemetery-info" / "my-cemetery-item-h6-cemetery-name"`);
  console.log(`  - Map wrapper testid: "organization-div-map-wrapper"`);
  console.log(`  - Map sidebar toggle: "side-menu-span-label-menu-sidebar-0" with text "Map"`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW 2: Delete plot from advance-table
// ═══════════════════════════════════════════════════════════════════════════════
async function exploreFlow2_Delete(page) {
  console.log('\n\n══════════════════════════════════════════════════════');
  console.log('FLOW 2: Delete plot from advance-table (Tables section)');
  console.log('══════════════════════════════════════════════════════');

  // Use ACTUAL_BASE_URL (staging-aus) instead of staging
  const tableUrl = `${ACTUAL_BASE_URL}/customer-organization/advance-table?tab=plots`;
  console.log(`\n  [2a] Navigating to: ${tableUrl}`);
  await page.goto(tableUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);
  await screenshot(page, 'flow2_advance_table');

  // Dump all testids
  await dumpTestIds(page, 'advance-table-plots');

  // Step 2: Examine table structure
  console.log('\n  [2b] Table structure analysis...');
  const tableStructure = await safeEval(page, () => {
    const tableWrapper = document.querySelector('[data-testid*="content-wrapper"]');
    const tabs = Array.from(document.querySelectorAll('[data-testid*="content-wrapper-a"]'));
    const plotIdCells = Array.from(document.querySelectorAll('[data-testid*="plot-id"]'));
    const tableRows = Array.from(document.querySelectorAll('tr, [role="row"]'));

    return {
      tableWrapperTestId: tableWrapper?.getAttribute('data-testid'),
      tabs: tabs.map(t => ({ testId: t.getAttribute('data-testid'), text: t.textContent?.trim().substring(0, 40) })),
      plotIdCellCount: plotIdCells.length,
      plotIdCells: plotIdCells.slice(0, 5).map(c => ({
        testId: c.getAttribute('data-testid'),
        text: c.textContent?.trim().substring(0, 60),
        tag: c.tagName,
        parentTag: c.parentElement?.tagName,
        parentTestId: c.parentElement?.getAttribute('data-testid')
      })),
      tableRowCount: tableRows.length
    };
  }, 'table-structure');
  console.log('  Table structure:', JSON.stringify(tableStructure, null, 2));

  // Step 3: Find action buttons
  console.log('\n  [2c] Looking for action/delete buttons...');
  const actionButtons = await safeEval(page, () => {
    const results = [];

    // Look by testid patterns (no :has-text() in native querySelectorAll)
    const deleteSelectors = [
      '[data-testid*="delete"]',
      '[data-testid*="action"]',
      '[data-testid*="more"]',
      '[data-testid*="kebab"]',
      '[data-testid*="three-dot"]',
      '[data-testid*="dot-menu"]',
      '[data-testid*="option"]',
    ];
    for (const sel of deleteSelectors) {
      const els = Array.from(document.querySelectorAll(sel));
      if (els.length > 0) {
        results.push({
          sel,
          count: els.length,
          samples: els.slice(0, 3).map(e => ({
            testId: e.getAttribute('data-testid'),
            text: e.textContent?.trim().substring(0, 40),
            ariaLabel: e.getAttribute('aria-label') || ''
          }))
        });
      }
    }

    // Look for mat-icons with "more" or "delete" text
    const matIcons = Array.from(document.querySelectorAll('mat-icon'));
    const relevantIcons = matIcons.filter(i => {
      const t = i.textContent?.trim().toLowerCase();
      return t === 'more_vert' || t === 'more_horiz' || t === 'delete' || t === 'more';
    });

    results.push({
      sel: 'mat-icon (more/delete)',
      count: relevantIcons.length,
      samples: relevantIcons.slice(0, 5).map(i => ({
        text: i.textContent?.trim(),
        svgicon: i.getAttribute('svgicon'),
        parentTestId: i.parentElement?.getAttribute('data-testid'),
        parentAriaLabel: i.parentElement?.getAttribute('aria-label'),
        grandParentTestId: i.parentElement?.parentElement?.getAttribute('data-testid')
      }))
    });

    return results;
  }, 'action-buttons');
  console.log('  Action buttons:', JSON.stringify(actionButtons, null, 2));

  // Step 4: Get first plot row HTML
  console.log('\n  [2d] Getting first plot row HTML...');
  const firstRowInfo = await safeEval(page, () => {
    const plotCell = document.querySelector('[data-testid="content-wrapper-div-plot-id-0"]');
    if (!plotCell) return { error: 'no plot cell found' };

    // Walk up to find parent row
    let row = plotCell;
    let depth = 0;
    while (row.parentElement && depth < 15) {
      const parent = row.parentElement;
      const parentRole = parent.getAttribute('role');
      if (parentRole === 'row' || parent.tagName === 'TR') {
        row = parent;
        break;
      }
      depth++;
      row = parent;
    }

    // Get siblings of the plot cell (other cells in the same row container)
    const container = row.parentElement || row;
    const siblings = Array.from(container.children).map(c => ({
      tag: c.tagName,
      testId: c.getAttribute('data-testid'),
      class: c.className?.substring(0, 80),
      text: c.textContent?.trim().substring(0, 60)
    }));

    // Get all elements with testids within the row area
    const rowTestIds = Array.from(row.querySelectorAll('[data-testid]')).map(e => ({
      testId: e.getAttribute('data-testid'),
      text: e.textContent?.trim().substring(0, 40),
      tag: e.tagName
    }));

    return {
      plotCellTestId: plotCell.getAttribute('data-testid'),
      rowTag: row.tagName,
      rowTestId: row.getAttribute('data-testid'),
      rowClass: row.className?.substring(0, 100),
      rowHTML: row.outerHTML.substring(0, 3000),
      rowTestIds,
      siblings
    };
  }, 'first-row-html');
  console.log('  First row info:');
  console.log(`    plotCellTestId: ${firstRowInfo?.plotCellTestId}`);
  console.log(`    rowTag: ${firstRowInfo?.rowTag}`);
  console.log(`    rowTestId: ${firstRowInfo?.rowTestId}`);
  console.log(`    rowClass: ${firstRowInfo?.rowClass}`);
  console.log(`    rowTestIds: ${JSON.stringify(firstRowInfo?.rowTestIds)}`);
  console.log(`    rowHTML (first 2000): ${firstRowInfo?.rowHTML?.substring(0, 2000)}`);

  // Step 5: Hover over first row to reveal action buttons
  const firstPlotRow = page.locator('[data-testid="content-wrapper-div-plot-id-0"]').first();
  if (await firstPlotRow.count() > 0) {
    console.log('\n  [2e] Hovering over first plot row...');
    await firstPlotRow.hover();
    await page.waitForTimeout(1500);
    await screenshot(page, 'flow2_hover_row');

    // Check for newly visible elements
    const afterHover = await safeEval(page, () => {
      return Array.from(document.querySelectorAll('[data-testid]'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          const testId = el.getAttribute('data-testid') || '';
          return rect.width > 0 && rect.height > 0 && (
            testId.includes('delete') || testId.includes('action') ||
            testId.includes('edit') || testId.includes('menu') ||
            testId.includes('more') || testId.includes('option') || testId.includes('dot')
          );
        })
        .map(el => ({
          testId: el.getAttribute('data-testid'),
          text: el.textContent?.trim().substring(0, 50),
          tag: el.tagName,
          ariaLabel: el.getAttribute('aria-label') || ''
        }));
    }, 'after-hover');
    console.log('  Elements visible after hover:', JSON.stringify(afterHover, null, 2));

    // Full testids after hover
    await dumpTestIds(page, 'after-hover-full');
  }

  // Step 6: Check for any "action" button that opens a menu
  console.log('\n  [2f] Checking for action button to open menu...');
  const actionBtnSel = '[data-testid="content-wrapper-button-action"]';
  const filterBtnEl = page.locator(actionBtnSel).first();
  if (await filterBtnEl.count() > 0) {
    console.log('  Found action button! Clicking...');
    await filterBtnEl.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'flow2_action_open');

    const menuContent = await safeEval(page, () => {
      // Look in CDK overlay container for menu
      const overlay = document.querySelector('.cdk-overlay-container');
      const menus = Array.from(document.querySelectorAll('[role="menu"], mat-menu, .mat-menu-panel'));
      const allMenuItems = Array.from(document.querySelectorAll('[role="menuitem"]'));

      return {
        overlayHTML: overlay?.innerHTML.substring(0, 2000) || 'no overlay',
        menuCount: menus.length,
        menuItems: allMenuItems.map(item => ({
          testId: item.getAttribute('data-testid'),
          text: item.textContent?.trim().substring(0, 60),
          role: item.getAttribute('role')
        })),
        allButtonsInOverlay: overlay
          ? Array.from(overlay.querySelectorAll('button')).map(b => ({
              testId: b.getAttribute('data-testid'),
              text: b.textContent?.trim().substring(0, 60)
            }))
          : []
      };
    }, 'action-menu-content');
    console.log('  Action menu content:', JSON.stringify(menuContent, null, 2));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Step 7: Look for any "three dots" / contextual action per ROW specifically
  console.log('\n  [2g] Looking for per-row action buttons...');

  // Try right-clicking on a row cell
  const firstCellEl = page.locator('[data-testid="content-wrapper-div-plot-id-0"]').first();
  if (await firstCellEl.count() > 0) {
    console.log('  Right-clicking on first plot cell...');
    await firstCellEl.click({ button: 'right' });
    await page.waitForTimeout(1500);
    await screenshot(page, 'flow2_right_click_cell');

    const contextMenuAfterRightClick = await safeEval(page, () => {
      const overlay = document.querySelector('.cdk-overlay-container');
      const menus = Array.from(document.querySelectorAll('[role="menu"]'));
      return {
        overlayVisible: !!overlay && overlay.children.length > 0,
        overlayHTML: overlay?.innerHTML.substring(0, 1000),
        menus: menus.map(m => ({
          testId: m.getAttribute('data-testid'),
          items: Array.from(m.querySelectorAll('[role="menuitem"], button')).map(i => ({
            testId: i.getAttribute('data-testid'),
            text: i.textContent?.trim().substring(0, 60)
          }))
        }))
      };
    }, 'right-click-context-menu');
    console.log('  Context menu after right-click:', JSON.stringify(contextMenuAfterRightClick, null, 2));

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // Step 8: Examine the full table HTML to find delete mechanism
  console.log('\n  [2h] Examining full table HTML for delete patterns...');
  const fullTableHTML = await safeEval(page, () => {
    // Get the main content area
    const mainContent = document.querySelector('[data-testid*="content-wrapper"]');
    if (!mainContent) return 'content wrapper not found';

    // Look for any delete-related text or icons
    const allText = mainContent.innerText;
    const hasDelete = allText.toLowerCase().includes('delete');
    const hasRemove = allText.toLowerCase().includes('remove');

    // Get table HTML
    const table = mainContent.querySelector('table, [role="grid"], mat-table');

    return {
      hasDelete,
      hasRemove,
      tableHTML: table?.outerHTML.substring(0, 5000) || 'no table found',
      mainHTML: mainContent.outerHTML.substring(0, 3000)
    };
  }, 'full-table-html');
  console.log('  Has delete text:', fullTableHTML?.hasDelete);
  console.log('  Has remove text:', fullTableHTML?.hasRemove);
  console.log('  Table HTML (first 3000):', fullTableHTML?.tableHTML?.substring(0, 3000));

  // Step 9: Look for any "..." or dots buttons in each row
  console.log('\n  [2i] Looking for all icon buttons and mat-icons in the table...');
  const allIcons = await safeEval(page, () => {
    return Array.from(document.querySelectorAll('mat-icon, button[mat-icon-button], [class*="icon-button"]'))
      .slice(0, 50)
      .map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim(),
        svgicon: el.getAttribute('svgicon'),
        testId: el.getAttribute('data-testid'),
        ariaLabel: el.getAttribute('aria-label'),
        parentTestId: el.parentElement?.getAttribute('data-testid'),
        parentClass: el.parentElement?.className?.substring(0, 60),
        isVisible: el.getBoundingClientRect().width > 0
      }));
  }, 'all-icons');
  console.log('  All icons (first 50):', JSON.stringify(allIcons, null, 2));

  await screenshot(page, 'flow2_final');

  // Summary
  console.log('\n  [FLOW 2 KEY FINDINGS]');
  console.log(`  - Table URL: ${tableUrl}`);
  console.log(`  - Plot ID cell testid: "content-wrapper-div-plot-id-0"`);
  console.log(`  - Filter/Action button testid: "content-wrapper-button-action"`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOW 3: View plot detail from advance-table
// ═══════════════════════════════════════════════════════════════════════════════
async function exploreFlow3_Detail(page) {
  console.log('\n\n══════════════════════════════════════════════════════');
  console.log('FLOW 3: View plot detail from advance-table');
  console.log('══════════════════════════════════════════════════════');

  const tableUrl = `${ACTUAL_BASE_URL}/customer-organization/advance-table?tab=plots`;
  console.log(`\n  [3a] Navigating to: ${tableUrl}`);
  await page.goto(tableUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log(`  URL: ${page.url()}`);

  // Step 2: Get first plot information
  const plotCellEl = page.locator('[data-testid="content-wrapper-div-plot-id-0"]').first();
  const plotCellCount = await plotCellEl.count();
  console.log(`\n  [3b] Plot cell count: ${plotCellCount}`);

  if (plotCellCount > 0) {
    const plotText = await plotCellEl.textContent();
    console.log(`  First plot ID text: "${plotText?.trim()}"`);

    // Get surrounding row testids
    const rowTestIds = await safeEval(page, () => {
      const cell = document.querySelector('[data-testid="content-wrapper-div-plot-id-0"]');
      if (!cell) return [];
      // Get all siblings in parent
      const parent = cell.parentElement;
      if (!parent) return [];
      return Array.from(parent.querySelectorAll('[data-testid]')).map(e => ({
        testId: e.getAttribute('data-testid'),
        text: e.textContent?.trim().substring(0, 40),
        tag: e.tagName
      }));
    }, 'row-testids');
    console.log('  Row testids:', JSON.stringify(rowTestIds, null, 2));

    // Step 3: Try clicking the plot cell to navigate to detail
    console.log('\n  [3c] Clicking plot ID cell...');
    await plotCellEl.click();
    await page.waitForTimeout(3000);
    const urlAfterCellClick = page.url();
    console.log(`  URL after cell click: ${urlAfterCellClick}`);

    if (urlAfterCellClick !== tableUrl && !urlAfterCellClick.endsWith('/customer-organization')) {
      await screenshot(page, 'flow3_plot_detail');
      await dumpTestIds(page, 'plot-detail-page');

      const detailInfo = await safeEval(page, () => {
        const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({
          tag: h.tagName,
          testId: h.getAttribute('data-testid'),
          text: h.textContent?.trim().substring(0, 100)
        }));

        const statusEl = document.querySelector('[data-testid*="status"]');
        const plotIdEl = document.querySelector('[data-testid*="plot-id"]');
        const sectionEl = document.querySelector('[data-testid*="section"]');
        const cemeteryEl = document.querySelector('[data-testid*="cemetery"]');

        return {
          url: window.location.href,
          urlPattern: window.location.pathname,
          headings,
          statusTestId: statusEl?.getAttribute('data-testid'),
          statusText: statusEl?.textContent?.trim().substring(0, 60),
          plotIdTestId: plotIdEl?.getAttribute('data-testid'),
          plotIdText: plotIdEl?.textContent?.trim().substring(0, 60),
          sectionTestId: sectionEl?.getAttribute('data-testid'),
          cemeteryTestId: cemeteryEl?.getAttribute('data-testid')
        };
      }, 'plot-detail-info');
      console.log('\n  [3d] Plot detail info:', JSON.stringify(detailInfo, null, 2));

    } else {
      console.log('  No navigation. Checking if panel appeared...');

      // Check for any panel/modal
      const panelInfo = await safeEval(page, () => {
        const panels = Array.from(document.querySelectorAll('[role="dialog"], mat-dialog-container, .cdk-overlay-pane'));
        const drawers = Array.from(document.querySelectorAll('mat-sidenav, mat-drawer, [class*="panel-open"]'));
        return {
          dialogCount: panels.length,
          drawerCount: drawers.length,
          panelTestIds: panels.map(p => p.getAttribute('data-testid')),
          newElements: Array.from(document.querySelectorAll('[data-testid]'))
            .map(e => e.getAttribute('data-testid'))
            .filter(id => id && (id.includes('detail') || id.includes('panel') || id.includes('plot-view')))
        };
      }, 'panel-check');
      console.log('  Panel check:', JSON.stringify(panelInfo, null, 2));
    }

    // Step 4: Navigate back to table and check for a link in the row
    await page.goto(tableUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(5000);

    console.log('\n  [3e] Checking for links in first row...');
    const rowLinks = await safeEval(page, () => {
      // Check all anchors that might lead to plot detail
      const anchors = Array.from(document.querySelectorAll('a[href*="plot"], a[href*="manage"]'));
      const allAnchors = Array.from(document.querySelectorAll('a[href]')).slice(0, 30);

      return {
        plotLinks: anchors.map(a => ({
          href: a.getAttribute('href'),
          testId: a.getAttribute('data-testid'),
          text: a.textContent?.trim().substring(0, 50)
        })),
        allLinks: allAnchors.map(a => ({
          href: a.getAttribute('href'),
          testId: a.getAttribute('data-testid'),
          text: a.textContent?.trim().substring(0, 40)
        })).filter(a => a.href && !a.href.startsWith('http'))
      };
    }, 'row-links');
    console.log('  Row links:', JSON.stringify(rowLinks, null, 2));

    // Step 5: Check if there's a link in the plot cell parent
    const plotCellLink = await safeEval(page, () => {
      const cell = document.querySelector('[data-testid="content-wrapper-div-plot-id-0"]');
      if (!cell) return null;

      const anchor = cell.closest('a') || cell.querySelector('a');
      const cursor = window.getComputedStyle(cell).cursor;

      // Check all parents for href
      let parent = cell;
      let found = null;
      for (let i = 0; i < 10; i++) {
        if (!parent.parentElement) break;
        parent = parent.parentElement;
        if (parent.tagName === 'A') {
          found = { type: 'parent-anchor', href: parent.getAttribute('href') };
          break;
        }
        if (parent.onclick || parent.getAttribute('ng-click') || parent.getAttribute('(click)')) {
          found = { type: 'click-handler', tag: parent.tagName, testId: parent.getAttribute('data-testid') };
          break;
        }
      }

      return {
        hasAnchor: !!anchor,
        anchorHref: anchor?.getAttribute('href'),
        cellCursor: cursor,
        parentAnchorFound: found,
        cellHTML: cell.outerHTML.substring(0, 500),
        parentHTML: cell.parentElement?.outerHTML.substring(0, 1000)
      };
    }, 'plot-cell-link-analysis');
    console.log('  Plot cell link analysis:', JSON.stringify(plotCellLink, null, 2));
  }

  // Step 6: Try to get a plot detail URL by using the advance search results page
  console.log('\n  [3f] Trying to find plot detail via advance search...');
  const searchUrl = `${ACTUAL_BASE_URL}/search/advance`;
  const resp = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(3000);
  console.log(`  Search page response: ${resp?.status()}, URL: ${page.url()}`);

  if (page.url().includes('/search/advance')) {
    await screenshot(page, 'flow3_advance_search');
    await dumpTestIds(page, 'advance-search-page');
  }

  // Step 7: Navigate to plot detail directly using a known URL pattern
  console.log('\n  [3g] Trying direct navigation to plot detail via cemetery slug...');

  // From earlier we know the cemetery name is "Astana Tegal Gundul" (astana_tegal_gundul)
  // Region is "aus"
  const testPlotIds = ['A A 1', 'A B 1', 'A A 3'];

  for (const plotId of testPlotIds) {
    const encodedId = encodeURIComponent(plotId);
    // Try various URL patterns
    const urls = [
      `${ACTUAL_BASE_URL}/customer-organization/astana_tegal_gundul_aus/plots/${encodedId}`,
      `${ACTUAL_BASE_URL}/customer-organization/astana_tegal_gundul_aus/${encodedId}`,
    ];

    for (const url of urls) {
      try {
        const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
        await page.waitForTimeout(2000);
        const finalUrl = page.url();
        const status = r?.status();
        if (status !== 404 && !finalUrl.includes('/login') && !finalUrl.endsWith('/customer-organization')) {
          console.log(`  SUCCESS: ${url} → ${finalUrl} (${status})`);
          await screenshot(page, 'flow3_plot_detail_direct');
          await dumpTestIds(page, 'plot-detail-direct');

          const detailPage = await safeEval(page, () => {
            const allTestIds = Array.from(document.querySelectorAll('[data-testid]'))
              .map(e => ({
                testId: e.getAttribute('data-testid'),
                text: e.textContent?.trim().substring(0, 80),
                tag: e.tagName
              }))
              .filter(e => e.testId);

            const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => ({
              tag: h.tagName,
              testId: h.getAttribute('data-testid'),
              text: h.textContent?.trim().substring(0, 100)
            }));

            return {
              url: window.location.href,
              urlPattern: window.location.pathname.replace(/\/[a-f0-9-]{36}\//g, '/{uuid}/'),
              headings,
              allTestIds: allTestIds.slice(0, 60)
            };
          }, 'plot-detail-direct-info');
          console.log('  Plot detail direct info:', JSON.stringify(detailPage, null, 2));
          break;
        } else {
          console.log(`  Failed: ${url} → ${finalUrl} (${status})`);
        }
      } catch (e) {
        console.log(`  Error ${url}: ${e.message.substring(0, 60)}`);
      }
    }
  }

  // Step 8: Navigate back to advance-table and try clicking on plot row via Playwright locator
  await page.goto(tableUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);

  console.log('\n  [3h] Trying Playwright locators to click plot row...');

  // Try different click targets in the row
  const clickTargets = [
    page.locator('[data-testid="content-wrapper-div-plot-id-0"]').first(),
    page.locator('tr').nth(1),
    page.locator('[role="row"]').nth(1),
    page.locator('mat-row').first(),
    page.locator('.mat-row').first(),
    page.locator('[class*="table-row"]').first(),
  ];

  for (let i = 0; i < clickTargets.length; i++) {
    const target = clickTargets[i];
    const count = await target.count();
    if (count > 0) {
      try {
        const text = await target.textContent();
        console.log(`  Target ${i}: found, text="${text?.trim().substring(0, 60)}"`);

        // Don't click if it's the same as what we tried before
        if (i === 0) continue; // skip - already tried plot-id cell

        await target.click();
        await page.waitForTimeout(2000);
        const newUrl = page.url();
        console.log(`  Target ${i} click URL: ${newUrl}`);

        if (newUrl !== tableUrl) {
          console.log(`  Navigation happened!`);
          await screenshot(page, `flow3_target_${i}_clicked`);
          break;
        }

        // Go back to try next
        await page.goto(tableUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(3000);
      } catch (e) {
        console.log(`  Target ${i} error: ${e.message.substring(0, 60)}`);
      }
    }
  }

  // Step 9: Get full advance table page source to understand structure
  console.log('\n  [3i] Getting table content for structure analysis...');
  await page.goto(tableUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);

  const tableFullStructure = await safeEval(page, () => {
    const main = document.querySelector('main, [role="main"], .main-content, app-root > *:last-child');
    return {
      mainHTML: main?.outerHTML.substring(0, 8000) || document.body.innerHTML.substring(0, 5000)
    };
  }, 'table-full-structure');
  console.log('  Full table structure (first 5000 chars):');
  console.log(tableFullStructure?.mainHTML?.substring(0, 5000));

  await screenshot(page, 'flow3_final');
  console.log('\n  [FLOW 3 COMPLETE]');
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  try {
    await login(page);

    await exploreFlow1_Map(page);
    await exploreFlow2_Delete(page);
    await exploreFlow3_Detail(page);

    console.log('\n\n════════════════════════════════════════════════════════════');
    console.log('EXPLORATION COMPLETE');
    console.log('════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n ERROR:', error.message);
    console.error(error.stack);
    await screenshot(page, 'fatal_error').catch(() => {});
  } finally {
    await browser.close();
    console.log('\nBrowser closed. Done.');
  }
}

main().catch(console.error);
