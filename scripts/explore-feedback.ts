/**
 * Script to explore Feedback flow elements using Playwright
 * Flow: Login → Cemetery page → Click REQUESTS dropdown → Select Feedback → Collect form elements
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://project.chronicle.rip';
const EMAIL = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';
const SCREENSHOT_DIR = '/Users/ahmadfaris/work/automation_web/screenshots';

async function exploreFeedbackFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // ============ STEP 1: LOGIN ============
    console.log('\n=== STEP 1: LOGIN ===');
    await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    // Fill email
    const emailInput = page.locator('[data-testid="login-mat-form-field-input-mat-input-element"]');
    await emailInput.click();
    await page.waitForTimeout(300);
    await emailInput.fill(EMAIL);

    // Fill password
    const passInput = page.locator('[data-testid="login-mat-form-field-input-password"]');
    await passInput.click();
    await page.waitForTimeout(300);
    await passInput.fill(PASSWORD);

    // Click login
    await page.locator('[data-testid="login-login-screen-button-mat-focus-indicator"]').click();

    // Wait for dashboard
    await page.waitForURL(/customer-organization/, { timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Wait for full load

    console.log('✅ Logged in successfully. URL:', page.url());
    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-01-after-login.png`, fullPage: true });

    // ============ STEP 2: FIND REQUESTS BUTTON IN CONTENT AREA ============
    console.log('\n=== STEP 2: LOOKING FOR REQUESTS BUTTON IN CONTENT AREA ===');

    // Collect all buttons/clickable elements containing "request" text
    const allButtons = await page.locator('button, [role="button"], a, [class*="button"]').all();
    console.log(`\nTotal clickable elements found: ${allButtons.length}`);

    const requestElements: { text: string; tag: string; classes: string; testId: string; index: number }[] = [];

    for (let i = 0; i < allButtons.length; i++) {
      const el = allButtons[i];
      try {
        const text = (await el.textContent())?.trim() || '';
        if (text.toLowerCase().includes('request')) {
          const tag = await el.evaluate(e => e.tagName.toLowerCase());
          const classes = await el.getAttribute('class') || '';
          const testId = await el.getAttribute('data-testid') || '';
          requestElements.push({ text: text.substring(0, 80), tag, classes, testId, index: i });
          console.log(`\n🔍 REQUEST element #${requestElements.length}:`);
          console.log(`   Tag: <${tag}>`);
          console.log(`   Text: "${text.substring(0, 80)}"`);
          console.log(`   Classes: ${classes}`);
          console.log(`   data-testid: ${testId}`);

          // Get parent info
          const parentInfo = await el.evaluate(e => {
            const p = e.parentElement;
            return p ? { tag: p.tagName, class: p.className, testId: p.getAttribute('data-testid') || '' } : null;
          });
          if (parentInfo) {
            console.log(`   Parent: <${parentInfo.tag}> class="${parentInfo.class}" data-testid="${parentInfo.testId}"`);
          }
        }
      } catch { /* element may be detached */ }
    }

    // Also search for elements with data-testid containing "request"
    console.log('\n--- Searching data-testid containing "request" ---');
    const testIdElements = await page.locator('[data-testid*="request" i], [data-testid*="Request" i]').all();
    for (const el of testIdElements) {
      try {
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        const text = (await el.textContent())?.trim()?.substring(0, 80) || '';
        const testId = await el.getAttribute('data-testid') || '';
        const classes = await el.getAttribute('class') || '';
        console.log(`\n🏷️ data-testid element:`);
        console.log(`   Tag: <${tag}>`);
        console.log(`   data-testid: ${testId}`);
        console.log(`   Text: "${text}"`);
        console.log(`   Classes: ${classes}`);
      } catch { /* skip */ }
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-02-before-click-requests.png`, fullPage: true });

    // ============ STEP 3: CLICK THE REQUESTS DROPDOWN IN CONTENT AREA ============
    console.log('\n=== STEP 3: CLICKING REQUESTS DROPDOWN ===');

    // Try multiple selectors for the REQUESTS button in content area
    const requestsButtonSelectors = [
      'button:has-text("REQUESTS")',
      'button:has-text("Requests")',
      '[data-testid*="request"]',
      'button:has-text("REQUEST")',
      '.mat-expansion-panel-header:has-text("REQUEST")',
      'mat-expansion-panel-header:has-text("REQUEST")',
      'div:has-text("REQUESTS") >> button',
      'button >> text=REQUESTS',
    ];

    let requestsClicked = false;
    for (const sel of requestsButtonSelectors) {
      try {
        const locator = page.locator(sel).first();
        if (await locator.isVisible({ timeout: 2000 })) {
          const text = (await locator.textContent())?.trim() || '';
          const tag = await locator.evaluate(e => e.tagName.toLowerCase());
          const testId = await locator.getAttribute('data-testid') || '';
          console.log(`\n✅ Found REQUESTS button with selector: ${sel}`);
          console.log(`   Tag: <${tag}>, Text: "${text}", data-testid: "${testId}"`);

          await locator.click();
          await page.waitForTimeout(1500);
          requestsClicked = true;
          break;
        }
      } catch { /* try next */ }
    }

    if (!requestsClicked) {
      console.log('\n⚠️ Could not find REQUESTS button with predefined selectors. Trying broader search...');
      // Search for any element that contains "REQUESTS" text
      const allElements = await page.locator('*:has-text("REQUESTS")').all();
      for (let i = 0; i < Math.min(allElements.length, 20); i++) {
        try {
          const el = allElements[i];
          const tag = await el.evaluate(e => e.tagName.toLowerCase());
          const text = await el.evaluate(e => e.childNodes.length <= 3 ? (e.textContent?.trim() || '') : '');
          const classes = await el.getAttribute('class') || '';
          const testId = await el.getAttribute('data-testid') || '';
          if (text && text.length < 100) {
            console.log(`  Element ${i}: <${tag}> text="${text}" class="${classes}" data-testid="${testId}"`);
          }
        } catch { /* skip */ }
      }
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-03-after-click-requests.png`, fullPage: true });

    // ============ STEP 4: COLLECT DROPDOWN ITEMS ============
    console.log('\n=== STEP 4: COLLECTING DROPDOWN / MENU ITEMS ===');

    // Look for menu items, dropdown items, mat-menu items, etc.
    const menuSelectors = [
      '[role="menu"] [role="menuitem"]',
      '[role="listbox"] [role="option"]',
      'mat-menu-panel button',
      '.mat-menu-panel button',
      '.cdk-overlay-pane button',
      '.cdk-overlay-pane a',
      '.cdk-overlay-pane [role="menuitem"]',
      'mat-list-item',
      'mat-nav-list a',
      'a:has-text("feedback")',
      'a:has-text("Feedback")',
      'button:has-text("Feedback")',
      '[routerlink*="feedback"]',
      'a[href*="feedback"]',
    ];

    for (const sel of menuSelectors) {
      try {
        const items = await page.locator(sel).all();
        if (items.length > 0) {
          console.log(`\n📋 Found ${items.length} items with selector: ${sel}`);
          for (let i = 0; i < items.length; i++) {
            const text = (await items[i].textContent())?.trim() || '';
            const tag = await items[i].evaluate(e => e.tagName.toLowerCase());
            const testId = await items[i].getAttribute('data-testid') || '';
            const href = await items[i].getAttribute('href') || '';
            const classes = await items[i].getAttribute('class') || '';
            console.log(`   [${i}] <${tag}> text="${text.substring(0, 60)}" testid="${testId}" href="${href}" class="${classes.substring(0, 60)}"`);
          }
        }
      } catch { /* skip */ }
    }

    // Also look for anything that appeared after clicking (expanded panel content)
    console.log('\n--- Checking for expanded panel / accordion content ---');
    const expandedContent = await page.locator('.mat-expansion-panel-content, .mat-expanded, [class*="expanded"], [class*="panel-body"]').all();
    for (let i = 0; i < expandedContent.length; i++) {
      try {
        const html = await expandedContent[i].evaluate(e => e.innerHTML.substring(0, 500));
        console.log(`\nExpanded content [${i}]:\n${html}`);
      } catch { /* skip */ }
    }

    // Look specifically for Feedback link/button
    console.log('\n--- Looking for Feedback link/button anywhere on page ---');
    const feedbackElements = await page.locator('*:has-text("Feedback"), *:has-text("feedback")').all();
    for (let i = 0; i < Math.min(feedbackElements.length, 15); i++) {
      try {
        const el = feedbackElements[i];
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        const ownText = await el.evaluate(e => {
          // Get only direct text, not children
          let text = '';
          for (const node of e.childNodes) {
            if (node.nodeType === 3) text += node.textContent;
          }
          return text.trim();
        });
        if (ownText.toLowerCase().includes('feedback')) {
          const classes = await el.getAttribute('class') || '';
          const testId = await el.getAttribute('data-testid') || '';
          const href = await el.getAttribute('href') || '';
          console.log(`  <${tag}> ownText="${ownText}" class="${classes.substring(0, 80)}" testid="${testId}" href="${href}"`);
        }
      } catch { /* skip */ }
    }

    // ============ STEP 5: CLICK FEEDBACK ============
    console.log('\n=== STEP 5: CLICKING FEEDBACK MENU ITEM ===');

    const feedbackSelectors = [
      'a:has-text("Feedback")',
      'button:has-text("Feedback")',
      '[role="menuitem"]:has-text("Feedback")',
      'a[href*="feedback"]',
      '[routerlink*="feedback"]',
      'mat-list-item:has-text("Feedback")',
      '[data-testid*="feedback"]',
    ];

    let feedbackClicked = false;
    for (const sel of feedbackSelectors) {
      try {
        const loc = page.locator(sel).first();
        if (await loc.isVisible({ timeout: 2000 })) {
          const text = (await loc.textContent())?.trim() || '';
          const tag = await loc.evaluate(e => e.tagName.toLowerCase());
          const testId = await loc.getAttribute('data-testid') || '';
          const href = await loc.getAttribute('href') || '';
          console.log(`\n✅ Found Feedback with: ${sel}`);
          console.log(`   Tag: <${tag}>, Text: "${text}", testid: "${testId}", href: "${href}"`);

          await loc.click();
          await page.waitForTimeout(3000);
          await page.waitForLoadState('domcontentloaded');
          feedbackClicked = true;
          console.log(`   Current URL after click: ${page.url()}`);
          break;
        }
      } catch { /* try next */ }
    }

    if (!feedbackClicked) {
      console.log('⚠️ Could not find Feedback menu item to click');
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-04-feedback-page.png`, fullPage: true });

    // ============ STEP 6: COLLECT ALL FORM ELEMENTS ON FEEDBACK PAGE ============
    console.log('\n=== STEP 6: COLLECTING FORM ELEMENTS ON FEEDBACK PAGE ===');
    console.log(`Current URL: ${page.url()}`);

    // Get page title/heading
    const headings = await page.locator('h1, h2, h3, h4, .page-title, [class*="title"], [class*="heading"]').all();
    console.log('\n--- Page Headings ---');
    for (const h of headings) {
      try {
        const text = (await h.textContent())?.trim() || '';
        if (text && text.length < 100) {
          const tag = await h.evaluate(e => e.tagName.toLowerCase());
          const classes = await h.getAttribute('class') || '';
          console.log(`  <${tag}> "${text}" class="${classes}"`);
        }
      } catch { /* skip */ }
    }

    // Collect all input fields
    console.log('\n--- Input Fields ---');
    const inputs = await page.locator('input, textarea, select, mat-select').all();
    for (let i = 0; i < inputs.length; i++) {
      try {
        const el = inputs[i];
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        const type = await el.getAttribute('type') || '';
        const name = await el.getAttribute('name') || '';
        const formcontrol = await el.getAttribute('formcontrolname') || '';
        const placeholder = await el.getAttribute('placeholder') || '';
        const testId = await el.getAttribute('data-testid') || '';
        const classes = await el.getAttribute('class') || '';
        const id = await el.getAttribute('id') || '';
        const ariaLabel = await el.getAttribute('aria-label') || '';
        const isVisible = await el.isVisible();

        // Get label
        let label = '';
        try {
          if (id) {
            const labelEl = page.locator(`label[for="${id}"]`);
            if (await labelEl.isVisible({ timeout: 500 })) {
              label = (await labelEl.textContent())?.trim() || '';
            }
          }
          if (!label) {
            // Check parent mat-form-field for mat-label
            const matLabel = await el.evaluate(e => {
              const formField = e.closest('mat-form-field');
              if (formField) {
                const lbl = formField.querySelector('mat-label, label');
                return lbl?.textContent?.trim() || '';
              }
              return '';
            });
            label = matLabel;
          }
        } catch { /* skip label */ }

        if (isVisible) {
          console.log(`\n  📝 Input #${i}:`);
          console.log(`     Tag: <${tag}>`);
          console.log(`     type="${type}" name="${name}" formcontrolname="${formcontrol}"`);
          console.log(`     placeholder="${placeholder}" id="${id}"`);
          console.log(`     data-testid="${testId}"`);
          console.log(`     aria-label="${ariaLabel}"`);
          console.log(`     label="${label}"`);
          console.log(`     classes="${classes.substring(0, 100)}"`);
        }
      } catch { /* skip */ }
    }

    // Collect all mat-select (Angular Material dropdowns)
    console.log('\n--- Angular Material Dropdowns (mat-select) ---');
    const matSelects = await page.locator('mat-select').all();
    for (let i = 0; i < matSelects.length; i++) {
      try {
        const el = matSelects[i];
        const formcontrol = await el.getAttribute('formcontrolname') || '';
        const testId = await el.getAttribute('data-testid') || '';
        const classes = await el.getAttribute('class') || '';
        const ariaLabel = await el.getAttribute('aria-label') || '';
        const placeholder = await el.getAttribute('placeholder') || '';
        const isVisible = await el.isVisible();
        const text = (await el.textContent())?.trim() || '';

        if (isVisible) {
          console.log(`\n  🔽 mat-select #${i}:`);
          console.log(`     formcontrolname="${formcontrol}"`);
          console.log(`     data-testid="${testId}"`);
          console.log(`     aria-label="${ariaLabel}"`);
          console.log(`     placeholder="${placeholder}"`);
          console.log(`     text="${text}"`);
          console.log(`     classes="${classes.substring(0, 100)}"`);
        }
      } catch { /* skip */ }
    }

    // Collect all buttons
    console.log('\n--- Buttons ---');
    const buttons = await page.locator('button, [role="button"]').all();
    for (let i = 0; i < buttons.length; i++) {
      try {
        const el = buttons[i];
        const text = (await el.textContent())?.trim() || '';
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        const type = await el.getAttribute('type') || '';
        const testId = await el.getAttribute('data-testid') || '';
        const classes = await el.getAttribute('class') || '';
        const disabled = await el.isDisabled();
        const isVisible = await el.isVisible();

        if (isVisible && text.length < 100) {
          console.log(`\n  🔘 Button #${i}:`);
          console.log(`     Tag: <${tag}> type="${type}"`);
          console.log(`     Text: "${text}"`);
          console.log(`     data-testid="${testId}"`);
          console.log(`     disabled=${disabled}`);
          console.log(`     classes="${classes.substring(0, 100)}"`);
        }
      } catch { /* skip */ }
    }

    // Check for star ratings
    console.log('\n--- Rating Elements ---');
    const ratingElements = await page.locator('[class*="rating"], [class*="star"], [data-testid*="rating"]').all();
    for (const el of ratingElements) {
      try {
        const classes = await el.getAttribute('class') || '';
        const testId = await el.getAttribute('data-testid') || '';
        const html = await el.evaluate(e => e.outerHTML.substring(0, 300));
        console.log(`  ⭐ Rating element: class="${classes}" testid="${testId}"`);
        console.log(`     HTML: ${html}`);
      } catch { /* skip */ }
    }

    // Full page snapshot of all data-testid elements
    console.log('\n--- ALL data-testid elements on feedback page ---');
    const allTestIds = await page.locator('[data-testid]').all();
    for (const el of allTestIds) {
      try {
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        const testId = await el.getAttribute('data-testid') || '';
        const text = (await el.textContent())?.trim()?.substring(0, 60) || '';
        const isVisible = await el.isVisible();
        if (isVisible) {
          console.log(`  <${tag}> data-testid="${testId}" text="${text}"`);
        }
      } catch { /* skip */ }
    }

    console.log('\n=== EXPLORATION COMPLETE ===');
    console.log('Screenshots saved to:', SCREENSHOT_DIR);

  } catch (error) {
    console.error('Error during exploration:', error);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-error.png`, fullPage: true });
  } finally {
    await browser.close();
  }
}

exploreFeedbackFlow();
