/**
 * Script to explore each section of the Feedback form wizard
 * Clicks "continue" through each step and collects all form elements
 */
import { chromium } from 'playwright';
import type { Page } from 'playwright';

const BASE_URL = 'https://project.chronicle.rip';
const EMAIL = 'faris+astanaorg@chronicle.rip';
const PASSWORD = '12345';
const SCREENSHOT_DIR = '/Users/ahmadfaris/work/automation_web/screenshots';

async function collectVisibleFormElements(page: Page, sectionName: string) {
  console.log(`\n  --- ${sectionName}: Input Fields ---`);
  const inputs = await page.locator('input:visible, textarea:visible').all();
  for (let i = 0; i < inputs.length; i++) {
    try {
      const el = inputs[i];
      const tag = await el.evaluate(e => e.tagName.toLowerCase());
      const type = await el.getAttribute('type') || '';
      const name = await el.getAttribute('name') || '';
      const formcontrol = await el.getAttribute('formcontrolname') || '';
      const placeholder = await el.getAttribute('placeholder') || '';
      const testId = await el.getAttribute('data-testid') || '';
      const id = await el.getAttribute('id') || '';
      const ariaLabel = await el.getAttribute('aria-label') || '';
      const classes = await el.getAttribute('class') || '';
      const required = await el.getAttribute('required');

      // Get mat-label from parent
      let label = '';
      try {
        label = await el.evaluate(e => {
          const formField = e.closest('mat-form-field');
          if (formField) {
            const lbl = formField.querySelector('mat-label, label');
            return lbl?.textContent?.trim() || '';
          }
          // Check for preceding label
          const prev = e.previousElementSibling;
          if (prev && prev.tagName === 'LABEL') return prev.textContent?.trim() || '';
          return '';
        });
      } catch { /* skip */ }

      console.log(`\n  📝 [${sectionName}] Input #${i}:`);
      console.log(`     Tag: <${tag}> type="${type}"`);
      console.log(`     formcontrolname="${formcontrol}" name="${name}" id="${id}"`);
      console.log(`     placeholder="${placeholder}"`);
      console.log(`     data-testid="${testId}"`);
      console.log(`     aria-label="${ariaLabel}"`);
      console.log(`     label="${label}"`);
      console.log(`     required=${required !== null}`);
      console.log(`     classes="${classes.substring(0, 120)}"`);
    } catch { /* skip */ }
  }

  // mat-select dropdowns
  console.log(`\n  --- ${sectionName}: Dropdowns (mat-select) ---`);
  const selects = await page.locator('mat-select:visible').all();
  for (let i = 0; i < selects.length; i++) {
    try {
      const el = selects[i];
      const formcontrol = await el.getAttribute('formcontrolname') || '';
      const testId = await el.getAttribute('data-testid') || '';
      const placeholder = await el.getAttribute('placeholder') || '';
      const ariaLabel = await el.getAttribute('aria-label') || '';
      const text = (await el.textContent())?.trim() || '';
      const classes = await el.getAttribute('class') || '';

      let label = '';
      try {
        label = await el.evaluate(e => {
          const formField = e.closest('mat-form-field');
          if (formField) {
            const lbl = formField.querySelector('mat-label, label');
            return lbl?.textContent?.trim() || '';
          }
          return '';
        });
      } catch { /* skip */ }

      console.log(`\n  🔽 [${sectionName}] mat-select #${i}:`);
      console.log(`     formcontrolname="${formcontrol}"`);
      console.log(`     data-testid="${testId}"`);
      console.log(`     placeholder="${placeholder}" aria-label="${ariaLabel}"`);
      console.log(`     label="${label}"`);
      console.log(`     current text="${text}"`);
      console.log(`     classes="${classes.substring(0, 120)}"`);
    } catch { /* skip */ }
  }

  // Radio buttons
  console.log(`\n  --- ${sectionName}: Radio Buttons ---`);
  const radios = await page.locator('mat-radio-button:visible, input[type="radio"]:visible').all();
  for (let i = 0; i < radios.length; i++) {
    try {
      const el = radios[i];
      const tag = await el.evaluate(e => e.tagName.toLowerCase());
      const text = (await el.textContent())?.trim() || '';
      const value = await el.getAttribute('value') || '';
      const testId = await el.getAttribute('data-testid') || '';
      const classes = await el.getAttribute('class') || '';
      console.log(`  🔘 [${sectionName}] Radio #${i}: <${tag}> text="${text}" value="${value}" testid="${testId}" class="${classes.substring(0, 80)}"`);
    } catch { /* skip */ }
  }

  // Checkboxes
  console.log(`\n  --- ${sectionName}: Checkboxes ---`);
  const checkboxes = await page.locator('mat-checkbox:visible, input[type="checkbox"]:visible').all();
  for (let i = 0; i < checkboxes.length; i++) {
    try {
      const el = checkboxes[i];
      const text = (await el.textContent())?.trim() || '';
      const testId = await el.getAttribute('data-testid') || '';
      console.log(`  ☑️ [${sectionName}] Checkbox #${i}: text="${text}" testid="${testId}"`);
    } catch { /* skip */ }
  }

  // Visible buttons in expanded section
  console.log(`\n  --- ${sectionName}: Visible Buttons ---`);
  const buttons = await page.locator('button:visible').all();
  for (const btn of buttons) {
    try {
      const text = (await btn.textContent())?.trim() || '';
      const testId = await btn.getAttribute('data-testid') || '';
      const disabled = await btn.isDisabled();
      if (text.length < 80 && (text.toLowerCase().includes('continue') || text.toLowerCase().includes('submit') || text.toLowerCase().includes('back') || text.toLowerCase().includes('cancel') || text.toLowerCase().includes('save'))) {
        console.log(`  🔘 [${sectionName}] Button: text="${text}" testid="${testId}" disabled=${disabled}`);
      }
    } catch { /* skip */ }
  }

  // All data-testid elements in expanded section
  console.log(`\n  --- ${sectionName}: Expanded Panel data-testid ---`);
  const expandedPanels = await page.locator('.mat-expanded .mat-expansion-panel-body [data-testid]').all();
  for (const el of expandedPanels) {
    try {
      const tag = await el.evaluate(e => e.tagName.toLowerCase());
      const testId = await el.getAttribute('data-testid') || '';
      const text = (await el.textContent())?.trim()?.substring(0, 80) || '';
      const isVisible = await el.isVisible();
      if (isVisible) {
        console.log(`  <${tag}> data-testid="${testId}" text="${text}"`);
      }
    } catch { /* skip */ }
  }
}

