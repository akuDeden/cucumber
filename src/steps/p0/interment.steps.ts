import { When, Then } from '@cucumber/cucumber';
import { IntermentPage } from '../../pages/p0/IntermentPage.js';
import { replacePlaceholdersInObject, replacePlaceholders } from '../../utils/TestDataHelper.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { getCustomerOrgBaseUrl } from '../../data/test-data.js';

// Initialize page objects - Reset for each scenario
let intermentPage: IntermentPage;

// FLOW 1: Add interment from plot detail page
// Used in: "Add Interment from plot detail page" scenario
When('I click Add Interment button from plot detail', async function () {
  const page = this.page;
  intermentPage = new IntermentPage(page);
  await intermentPage.clickAddIntermentButton();
});

// Backward compatibility alias (keep existing step working)
When('I click Add Interment button', async function () {
  const page = this.page;
  intermentPage = new IntermentPage(page);
  await intermentPage.clickAddIntermentButton();
});

// FLOW 1 (Table): Steps for Add Interment via Advance Table → INTERMENTS tab
// Reuses shared steps from roiTable.steps.ts:
//   - "I click the sidebar table menu"
//   - "I filter plots by status {string} in Plots tab"
//   - "I get the first plot name from the filtered table"

When('I click the Interments tab in advance table', async function () {
  const page = this.page;
  intermentPage = new IntermentPage(page);
  // INTERMENTS tab testid: content-wrapper-a-1 (same pattern as ROIs = content-wrapper-a-2)
  const tab = page.locator('a[data-testid="content-wrapper-a-1"]')
    .or(page.locator('a.mat-tab-link:has-text("INTERMENTS")'));
  await tab.waitFor({ state: 'visible', timeout: 10000 });
  await tab.click();
  await page.waitForURL(/tab=interment/i, { timeout: 10000 }).catch(() => {});
  await NetworkHelper.waitForApiRequestsComplete(page, 10000);
});

When('I click Add Interments button from advance table', async function () {
  const page = this.page;
  if (!intermentPage) intermentPage = new IntermentPage(page);
  await intermentPage.clickAddIntermentFromTable();
});

Then('I should see the Add Interment form', async function () {
  const page = this.page;
  await page.getByLabel('First name').first().waitFor({ state: 'visible', timeout: 15000 });
});

When('I search and select the saved vacant plot for Interment', async function () {
  const page = this.page;
  if (!this.vacantPlotName) {
    throw new Error('No vacant plot name saved. Run "I get the first plot name from the filtered table" first.');
  }
  if (!intermentPage) intermentPage = new IntermentPage(page);
  await intermentPage.selectPlotInIntermentForm(this.vacantPlotName);
});

When('I save the Interment from table', async function () {
  const page = this.page;
  if (!intermentPage) intermentPage = new IntermentPage(page);
  await intermentPage.saveIntermentFromTable();
});

Then('I should be redirected to advance table interments list', async function () {
  const page = this.page;
  await page.waitForURL(/advance-table/, { timeout: 15000 });
  const url = page.url();
  if (!url.includes('advance-table')) {
    throw new Error(`Expected to be on advance-table page, but got: ${url}`);
  }
  // Wait for interment table to load
  await page.locator('[role="table"] [role="row"]').nth(1).waitFor({ state: 'visible', timeout: 15000 });
});

Then('I should see the saved plot name in the interments list', async function () {
  const page = this.page;
  if (!this.vacantPlotName) throw new Error('No vacantPlotName saved');
  if (!intermentPage) intermentPage = new IntermentPage(page);
  await intermentPage.verifyPlotInIntermentList(this.vacantPlotName);
});

Then('I should see deceased first name {string} in the interments list', async function (firstName: string) {
  const page = this.page;
  const actualName = replacePlaceholders(firstName);
  if (!intermentPage) intermentPage = new IntermentPage(page);
  await intermentPage.verifyDeceasedFirstNameInList(actualName);
});

