import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlotPage } from '../../pages/p0/PlotPage.js';
import { ROIPage } from '../../pages/p0/ROIPage.js';
import { replacePlaceholdersInObject, replacePlaceholders } from '../../utils/TestDataHelper.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';

// Initialize page objects
let plotPage: PlotPage;
let roiPage: ROIPage;

function ensurePageObjects(page: any) {
  if (!roiPage || roiPage.page !== page) {
    roiPage = new ROIPage(page);
  }
  if (!plotPage || plotPage.page !== page) {
    plotPage = new PlotPage(page);
  }
}

When('I navigate to all plots page', async function () {
  const page = this.page;
  plotPage = new PlotPage(page);
  roiPage = new ROIPage(page);
  await plotPage.clickSeeAllPlots();
});

When('I open the filter dialog', async function () {
  await plotPage.openFilter();
});

When('I select vacant filter', async function () {
  await plotPage.selectVacantFilter();
});

When('I select reserved filter', async function () {
  await plotPage.selectReservedFilter();
});

When('I select occupied filter', async function () {
  await plotPage.selectOccupiedFilter();
});

When('I apply the filter plot', async function () {
  await plotPage.applyFilter();
});

When('I expand section {string}', async function (section: string) {
  await plotPage.expandSection(section);
});

When('I expand the first section', async function () {
  const expandedSection = await plotPage.expandFirstSection();
  this.expandedSection = expandedSection; // Store for reference if needed
  this.logger?.info(`Expanded section: ${expandedSection.toUpperCase()}`);
});

When('I select plot {string}', async function (plotName: string) {
  const actualPlotName = replacePlaceholders(plotName);
  await plotPage.selectPlot(actualPlotName);
});

Then('the plot status should be {string}', async function (expectedStatus: string) {
  ensurePageObjects(this.page);
  const isCorrect = await plotPage.verifyStatusChanged(expectedStatus);
  expect(isCorrect).toBeTruthy();
});

When('I click Add ROI button', async function () {
  ensurePageObjects(this.page);
  await roiPage.clickAddRoi();
});

When('I click ROI tab', async function () {
  ensurePageObjects(this.page);
  await roiPage.clickRoiTab();
});

When('I click Edit ROI button', async function () {
  ensurePageObjects(this.page);
  await roiPage.clickEditRoi();
});

When('I fill ROI form with following details', async function (dataTable: any) {
  ensurePageObjects(this.page);
  const roiData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(roiData);
  await roiPage.fillRoiForm(actualData);
});

When('I select the first vacant plot', async function () {
  const page = plotPage.page;

  // Retry up to 3 times in case of stale filter data
  const maxAttempts = 3;
  // Specific regex matches plot IDs like "A E 5 Vacant". The filter badge chip has text
  // "Status Vacant" which does NOT match (no digit in the middle), and the treeitem ancestor
  // has a very long combined text (hundreds of chars). Shortest-text strategy picks the
  // individual plot listitem (~11 chars) rather than the treeitem ancestor.
  const plotItemRegex = /\w+\s+\w+\s+\d+\s+Vacant$/;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const plotName = await plotPage.selectFirstVacantPlot();
    this.selectedPlotName = plotName;

    // Find all elements matching the regex, pick the shortest one — it will be the
    // individual plot row, not the treeitem ancestor whose text concatenates all plots.
    const allEls = await page.getByText(plotItemRegex).all();
    if (allEls.length === 0) {
      throw new Error('No vacant plot elements found on page after filter');
    }
    let clickTarget = allEls[0];
    let shortestLen = Infinity;
    for (const el of allEls) {
      const text = ((await el.textContent()) ?? '').trim();
      if (text.endsWith('Vacant') && text.length < shortestLen) {
        shortestLen = text.length;
        clickTarget = el;
      }
    }

    await clickTarget.evaluate(el => (el as HTMLElement).click());
    await page.waitForURL('**/plots/**', { timeout: 20000 });
    await page.locator('[role="tablist"]').waitFor({ state: 'visible' });

    // Verify the plot detail page actually shows Vacant — list data can be stale in production
    // mat-chip excluded: activity log chips ("All","Activity","System") appear before the status badge in DOM order
    const statusChip = page.locator('[data-testid*="plot-status"]').first();
    const statusText = (await statusChip.textContent().catch(() => '')) ?? '';
    if (statusText.toLowerCase().includes('vacant')) {
      this.logger?.info(`Vacant plot confirmed on detail page: ${plotName}`);
      return;
    }

    this.logger?.warn(`Attempt ${attempt}: plot "${plotName}" shows "${statusText.trim()}" — stale data. Going back to retry.`);
    await page.goBack();
    await page.locator('[role="tablist"], button[data-testid^="shared-all-plots-button-toggle-"]').first().waitFor({ state: 'visible' });
  }

  throw new Error(`Could not find a truly Vacant plot after ${maxAttempts} attempts — test data may be exhausted.`);
});