async function exploreFeedbackSections() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    // LOGIN
    console.log('=== LOGGING IN ===');
    await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');
    const emailInput = page.locator('[data-testid="login-mat-form-field-input-mat-input-element"]');
    await emailInput.click();
    await page.waitForTimeout(300);
    await emailInput.fill(EMAIL);
    const passInput = page.locator('[data-testid="login-mat-form-field-input-password"]');
    await passInput.click();
    await page.waitForTimeout(300);
    await passInput.fill(PASSWORD);
    await page.locator('[data-testid="login-login-screen-button-mat-focus-indicator"]').click();
    await page.waitForURL(/customer-organization/, { timeout: 45000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    console.log('✅ Logged in:', page.url());

    // CLICK REQUESTS DROPDOWN
    console.log('\n=== CLICKING REQUESTS DROPDOWN ===');
    const requestsBtn = page.locator('[data-testid="cemetery-info-wrapper-button-btn-service"]');
    await requestsBtn.click();
    await page.waitForTimeout(1500);

    // CLICK FEEDBACK
    console.log('=== CLICKING FEEDBACK ===');
    await page.locator('[role="menuitem"]:has-text("Feedback")').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ On feedback page:', page.url());

    // ============ SECTION 1: "Your insights are valuable to us!" ============
    console.log('\n\n========================================');
    console.log('SECTION 1: "Your insights are valuable to us!"');
    console.log('========================================');
    await collectVisibleFormElements(page, 'Section1-Insights');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-section1.png`, fullPage: true });

    // Click continue
    const continueBtn = page.locator('[data-testid="render-custom-form-button-section-continue-btn"]');
    if (await continueBtn.isVisible({ timeout: 3000 })) {
      console.log('\n>>> Clicking CONTINUE button...');
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }

    // ============ SECTION 2: "Applicant" ============
    console.log('\n\n========================================');
    console.log('SECTION 2: "Applicant"');
    console.log('========================================');
    await collectVisibleFormElements(page, 'Section2-Applicant');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-section2.png`, fullPage: true });

    // Try filling applicant fields if visible
    const applicantInputs = await page.locator('.mat-expanded input:visible, .mat-expanded textarea:visible').all();
    console.log(`\n  Total visible inputs in expanded section: ${applicantInputs.length}`);
    for (const inp of applicantInputs) {
      try {
        const formcontrol = await inp.getAttribute('formcontrolname') || '';
        const placeholder = await inp.getAttribute('placeholder') || '';
        const testId = await inp.getAttribute('data-testid') || '';
        const label = await inp.evaluate(e => {
          const ff = e.closest('mat-form-field');
          return ff?.querySelector('mat-label')?.textContent?.trim() || '';
        });
        console.log(`  🔸 Expanded input: formcontrol="${formcontrol}" placeholder="${placeholder}" testid="${testId}" label="${label}"`);
      } catch { /* skip */ }
    }

    // Fill required fields and click continue
    // First try to find and fill fields
    const section2Continue = page.locator('[data-testid="render-custom-form-button-section-continue-btn"]:visible');
    if (await section2Continue.isVisible({ timeout: 2000 })) {
      // Fill some test data to be able to continue
      const visibleInputs = await page.locator('.mat-expanded input:visible').all();
      for (const inp of visibleInputs) {
        try {
          const formcontrol = await inp.getAttribute('formcontrolname') || '';
          const type = await inp.getAttribute('type') || '';
          if (type !== 'hidden' && formcontrol) {
            await inp.click();
            await page.waitForTimeout(200);
            if (formcontrol.toLowerCase().includes('email')) {
              await inp.fill('test@example.com');
            } else if (formcontrol.toLowerCase().includes('phone')) {
              await inp.fill('+1234567890');
            } else {
              await inp.fill('Test Value');
            }
            await page.waitForTimeout(200);
          }
        } catch { /* skip */ }
      }

      console.log('\n>>> Clicking CONTINUE button for section 2...');
      await section2Continue.click();
      await page.waitForTimeout(2000);
    }

    // ============ SECTION 3: "Feedback Category" ============
    console.log('\n\n========================================');
    console.log('SECTION 3: "Feedback Category"');
    console.log('========================================');
    await collectVisibleFormElements(page, 'Section3-FeedbackCategory');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-section3.png`, fullPage: true });

    // Try to select category
    const categorySelect = page.locator('.mat-expanded mat-select:visible').first();
    if (await categorySelect.isVisible({ timeout: 2000 })) {
      console.log('\n>>> Opening category dropdown...');
      await categorySelect.click();
      await page.waitForTimeout(1000);

      // Collect options
      const options = await page.locator('mat-option:visible, [role="option"]:visible').all();
      console.log(`  Found ${options.length} options:`);
      for (const opt of options) {
        try {
          const text = (await opt.textContent())?.trim() || '';
          const value = await opt.getAttribute('value') || '';
          const testId = await opt.getAttribute('data-testid') || '';
          console.log(`    - "${text}" value="${value}" testid="${testId}"`);
        } catch { /* skip */ }
      }

      // Select first option if available
      if (options.length > 0) {
        await options[0].click();
        await page.waitForTimeout(500);
      }
    }

    // Check for radio buttons in category section
    const radioButtons = await page.locator('.mat-expanded mat-radio-button:visible').all();
    if (radioButtons.length > 0) {
      console.log(`\n  Found ${radioButtons.length} radio buttons in category section:`);
      for (const rb of radioButtons) {
        try {
          const text = (await rb.textContent())?.trim() || '';
          const testId = await rb.getAttribute('data-testid') || '';
          const value = await rb.getAttribute('value') || '';
          console.log(`    🔘 "${text}" value="${value}" testid="${testId}"`);
        } catch { /* skip */ }
      }
      // Click first radio to continue
      if (radioButtons.length > 0) {
        await radioButtons[0].click();
        await page.waitForTimeout(500);
      }
    }

    const section3Continue = page.locator('[data-testid="render-custom-form-button-section-continue-btn"]:visible');
    if (await section3Continue.isVisible({ timeout: 2000 })) {
      console.log('\n>>> Clicking CONTINUE button for section 3...');
      await section3Continue.click();
      await page.waitForTimeout(2000);
    }

    // ============ SECTION 4: "Details" ============
    console.log('\n\n========================================');
    console.log('SECTION 4: "Details"');
    console.log('========================================');
    await collectVisibleFormElements(page, 'Section4-Details');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-section4.png`, fullPage: true });

    // Fill details fields
    const detailInputs = await page.locator('.mat-expanded input:visible, .mat-expanded textarea:visible').all();
    for (const inp of detailInputs) {
      try {
        const tag = await inp.evaluate(e => e.tagName.toLowerCase());
        const formcontrol = await inp.getAttribute('formcontrolname') || '';
        const type = await inp.getAttribute('type') || '';
        if (type !== 'hidden') {
          await inp.click();
          await page.waitForTimeout(200);
          if (tag === 'textarea') {
            await inp.fill('This is a test feedback message for automation.');
          } else {
            await inp.fill('Test detail value');
          }
          await page.waitForTimeout(200);
        }
      } catch { /* skip */ }
    }

    const section4Continue = page.locator('[data-testid="render-custom-form-button-section-continue-btn"]:visible');
    if (await section4Continue.isVisible({ timeout: 2000 })) {
      console.log('\n>>> Clicking CONTINUE button for section 4...');
      await section4Continue.click();
      await page.waitForTimeout(2000);
    }

    // ============ SECTION 5: "Thanks for your feedback" ============
    console.log('\n\n========================================');
    console.log('SECTION 5: "Thanks for your feedback"');
    console.log('========================================');
    await collectVisibleFormElements(page, 'Section5-Thanks');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-section5.png`, fullPage: true });

    // Check Submit button
    const submitBtn = page.locator('[data-testid="form-general-purpose-button-submit-request-btn"]');
    const submitVisible = await submitBtn.isVisible({ timeout: 3000 });
    const submitDisabled = submitVisible ? await submitBtn.isDisabled() : true;
    console.log(`\n  Submit button: visible=${submitVisible} disabled=${submitDisabled}`);

    // Check ALL visible data-testid on page
    console.log('\n\n========================================');
    console.log('ALL VISIBLE data-testid ON FINAL PAGE STATE');
    console.log('========================================');
    const allTestIds = await page.locator('[data-testid]:visible').all();
    for (const el of allTestIds) {
      try {
        const tag = await el.evaluate(e => e.tagName.toLowerCase());
        const testId = await el.getAttribute('data-testid') || '';
        const text = (await el.textContent())?.trim()?.substring(0, 60) || '';
        console.log(`  <${tag}> data-testid="${testId}" text="${text}"`);
      } catch { /* skip */ }
    }

    console.log('\n=== EXPLORATION COMPLETE ===');

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/feedback-fields-error.png`, fullPage: true });
  } finally {
    await browser.close();
  }
}

exploreFeedbackSections();