When('I fill interment form with following details', async function (dataTable: any) {
  const intermentData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(intermentData);
  await intermentPage.fillIntermentForm(actualData as any);
});

When('I save the Interment', async function () {
  await intermentPage.saveInterment();
});

Then('I should see deceased {string} in the Interment tab', async function (deceasedName: string) {
  const actualName = replacePlaceholders(deceasedName);
  await intermentPage.verifyDeceasedInTab(actualName);
});

Then('I should see interment type {string}', async function (intermentType: string) {
  const actualType = replacePlaceholders(intermentType);
  await intermentPage.verifyIntermentType(actualType);
});

When('I add interment applicant', async function () {
  await intermentPage.addIntermentApplicant();
});

When('I add next of kin', async function () {
  await intermentPage.addNextOfKin();
});

When('I click on Interments tab', async function () {
  const page = this.page;
  // Always create a new instance to ensure we have the current page
  intermentPage = new IntermentPage(page);
  await intermentPage.clickIntermentTab();
});

When('I click Edit Interment button', async function () {
  await intermentPage.clickEditIntermentButton();
});

// FLOW 4: Delete Interment
When('I click More menu on interment form', async function () {
  const page = this.page;
  if (!intermentPage) intermentPage = new IntermentPage(page);
  await intermentPage.clickMoreMenuOnIntermentForm();
});

When('I click Delete interment option', async function () {
  const page = this.page;
  if (!intermentPage) intermentPage = new IntermentPage(page);
  await intermentPage.clickDeleteIntermentOption();
});

When('I confirm delete interment', async function () {
  const page = this.page;
  if (!intermentPage) intermentPage = new IntermentPage(page);
  // Pass the current plot URL so we can navigate back after delete if needed
  this.plotUrlBeforeDelete = page.url().replace(/\/manage\/edit\/interment\/.*/, '').replace(/\/plots\/.*/, '');
  await intermentPage.confirmDeleteInterment();
});

Then('I should be navigated back to the plot detail page', async function () {
  const page = this.page;
  // After delete, app might redirect to home/root. Navigate back to the plot detail.
  const currentUrl = page.url();
  if (!currentUrl.includes('/plots/') && !currentUrl.includes('/customer-organization/')) {
    // Re-navigate to the plot detail using the plot URL saved before delete
    const baseUrl = currentUrl.match(/https?:\/\/[^/]+/)?.[0] || '';
    const plotName = this.selectedPlotName || this.currentPlotName || '';
    if (plotName) {
      const encodedPlot = encodeURIComponent(plotName);
      await page.goto(`${baseUrl}/customer-organization/astana_tegal_gundul_aus/plots/${encodedPlot}`, { waitUntil: 'domcontentloaded' });
      await NetworkHelper.waitForApiRequestsComplete(page, 5000);
    }
  }
});

// Note: "the plot status should be {string}" already exists in roi.steps.ts — reuse it

When('I update interment form with following details', async function (dataTable: any) {
  console.log('========== UPDATE INTERMENT STEP START ==========');
  const intermentData = dataTable.rowsHash();
  console.log('Raw data from feature file:', JSON.stringify(intermentData, null, 2));
  const actualData = replacePlaceholdersInObject(intermentData);
  console.log('Data after placeholder replacement:', JSON.stringify(actualData, null, 2));
  console.log('========== UPDATE INTERMENT STEP END ==========');
  await intermentPage.updateIntermentForm(actualData as any);
});

// ===== Relations: Interment applicant, Next of kin, Funeral minister, Funeral director =====

When('I add interment applicant by searching {string}', { timeout: 45000 }, async function (lastName: string) {
  const actualLastName = replacePlaceholders(lastName);
  await intermentPage.searchAndAddRelation('button:has-text("Interment applicant")', actualLastName, 'PERSON');
});

When('I add next of kin by searching {string}', { timeout: 45000 }, async function (lastName: string) {
  const actualLastName = replacePlaceholders(lastName);
  await intermentPage.searchAndAddRelation('button:has-text("Next of kin")', actualLastName, 'PERSON');
});

