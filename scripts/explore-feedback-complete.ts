/**
 * Complete feedback flow exploration - fills required fields properly per section
 * Uses label-based input targeting since data-testid are not unique per field
 */
import { chromium } from 'playwright';
import type { Page } from 'playwright';

const BASE_URL = 'https://project.chronicle.rip';
const EMAIL = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';
const SCREENSHOT_DIR = '/Users/ahmadfaris/work/automation_web/screenshots';

/**
 * Find input by its mat-label text inside the closest mat-form-field
 */
async function fillInputByLabel(page: Page, labelText: string, value: string) {
  // Find the mat-form-field that contains a mat-label with the given text
  const container = page.locator(`mat-form-field:has(mat-label:has-text("${labelText}"))`).first();
  const input = container.locator('input, textarea');
  if (await input.isVisible({ timeout: 2000 })) {
    await input.click();
    await page.waitForTimeout(200);
    await input.fill(value);
    console.log(`    ✅ Filled "${labelText}" = "${value}"`);
    return true;
  }
  console.log(`    ⚠️ Input for "${labelText}" not visible`);
  return false;
}

/**
 * Get the N-th expansion panel (0-indexed)
 */
function getPanel(page: Page, index: number) {
  return page.locator('mat-expansion-panel').nth(index);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // ============ LOGIN ============
    console.log('=== LOGIN ===');
    await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    await page.locator('[data-testid="login-mat-form-field-input-mat-input-element"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="login-mat-form-field-input-mat-input-element"]').fill(EMAIL);
    await page.locator('[data-testid="login-mat-form-field-input-password"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="login-mat-form-field-input-password"]').fill(PASSWORD);
    await page.locator('[data-testid="login-login-screen-button-mat-focus-indicator"]').click();
    await page.waitForURL(/customer-organization/, { timeout: 45000 });
    await page.waitForTimeout(4000);
    console.log('✅ Logged in:', page.url());

    // ============ NAVIGATE TO FEEDBACK ============
    console.log('\n=== NAVIGATE: REQUESTS → FEEDBACK ===');
    await page.locator('[data-testid="cemetery-info-wrapper-button-btn-service"]').click();
    await page.waitForTimeout(1500);

    // Collect menu items
    console.log('\n--- REQUESTS Dropdown Menu Items ---');
    const menuItems = await page.locator('[role="menuitem"]').all();
    for (let i = 0; i < menuItems.length; i++) {
      const text = (await menuItems[i].textContent())?.trim() || '';
      const testId = await menuItems[i].getAttribute('data-testid') || '';
      console.log(`  [${i}] text="${text}" data-testid="${testId}"`);
    }

    await page.locator('[role="menuitem"]:has-text("Feedback")').click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ Feedback page URL:', page.url());

    // ============ ANALYZE PAGE STRUCTURE ============
    console.log('\n=== PAGE STRUCTURE ===');
    const panels = await page.locator('mat-expansion-panel').all();
    console.log(`Total expansion panels: ${panels.length}`);
    for (let i = 0; i < panels.length; i++) {
      const title = await panels[i].locator('mat-panel-title').textContent();
      const isExpanded = await panels[i].evaluate(el => el.classList.contains('mat-expanded'));
      console.log(`  Panel ${i}: "${title?.trim()}" expanded=${isExpanded}`);
    }

    // ============ SECTION 1: "Your insights are valuable to us!" ============
    console.log('\n\n=== SECTION 1: "Your insights are valuable to us!" ===');
    console.log('  (Info section only - no form fields)');
    const section1Body = getPanel(page, 0).locator('.mat-expansion-panel-body');
    const section1Text = await section1Body.locator('p').first().textContent();
    console.log(`  Description: "${section1Text?.trim()}"`);

    // Click continue
    const continueBtn1 = getPanel(page, 0).locator('button:has-text("continue")');
    console.log('  Clicking continue...');
    await continueBtn1.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fb-01-section1.png`, fullPage: true });

    // ============ SECTION 2: "Applicant" ============
    console.log('\n\n=== SECTION 2: "Applicant" ===');

    // Wait for panel 1 to be expanded
    const panel1 = getPanel(page, 1);
    await panel1.locator('.mat-expansion-panel-body').waitFor({ state: 'visible', timeout: 5000 });

    // Collect all form fields in this section
    const section2Body = panel1.locator('.mat-expansion-panel-body');
    console.log('\n  --- Section 2 Form Fields ---');

    // Get all mat-form-field elements in this section
    const formFields2 = await section2Body.locator('mat-form-field').all();
    console.log(`  Total mat-form-field elements: ${formFields2.length}`);
    for (let i = 0; i < formFields2.length; i++) {
      const label = await formFields2[i].locator('mat-label').textContent().catch(() => '');
      const hasInput = await formFields2[i].locator('input').count();
      const hasTextarea = await formFields2[i].locator('textarea').count();
      const hasSelect = await formFields2[i].locator('mat-select').count();
      const inputTestId = hasInput ? await formFields2[i].locator('input').getAttribute('data-testid').catch(() => '') : '';
      const inputId = hasInput ? await formFields2[i].locator('input').getAttribute('id').catch(() => '') : '';
      const required = hasInput ? await formFields2[i].locator('input').getAttribute('required').catch(() => null) !== null : false;

      const fieldType = hasSelect ? 'mat-select' : hasTextarea ? 'textarea' : 'input';

      console.log(`\n  📝 Field ${i}: label="${label?.trim()}" type=${fieldType}`);
      console.log(`     data-testid="${inputTestId}" id="${inputId}" required=${required}`);
    }

    // Checkboxes in section
    const checkboxes2 = await section2Body.locator('mat-checkbox').all();
    console.log(`\n  Checkboxes: ${checkboxes2.length}`);
    for (const cb of checkboxes2) {
      const text = (await cb.textContent())?.trim() || '';
      const testId = await cb.getAttribute('data-testid') || '';
      console.log(`    ☑️ "${text}" testid="${testId}"`);
    }

    // Continue button in section 2
    const continueBtn2 = section2Body.locator('button:has-text("continue")');
    const btn2TestId = await continueBtn2.getAttribute('data-testid').catch(() => '');
    console.log(`\n  Continue button: testid="${btn2TestId}"`);

    // FILL required fields
    console.log('\n  --- Filling required Applicant fields ---');
    await fillInputByLabel(page, 'First Name', 'Test');
    await fillInputByLabel(page, 'Last Name', 'Automation');
    await fillInputByLabel(page, 'Email', 'test@automation.com');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fb-02-section2-filled.png`, fullPage: true });

    // Click continue
    console.log('  Clicking continue for section 2...');
    await continueBtn2.click();
    await page.waitForTimeout(2000);

    // Check which panel is now expanded
    for (let i = 0; i < panels.length; i++) {
      const isExpanded = await page.locator('mat-expansion-panel').nth(i).evaluate(el => el.classList.contains('mat-expanded'));
      if (isExpanded) {
        const title = await page.locator('mat-expansion-panel').nth(i).locator('mat-panel-title').textContent();
        console.log(`  >> Now expanded: Panel ${i} "${title?.trim()}"`);
      }
    }

    // ============ SECTION 3: "Feedback Category" ============
    console.log('\n\n=== SECTION 3: "Feedback Category" ===');

    const panel2 = getPanel(page, 2);
    try {
      await panel2.locator('.mat-expansion-panel-body').waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      console.log('  ⚠️ Section 3 not expanded. Trying to click its header...');
      // Maybe the continue from section 2 didn't open section 3
      // Check if there's validation error
      const errors = await page.locator('.mat-error:visible').all();
      for (const err of errors) {
        console.log(`  ❌ Error: "${(await err.textContent())?.trim()}"`);
      }
    }

    const section3Body = panel2.locator('.mat-expansion-panel-body');
    const section3Visible = await section3Body.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  Section 3 body visible: ${section3Visible}`);

    if (section3Visible) {
      // Collect fields
      const formFields3 = await section3Body.locator('mat-form-field').all();
      console.log(`  Total mat-form-field elements: ${formFields3.length}`);
      for (let i = 0; i < formFields3.length; i++) {
        const label = await formFields3[i].locator('mat-label').textContent().catch(() => '');
        const hasInput = await formFields3[i].locator('input').count();
        const hasTextarea = await formFields3[i].locator('textarea').count();
        const hasSelect = await formFields3[i].locator('mat-select').count();
        const fieldType = hasSelect ? 'mat-select' : hasTextarea ? 'textarea' : 'input';
        console.log(`  📝 Field ${i}: label="${label?.trim()}" type=${fieldType}`);
      }

      // Radio buttons
      const radios3 = await section3Body.locator('mat-radio-button').all();
      console.log(`\n  Radio buttons: ${radios3.length}`);
      for (const rb of radios3) {
        const text = (await rb.textContent())?.trim() || '';
        const testId = await rb.getAttribute('data-testid') || '';
        const value = await rb.getAttribute('value') || '';
        console.log(`    🔘 "${text}" value="${value}" testid="${testId}"`);
      }

      // Mat-select in section
      const selects3 = await section3Body.locator('mat-select').all();
      console.log(`\n  mat-select dropdowns: ${selects3.length}`);
      for (let i = 0; i < selects3.length; i++) {
        const label = await selects3[i].evaluate(el => {
          const ff = el.closest('mat-form-field');
          return ff?.querySelector('mat-label')?.textContent?.trim() || '';
        });
        console.log(`    🔽 "${label}"`);

        // Open and collect options
        await selects3[i].click();
        await page.waitForTimeout(500);
        const options = await page.locator('mat-option:visible').all();
        console.log(`       Options (${options.length}):`);
        for (const opt of options) {
          const text = (await opt.textContent())?.trim() || '';
          const val = await opt.getAttribute('value') || '';
          const testId = await opt.getAttribute('data-testid') || '';
          console.log(`         - "${text}" value="${val}" testid="${testId}"`);
        }
        // Select first option
        if (options.length > 0) {
          await options[0].click();
          await page.waitForTimeout(500);
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }

      // Any checkboxes or other elements
      const checkboxes3 = await section3Body.locator('mat-checkbox').all();
      console.log(`\n  Checkboxes: ${checkboxes3.length}`);
      for (const cb of checkboxes3) {
        const text = (await cb.textContent())?.trim() || '';
        console.log(`    ☑️ "${text}"`);
      }

      // Check for any plain text/labels that indicate category options
      const allText3 = await section3Body.locator('p, span, div.detail-type-text, label').all();
      console.log(`\n  Text/Label elements:`);
      for (const el of allText3) {
        const text = (await el.textContent())?.trim() || '';
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        const classes = await el.getAttribute('class') || '';
        if (text && text.length < 100 && !classes.includes('mat-form-field')) {
          console.log(`    <${tag}> "${text}" class="${classes.substring(0, 60)}"`);
        }
      }

      const continueBtn3 = section3Body.locator('button:has-text("continue")');
      const btn3Visible = await continueBtn3.isVisible({ timeout: 2000 }).catch(() => false);
      const btn3TestId = btn3Visible ? await continueBtn3.getAttribute('data-testid').catch(() => '') : '';
      console.log(`\n  Continue button: visible=${btn3Visible} testid="${btn3TestId}"`);

      if (btn3Visible) {
        console.log('  Clicking continue for section 3...');
        await continueBtn3.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/fb-03-section3.png`, fullPage: true });

    // ============ SECTION 4: "Details" ============
    console.log('\n\n=== SECTION 4: "Details" ===');

    const panel3 = getPanel(page, 3);
    const section4Body = panel3.locator('.mat-expansion-panel-body');
    const section4Visible = await section4Body.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Section 4 body visible: ${section4Visible}`);

    if (section4Visible) {
      const formFields4 = await section4Body.locator('mat-form-field').all();
      console.log(`  Total mat-form-field elements: ${formFields4.length}`);
      for (let i = 0; i < formFields4.length; i++) {
        const label = await formFields4[i].locator('mat-label').textContent().catch(() => '');
        const hasInput = await formFields4[i].locator('input').count();
        const hasTextarea = await formFields4[i].locator('textarea').count();
        const hasSelect = await formFields4[i].locator('mat-select').count();
        const fieldType = hasSelect ? 'mat-select' : hasTextarea ? 'textarea' : 'input';
        const inputTestId = hasInput ? await formFields4[i].locator('input').getAttribute('data-testid').catch(() => '') : '';
        console.log(`  📝 Field ${i}: label="${label?.trim()}" type=${fieldType} testid="${inputTestId}"`);
      }

      // Fill details
      const details4 = await section4Body.locator('textarea').all();
      if (details4.length > 0) {
        for (const ta of details4) {
          const label = await ta.evaluate(e => {
            const ff = e.closest('mat-form-field');
            return ff?.querySelector('mat-label')?.textContent?.trim() || '';
          });
          console.log(`  📝 Textarea: label="${label}"`);
          await ta.click();
          await page.waitForTimeout(200);
          await ta.fill('Automated test feedback message');
        }
      }

      // Fill any required inputs
      const inputs4 = await section4Body.locator('mat-form-field').all();
      for (const ff of inputs4) {
        const label = (await ff.locator('mat-label').textContent().catch(() => ''))?.trim() || '';
        const input = ff.locator('input');
        if (await input.count() > 0 && await input.isVisible({ timeout: 500 }).catch(() => false)) {
          const classes = await input.getAttribute('class') || '';
          if (classes.includes('ng-invalid')) {
            console.log(`  Filling required field: "${label}"`);
            await input.click();
            await page.waitForTimeout(200);
            await input.fill('Test Value');
          }
        }
      }

      const continueBtn4 = section4Body.locator('button:has-text("continue")');
      if (await continueBtn4.isVisible({ timeout: 2000 }).catch(() => false)) {
        const btn4TestId = await continueBtn4.getAttribute('data-testid').catch(() => '');
        console.log(`\n  Continue button: testid="${btn4TestId}"`);
        console.log('  Clicking continue for section 4...');
        await continueBtn4.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/fb-04-section4.png`, fullPage: true });

    // ============ SECTION 5: "Thanks for your feedback" ============
    console.log('\n\n=== SECTION 5: "Thanks for your feedback" ===');

    const panel4 = getPanel(page, 4);
    const section5Body = panel4.locator('.mat-expansion-panel-body');
    const section5Visible = await section5Body.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Section 5 body visible: ${section5Visible}`);

    if (section5Visible) {
      const formFields5 = await section5Body.locator('mat-form-field').all();
      console.log(`  Total mat-form-field elements: ${formFields5.length}`);

      const allElems5 = await section5Body.locator('*').all();
      console.log(`  All elements in section body: ${allElems5.length}`);

      // Inner HTML snippet
      const bodyHtml = await section5Body.evaluate(el => el.innerHTML.substring(0, 1000));
      console.log(`\n  Section 5 HTML (first 1000 chars):\n${bodyHtml}`);
    }

    // ============ SUBMIT BUTTON STATE ============
    console.log('\n\n=== SUBMIT BUTTON ===');
    const submitBtn = page.locator('[data-testid="form-general-purpose-button-submit-request-btn"]');
    const submitVisible = await submitBtn.isVisible({ timeout: 3000 });
    const submitDisabled = submitVisible ? await submitBtn.isDisabled() : true;
    const submitText = submitVisible ? (await submitBtn.textContent())?.trim() : '';
    console.log(`  Text: "${submitText}"`);
    console.log(`  Visible: ${submitVisible}`);
    console.log(`  Disabled: ${submitDisabled}`);
    console.log(`  data-testid: "form-general-purpose-button-submit-request-btn"`);

    // Check panel states
    console.log('\n\n=== FINAL PANEL STATES ===');
    const allPanels = await page.locator('mat-expansion-panel').all();
    for (let i = 0; i < allPanels.length; i++) {
      const title = await allPanels[i].locator('mat-panel-title').textContent();
      const isExpanded = await allPanels[i].evaluate(el => el.classList.contains('mat-expanded'));
      const headerClass = await allPanels[i].locator('mat-expansion-panel-header').getAttribute('class') || '';
      const hasActive = headerClass.includes('active');
      const hasCompleted = headerClass.includes('completed');
      console.log(`  Panel ${i}: "${title?.trim()}" expanded=${isExpanded} active=${hasActive} completed=${hasCompleted}`);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/fb-05-final.png`, fullPage: true });

    console.log('\n=== DONE ===');

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/fb-error.png`, fullPage: true });
  } finally {
    await browser.close();
  }
}

run();