When('I select the first reserved plot', async function () {
  const plotName = await plotPage.selectFirstReservedPlot();
  this.selectedPlotName = plotName; // Store for later reference
});

When('I select the first occupied plot', async function () {
  const plotName = await plotPage.selectFirstOccupiedPlot();
  this.selectedPlotName = plotName; // Store for later reference
});

When('I add ROI holder person with following details', async function (dataTable: any) {
  const holderData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(holderData);
  await roiPage.addRoiHolderPerson(actualData as any);
});

When('I add ROI applicant person with following details', async function (dataTable: any) {
  const applicantData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(applicantData);
  await roiPage.addRoiApplicantPerson(actualData as any);
});

When('I search and select ROI holder {string}', async function (personName: string) {
  await roiPage.searchAndSelectRoiHolder(personName);
});

When('I save the ROI', async function () {
  ensurePageObjects(this.page);
  const page = this.page;

  // Capture add/roi URL before saving — needed to construct plot detail URL if the app
  // redirects back to the edit plot page (which has no tablist) instead of plot detail.
  // Pattern: /customer-organization/{orgSlug}/{plotName}/manage/add/roi
  const addRoiUrl = page.url();
  const urlMatch = addRoiUrl.match(/\/customer-organization\/([^/]+)\/([^/?#]+)\/manage\/add\/roi/);

  await roiPage.saveRoi();

  // When Add ROI is triggered from the edit plot page, the app redirects back to edit plot page
  // (backTo param points to /manage/edit/plot). Edit plot page has no [role="tablist"], so we
  // must navigate to the plot detail page for subsequent status/ROI tab assertions to work.
  const currentUrl = page.url();
  if (!currentUrl.includes('/plots/') && urlMatch) {
    const [, orgSlug, encodedPlotName] = urlMatch;
    const baseOrigin = new URL(page.url()).origin;
    const detailUrl = `${baseOrigin}/customer-organization/${orgSlug}/plots/${encodedPlotName}`;
    this.logger?.info(`Redirected to edit plot page — navigating to detail: ${detailUrl}`);
    await page.goto(detailUrl, { waitUntil: 'domcontentloaded' });
  }

  // After save, we're on the plot detail page
  // Wait for tab list to be visible
  await page.locator('[role="tablist"]').waitFor({ state: 'visible' });

  // Click ROI tab explicitly (same as search scenario)
  const roiTab = page.getByRole('tab', { name: 'ROI' });
  await roiTab.waitFor({ state: 'visible' });
  await roiTab.click();

  // Verify ROI tab is actually selected after click (with retry)
  await NetworkHelper.waitForAnimation(page);
  const isSelected = await roiTab.getAttribute('aria-selected');

  if (isSelected !== 'true') {
    // Tab click didn't work, try again
    console.log('ROI tab not selected, clicking again...');
    await roiTab.click();
    await NetworkHelper.waitForAnimation(page);
  }

  // Wait for ROI data to load completely
  await NetworkHelper.waitForApiRequestsComplete(page);
});

Then('I should see ROI holder {string} in the ROI tab', async function (holderName: string) {
  const actualName = replacePlaceholders(holderName);
  const page = this.page;
  
  // Wait for ROI content to load after tab click
  await NetworkHelper.waitForApiRequestsComplete(page);
  
  // Verify ROI tab is selected, re-click if needed (Angular SPA may reset tab)
  const roiTab = page.getByRole('tab', { name: 'ROI' });
  const isSelected = await roiTab.getAttribute('aria-selected');
  
  if (isSelected !== 'true') {
    console.log('ROI tab not selected, re-clicking...');
    await roiTab.click();
    await expect(roiTab).toHaveAttribute('aria-selected', 'true');
    await NetworkHelper.waitForStabilization(page, { minWait: 500, maxWait: 3000 });
  }
  
  // Get page content and verify both name and role exist
  const pageContent = await page.content();
  
  const hasName = pageContent.includes(actualName);
  const hasRole = pageContent.toUpperCase().includes('ROI HOLDER');
  
  if (!hasName) {
    // Debug: show what's on page
    const bodyText = await page.locator('body').textContent();
    console.log('Page content preview:', bodyText?.substring(0, 500));
    throw new Error(`❌ ROI holder "${actualName}" not found on page`);
  }
  
  if (!hasRole) {
    throw new Error(`❌ Label "ROI HOLDER" not found on page`);
  }
  
  console.log(`✓ ROI holder verified: "${actualName}" with label "ROI HOLDER"`);
});

Then('I should see ROI applicant {string} in the ROI tab', async function (applicantName: string) {
  const actualName = replacePlaceholders(applicantName);
  const isVisible = await roiPage.verifyRoiPerson(actualName, 'applicant');
  if (!isVisible) {
    throw new Error(`❌ Verification failed: ROI applicant "${actualName}" not found or label "ROI APPLICANT" missing. Check logs above for details.`);
  }
});

Then('I should see both ROI holder {string} and applicant {string}', async function (holderName: string, applicantName: string) {
  const actualHolder = replacePlaceholders(holderName);
  const actualApplicant = replacePlaceholders(applicantName);
  const isVisible = await roiPage.verifyRoiHolderAndApplicant(actualHolder, actualApplicant);
  if (!isVisible) {
    throw new Error(`❌ Verification failed: Either holder "${actualHolder}" or applicant "${actualApplicant}" not found with correct labels. Check logs above for details.`);
  }
});

Then('I should see fee {string} in ROI form', async function (expectedFee: string) {
  const isValid = await roiPage.verifyFeeInForm(expectedFee);
  if (!isValid) {
    throw new Error(`❌ Verification failed: Fee "${expectedFee}" not found in ROI form. Check logs above for details.`);
  }
});

Then('I should see certificate number {string} in ROI form', async function (expectedCertificate: string) {
  const isValid = await roiPage.verifyCertificateInForm(expectedCertificate);
  if (!isValid) {
    throw new Error(`❌ Verification failed: Certificate number "${expectedCertificate}" not found in ROI form. Check logs above for details.`);
  }
});

// Activity Notes steps
When('I add activity note {string}', async function (noteText: string) {
  await roiPage.addActivityNote(noteText);
});

Then('I should see activity note {string}', async function (expectedNote: string) {
  const isVisible = await roiPage.verifyActivityNote(expectedNote);
  if (!isVisible) {
    throw new Error(`❌ Verification failed: Activity note "${expectedNote}" not found. Check logs above for details.`);
  }
});

When('I edit activity note {string} to {string}', async function (oldText: string, newText: string) {
  await roiPage.editActivityNote(oldText, newText);
});

// Find reserved plot by certificate number
When('I find reserved plot with certificate number {string}', async function (certNumber: string) {
  const actualCertNumber = replacePlaceholders(certNumber);
  const plotName = await plotPage.findReservedPlotByCertificateNumber(actualCertNumber);
  this.selectedPlotName = plotName;
});

// Remove ROI holder by name
When('I remove ROI holder {string}', async function (holderName: string) {
  ensurePageObjects(this.page);
  const actualName = replacePlaceholders(holderName);
  await roiPage.removeRoiHolder(actualName);
});

// Verify ROI holder has been removed
Then('I should not see ROI holder {string} in the ROI tab', async function (holderName: string) {
  ensurePageObjects(this.page);
  const actualName = replacePlaceholders(holderName);
  const isRemoved = await roiPage.verifyRoiHolderRemoved(actualName);
  if (!isRemoved) {
    throw new Error(`❌ ROI holder "${actualName}" is still present in ROI tab after removal`);
  }
});

// Remove ROI applicant by name
When('I remove ROI applicant {string}', async function (applicantName: string) {
  ensurePageObjects(this.page);
  const actualName = replacePlaceholders(applicantName);
  await roiPage.removeRoiApplicant(actualName);
});

// Verify ROI applicant has been removed
Then('I should not see ROI applicant {string} in the ROI tab', async function (applicantName: string) {
  ensurePageObjects(this.page);
  const actualName = replacePlaceholders(applicantName);
  const isRemoved = await roiPage.verifyRoiApplicantRemoved(actualName);
  if (!isRemoved) {
    throw new Error(`❌ ROI applicant "${actualName}" is still present in ROI tab after removal`);
  }
});

// ============================================
// REMOVE & REPLACE ROI HOLDER STEPS
// ============================================

When('I replace ROI holder {string} with existing person {string} {string}', async function (
  currentHolder: string,
  firstName: string,
  lastName: string
) {
  ensurePageObjects(this.page);
  await roiPage.replaceRoiHolderWithExistingPerson(
    replacePlaceholders(currentHolder),
    replacePlaceholders(firstName),
    replacePlaceholders(lastName)
  );
});

When('I replace ROI holder with new person {string} {string}', async function (firstName: string, lastName: string) {
  ensurePageObjects(this.page);
  await roiPage.replaceRoiHolderWithNewPerson(
    replacePlaceholders(firstName),
    replacePlaceholders(lastName)
  );
});

When('I save the ROI from table edit view', async function () {
  ensurePageObjects(this.page);
  await roiPage.saveRoiFromTableEditView();
});

When('I switch activity filter to {string}', async function (filter: string) {
  ensurePageObjects(this.page);
  await roiPage.switchActivityFilter(filter as 'Notes' | 'Changes' | 'All');
});

Then('I should see activity log entry containing {string}', async function (expectedText: string) {
  ensurePageObjects(this.page);
  const found = await roiPage.verifyActivityContainsText(replacePlaceholders(expectedText));
  if (!found) {
    throw new Error(`❌ Activity log does not contain entry: "${expectedText}"`);
  }
});

Then('I should see ROI holder {string} in the edit form', async function (holderName: string) {
  ensurePageObjects(this.page);
  const actualName = replacePlaceholders(holderName);
  const found = await roiPage.verifyRoiHolderInEditForm(actualName);
  if (!found) {
    throw new Error(`❌ ROI holder "${actualName}" not found in edit form`);
  }
});

Then('I should not see ROI holder {string} in the edit form', async function (holderName: string) {
  ensurePageObjects(this.page);
  const actualName = replacePlaceholders(holderName);
  const found = await roiPage.verifyRoiHolderInEditForm(actualName);
  if (found) {
    throw new Error(`❌ ROI holder "${actualName}" is still visible in edit form`);
  }
});

// ===== Add Sale from Edit ROI =====

When('I navigate to the advance table and open the second ROI', { timeout: 90000 }, async function () {
  const page = this.page;
  roiPage = new ROIPage(page);

  const baseUrl = page.url().split('/customer-organization')[0];
  await page.goto(`${baseUrl}/customer-organization/advance-table?tab=rois`, { waitUntil: 'domcontentloaded' });
  await NetworkHelper.waitForApiRequestsComplete(page, 10000);

  // Click the second ROI row
  const rows = page.locator('mat-row');
  await rows.first().waitFor({ state: 'visible', timeout: 30000 });
  const secondRow = rows.nth(1);
  this.logger?.info('Clicking second ROI row in advance table');

  await secondRow.click();
  // Wait for URL to change to edit ROI page, retry once if needed
  try {
    await page.waitForURL(/\/edit\/roi\//, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch {
    await secondRow.click();
    await page.waitForURL(/\/edit\/roi\//, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }
  await page.waitForSelector('h1', { state: 'visible', timeout: 20000 });
  this.logger?.info(`Opened Edit ROI page. URL: ${page.url()}`);
});