When('I add funeral minister by searching {string}', { timeout: 45000 }, async function (businessName: string) {
  const actualName = replacePlaceholders(businessName);
  await intermentPage.searchAndAddRelation('button:has-text("Funeral minister")', actualName, 'BUSINESS');
});

When('I add funeral director by searching {string}', { timeout: 45000 }, async function (businessName: string) {
  const actualName = replacePlaceholders(businessName);
  await intermentPage.searchAndAddRelation('button:has-text("Funeral director")', actualName, 'BUSINESS');
});

Then('I should be on the plot detail page after save', { timeout: 20000 }, async function () {
  await intermentPage.verifyOnPlotDetailPage();
});

// ===== Delete interment =====

When('I click more options on edit interment page', { timeout: 10000 }, async function () {
  await intermentPage.clickMoreMenuOnEditInterment();
});

When('I click delete interment from menu', { timeout: 10000 }, async function () {
  await intermentPage.clickDeleteIntermentFromMenu();
});

When('I confirm the interment deletion', { timeout: 70000 }, async function () {
  await intermentPage.confirmIntermentDeletion();
});

// ===== Move interment =====

When('I click move interment from menu', { timeout: 10000 }, async function () {
  await intermentPage.clickMoveIntermentFromMenu();
});

When('I select a vacant plot to move interment to {string}', { timeout: 30000 }, async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  await intermentPage.searchAndSelectMoveTargetPlot(actualPlotId);
});

When('I confirm the interment move', { timeout: 60000 }, async function () {
  await intermentPage.confirmIntermentMove();
});

Then('the interment should be moved successfully', { timeout: 20000 }, async function () {
  await intermentPage.verifyOnPlotDetailPage();
  this.logger?.info(`Interment moved successfully. URL: ${this.page.url()}`);
});

// ===== Add Sale from Edit Interment =====

When('I navigate to the advance table and open the second interment', { timeout: 90000 }, async function () {
  const page = this.page;
  intermentPage = new IntermentPage(page);

  const baseUrl = getCustomerOrgBaseUrl();
  await page.goto(`${baseUrl}/customer-organization/advance-table`, { waitUntil: 'domcontentloaded' });
  await NetworkHelper.waitForApiRequestsComplete(page, 8000);

  // Click INTERMENTS tab (index 1 in advance table)
  const intermentsTab = page.locator('[data-testid="content-wrapper-a-1"]');
  await intermentsTab.waitFor({ state: 'visible', timeout: 10000 });
  await intermentsTab.click();
  await NetworkHelper.waitForApiRequestsComplete(page, 8000);

  // Wait for rows with actual content.
  // IMPORTANT: mat-cell:nth-child(1) is the checkbox (always empty textContent).
  // mat-cell:nth-child(4) is First Name — the first cell that has visible text.
  await page.waitForSelector('mat-row', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => {
      const cell = document.querySelector('mat-row mat-cell:nth-child(4)');
      return cell && (cell.textContent || '').trim().length > 0;
    },
    { timeout: 15000 }
  );

  // Click First Name cell (nth(3)) — confirmed to navigate to interment edit URL on aus.chronicle.rip
  const rows = page.locator('mat-row');
  const rowCount = await rows.count();
  const targetRow = rows.nth(Math.min(1, rowCount - 1)); // second row, or first if only one
  const nameCell = targetRow.locator('mat-cell').nth(3);
  this.logger?.info('Clicking First Name cell in interment row to open edit form');
  await page.mouse.move(0, 0);
  await nameCell.click({ timeout: 8000, force: true });

  // Wait for navigation to Edit Interment page
  await page.waitForURL('**/manage/edit/interment/**', { timeout: 30000 });
  await NetworkHelper.waitForApiRequestsComplete(page, 5000);
  this.logger?.info(`Opened Edit Interment page. URL: ${page.url()}`);
});
