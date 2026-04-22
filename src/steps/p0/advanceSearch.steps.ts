import { When, Then, Given } from '@cucumber/cucumber';
import { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { AdvanceSearchSelectors } from '../../selectors/p0/advance-search/index.js';
import { AdvanceSearchPage } from '../../pages/p0/AdvanceSearchPage.js';
import { Logger } from '../../utils/Logger.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { BASE_CONFIG } from '../../data/test-data.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';

// Initialize logger and page object
const logger = new Logger('AdvanceSearchPlotSteps');

// Helper function to get or initialize advanceSearchPage
function getAdvanceSearchPage(page: Page): AdvanceSearchPage {
  return new AdvanceSearchPage(page);
}

// Background step
Given('I am on the Chronicle home page', async function () {
  const page: Page = this.page;
  const baseUrl = BASE_CONFIG.baseUrl;
  logger.info(`Navigating to Chronicle home page: ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await NetworkHelper.waitForStabilization(page, { minWait: 500, maxWait: 5000 });
  logger.success('Chronicle home page loaded');
});

// Advanced Search Steps (Without Login)
When('I click Advanced search button without login', async function () {
  const page: Page = this.page;
  logger.info('Clicking Advanced search button');
  const advancedButton = page.locator(AdvanceSearchSelectors.advancedSearchButton);
  await advancedButton.waitFor({ state: 'visible' });
  await advancedButton.click();
  await page.locator('.advanced-search-form').waitFor({ state: 'visible' });

  // Wait for Angular to fully render the form including accessibility tree.
  // Cemetery data is preloaded (no network call needed), but Angular CDK needs
  // time to attach aria-labelledby references to the accessibility tree.
  // We wait until the first mat-select inside the form has a valid accessible name.
  const maxWaitMs = 15000;
  const startTime = Date.now();
  let cemeteryComboboxReady = false;

  while (Date.now() - startTime < maxWaitMs) {
    const accessible = await page.evaluate(() => {
      const form = document.querySelector('.advanced-search-form');
      if (!form) return null;
      const select = form.querySelector('mat-select');
      if (!select) return null;
      const labelledBy = select.getAttribute('aria-labelledby');
      if (!labelledBy) return null;
      const labelId = labelledBy.split(' ')[0];
      const labelEl = labelId ? document.getElementById(labelId) : null;
      return labelEl?.textContent?.trim() || null;
    });

    if (accessible && accessible.includes('Cemeteries')) {
      cemeteryComboboxReady = true;
      logger.info(`Cemetery combobox accessible name ready: "${accessible}" (${Date.now() - startTime}ms)`);
      break;
    }
    await page.waitForTimeout(300);
  }

  if (!cemeteryComboboxReady) {
    logger.info('Cemetery combobox accessible name not ready after timeout, proceeding anyway...');
  }

  logger.success('Advanced search dialog opened');
});

When('I select cemetery {string} in advanced search', async function (cemeteryName: string) {
  const page: Page = this.page;
  const cemetery = replacePlaceholders(cemeteryName);
  logger.info(`Selecting cemetery: ${cemetery}`);

  // Use CSS selector via the form context instead of getByRole to avoid
  // Angular dynamic ID timing issues with aria-labelledby accessibility tree.
  // The cemetery mat-select is always the first mat-select inside .advanced-search-form.
  const advancedSearchForm = page.locator('.advanced-search-form');
  const cemeterySelectLocator = advancedSearchForm.locator('mat-select').first();
  const overlayOption = page.locator('.cdk-overlay-pane mat-option');

  // Wait until cemetery combobox is visible and interactable
  await cemeterySelectLocator.waitFor({ state: 'visible', timeout: 15000 });

  // Retry clicking combobox if dropdown opens empty.
  // IMPORTANT: Do NOT press Escape here as it will close the entire dialog, not just the dropdown.
  // Instead, click somewhere neutral inside the form to dismiss any partial open state.
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await cemeterySelectLocator.click();
    try {
      // Wait for at least one option to render in the dropdown
      await overlayOption.first().waitFor({ state: 'visible', timeout: 5000 });
      logger.info(`Cemetery dropdown options loaded on attempt ${attempt}`);
      break;
    } catch {
      logger.info(`Cemetery list not rendered yet (attempt ${attempt}/${maxRetries}), dismissing and retrying...`);
      // Click the form header/title area to dismiss dropdown without closing the dialog
      // Using body click outside overlay to close dropdown
      await page.mouse.click(10, 10);
      // Verify dialog is still open before retrying
      const formStillOpen = await advancedSearchForm.isVisible().catch(() => false);
      if (!formStillOpen) {
        logger.info('Advanced search form was closed unexpectedly, reopening...');
        const advancedButton = page.locator(AdvanceSearchSelectors.advancedSearchButton);
        await advancedButton.click();
        await advancedSearchForm.waitFor({ state: 'visible', timeout: 10000 });
        await cemeterySelectLocator.waitFor({ state: 'visible', timeout: 10000 });
      }
      await page.waitForTimeout(1000);
    }
  }

  // Select the cemetery option using exact match to avoid strict mode violations
  const cemeteryOption = page.getByRole('option', { name: cemetery, exact: true });
  await cemeteryOption.waitFor({ state: 'visible' });
  await cemeteryOption.click();

  // Close the dropdown by pressing Escape (required before clicking Plot tab)
  await page.keyboard.press('Escape');
  await cemeteryOption.waitFor({ state: 'hidden' }).catch(() => {});

  logger.success(`Cemetery ${cemetery} selected`);
});

When('I select Plot tab in advanced search', async function () {
  const page: Page = this.page;
  logger.info('Clicking Plot tab');

  // Wait a bit for the dialog to settle after cemetery selection
  const plotTabButton = page.getByRole('button', { name: 'Plot', exact: true });
  await plotTabButton.waitFor({ state: 'visible' });

  // Click Plot tab using getByRole with aria-label
  await plotTabButton.click();

  logger.success('Plot tab selected');
});

When('I select section {string} in advanced search without login', async function (section: string) {
  const page: Page = this.page;
  // Replace placeholder with actual test data
  const sec = replacePlaceholders(section);
  logger.info(`Selecting section: ${sec}`);

  // Click section combobox using getByRole (the combobox has aria-label="Number")
  await page.getByRole('combobox', { name: 'Number' }).click();

  // Select the section option
  const sectionOption = page.getByRole('option', { name: sec, exact: true });
  await sectionOption.waitFor({ state: 'visible' });
  await sectionOption.click();

  // Wait for dropdown to close
  await sectionOption.waitFor({ state: 'hidden' }).catch(() => {});

  logger.success(`Section ${sec} selected`);
});

When('I select row {string} in advanced search without login', async function (row: string) {
  const page: Page = this.page;
  const r = replacePlaceholders(row);
  logger.info(`Selecting row: ${r}`);

  // Click row combobox using getByRole
  await page.getByRole('combobox', { name: 'Row' }).click();

  // Select the row option (use exact match for single letters)
  const rowOption = page.getByRole('option', { name: r, exact: true });
  await rowOption.waitFor({ state: 'visible' });
  await rowOption.click();

  // Wait for dropdown to close
  await rowOption.waitFor({ state: 'hidden' }).catch(() => {});

  logger.success(`Row ${r} selected`);
});

When('I enter plot number {string} in advanced search without login', async function (number: string) {
  const page: Page = this.page;
  const num = replacePlaceholders(number);
  logger.info(`Entering plot number: ${num}`);

  // Click on the number textbox
  await page.locator(AdvanceSearchSelectors.numberTextbox).click();

  // Fill the number
  await page.locator(AdvanceSearchSelectors.numberTextbox).fill(num);

  logger.success(`Plot number ${num} entered`);
});

When('I select status {string} in advanced search without login', async function (status: string) {
  const page: Page = this.page;
  logger.info(`Selecting status: ${status}`);

  // Click status combobox
  await page.getByRole('combobox', { name: 'Status' }).click();

  // Select the status option
  const statusOption = page.getByRole('option', { name: status, exact: true });
  await statusOption.waitFor({ state: 'visible' });
  await statusOption.click();

  // Close the dropdown by pressing Escape
  await page.keyboard.press('Escape');
  await statusOption.waitFor({ state: 'hidden' }).catch(() => {});

  logger.success(`Status ${status} selected`);
});

When('I click Search button in advanced search without login', async function () {
  const page: Page = this.page;
  logger.info('Clicking Search button in advanced search');

  await page.locator(AdvanceSearchSelectors.searchButton).click();

  // Wait for navigation to search results page
  await page.waitForURL('**/search/advance');
  await NetworkHelper.waitForStabilization(page, { minWait: 500, maxWait: 3000 });

  logger.success('Search completed, navigated to results page');
});

Then('I should be navigated to advance search results page', async function () {
  const page: Page = this.page;
  logger.info('Verifying navigation to advance search results page');

  // Check URL
  await page.waitForURL('**/search/advance');

  // Check for search results heading
  const heading = page.locator(AdvanceSearchSelectors.searchResultsHeading);
  await heading.waitFor({ state: 'visible' });

  logger.success('Verified on advance search results page');
});

Then('I should see search results information', async function () {
  const page: Page = this.page;
  logger.info('Verifying search results information');

  // Check for search results heading (e.g., "5 plots found...")
  const heading = page.locator(AdvanceSearchSelectors.searchResultsHeading);
  await expect(heading).toBeVisible();

  // Parse the count from the heading text and assert it is > 0
  const headingText = await heading.textContent();
  const match = headingText?.match(/^(\d+)\s+plots?\s+found/i);
  if (!match) {
    throw new Error(`Unexpected heading format: "${headingText}"`);
  }
  const count = parseInt(match[1], 10);
  if (count === 0) {
    throw new Error(`Expected search results to be non-empty, but got: "${headingText}"`);
  }

  // Check for subheading (e.g., "in 1 cemeteries")
  const subheading = page.locator(AdvanceSearchSelectors.searchResultsSubheading);
  await expect(subheading).toBeVisible();

  logger.success(`Search results information verified: ${headingText}`);
});

Then('I should see plot number {string} in sidebar results', async function (plotNumber: string) {
  const page: Page = this.page;
  const actualPlotNumber = replacePlaceholders(plotNumber);
  logger.info(`Verifying plot number ${actualPlotNumber} in sidebar results`);

  // Get the plot detail text from sidebar
  const plotDetailText = page.locator(AdvanceSearchSelectors.plotDetailText);
  await expect(plotDetailText).toBeVisible();

  // Get the text content
  const text = await plotDetailText.textContent();

  // Verify the plot number is in the text (format: "A B 2" contains "2")
  expect(text).toContain(actualPlotNumber);

  logger.success(`Plot number ${actualPlotNumber} verified in sidebar: ${text}`);
});

Then('I should see cemetery name {string} in sidebar results', async function (cemeteryName: string) {
  const page: Page = this.page;
  const actualCemeteryName = replacePlaceholders(cemeteryName);
  logger.info(`Verifying cemetery name ${actualCemeteryName} in sidebar results`);

  // Get the cemetery name text from sidebar
  const cemeteryNameText = page.locator(AdvanceSearchSelectors.cemeteryNameText);
  await expect(cemeteryNameText).toBeVisible();

  // Get the text content
  const text = await cemeteryNameText.textContent();

  // Verify the cemetery name matches exactly
  expect(text).toBe(actualCemeteryName);

  logger.success(`Cemetery name ${actualCemeteryName} verified in sidebar`);
});

Then('I should see status icon {string} in first result', async function (expectedStatus: string) {
  const page: Page = this.page;
  logger.info(`Verifying status icon ${expectedStatus} in first result`);

  // Get the icon element from first result (use .first() to avoid strict mode violation)
  const icon = page.locator(AdvanceSearchSelectors.firstResultIcon).first();
  await expect(icon).toBeVisible();

  // Get the class attribute
  const className = await icon.getAttribute('class');

  // Convert expected status to lowercase for class matching
  // "For Sale" -> "for sale", "Vacant" -> "vacant", etc.
  const expectedClass = expectedStatus.toLowerCase();

  // Verify the icon has the expected class
  expect(className).toContain(expectedClass);

  logger.success(`Status icon ${expectedStatus} verified in first result (class: ${expectedClass})`);
});

When('I click close advance search button', async function () {
  const page: Page = this.page;
  logger.info('Clicking close advance search button');

  await page.locator(AdvanceSearchSelectors.closeAdvanceSearchButton).click();

  // Wait for navigation back to home page
  const baseUrl = BASE_CONFIG.baseUrl;
  await page.waitForURL(baseUrl);
  await NetworkHelper.waitForStabilization(page, { minWait: 500, maxWait: 3000 });

  logger.success('Advance search closed, navigated to home page');
});

Then('I should be on the home page', async function () {
  const page: Page = this.page;
  logger.info('Verifying on home page');

  // Check URL - handle trailing slash difference
  const baseUrl = BASE_CONFIG.baseUrl;
  const currentUrl = page.url().replace(/\/$/, ''); // Remove trailing slash
  const expectedUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  expect(currentUrl).toBe(expectedUrl);

  logger.success('Verified on home page');
});

Then('I should not see advance search results sidebar', async function () {
  const page: Page = this.page;
  logger.info('Verifying advance search results sidebar is not visible');

  // Check that search results heading is NOT visible
  const searchResultsHeading = page.locator(AdvanceSearchSelectors.searchResultsHeading);
  await expect(searchResultsHeading).not.toBeVisible();

  // Check that search results subheading is NOT visible
  const searchResultsSubheading = page.locator(AdvanceSearchSelectors.searchResultsSubheading);
  await expect(searchResultsSubheading).not.toBeVisible();

  // Check that plot detail is NOT visible
  const plotDetailText = page.locator(AdvanceSearchSelectors.plotDetailText);
  await expect(plotDetailText).not.toBeVisible();

  logger.success('Advance search results sidebar is not visible');
});

// ==========================================
// LOGGED-IN USER ADVANCED SEARCH STEPS
// ==========================================

When('I click Advanced search button', async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickAdvancedSearchButton();
});

When('I select section {string} in advanced search', async function (section: string) {
  const actualSection = replacePlaceholders(section);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.selectSectionInAdvancedSearch(actualSection);
});

When('I select row {string} in advanced search', async function (row: string) {
  const actualRow = replacePlaceholders(row);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.selectRowInAdvancedSearch(actualRow);
});

When('I enter plot number {string} in advanced search', async function (number: string) {
  const actualNumber = replacePlaceholders(number);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterPlotNumberInAdvancedSearch(actualNumber);
});

When('I click Search button in advanced search', async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickSearchButtonInAdvancedSearch();
});

Then('I should see search results containing {string}', async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifySearchResultsContain(actualPlotId);
});

When('I click on plot {string} from search results', async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickPlotFromSearchResults(actualPlotId);
});

Then('I should see plot sidebar with plot ID {string}', async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifyPlotSidebarWithPlotId(actualPlotId);
});

Then('I should see plot details sidebar', async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifyPlotDetailsSidebar();
});

// ==========================================
// ADVANCED SEARCH WITH MULTIPLE FILTERS STEPS
// ==========================================

When('I enter plot ID {string} in advanced search', async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterPlotIdInAdvancedSearch(actualPlotId);
});

When('I select plot type {string} in advanced search', async function (plotType: string) {
  const actualPlotType = replacePlaceholders(plotType);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.selectPlotTypeInAdvancedSearch(actualPlotType);
});

When('I select status {string} in advanced search', async function (status: string) {
  const actualStatus = replacePlaceholders(status);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.selectStatusInAdvancedSearch(actualStatus);
});

When('I enter price {string} in advanced search', async function (price: string) {
  const actualPrice = replacePlaceholders(price);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterPriceInAdvancedSearch(actualPrice);
});

When('I enter burial capacity {string} in advanced search', async function (capacity: string) {
  const actualCapacity = replacePlaceholders(capacity);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterBurialCapacityInAdvancedSearch(actualCapacity);
});

When('I enter entombment capacity {string} in advanced search', async function (capacity: string) {
  const actualCapacity = replacePlaceholders(capacity);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterEntombmentCapacityInAdvancedSearch(actualCapacity);
});

When('I enter cremation capacity {string} in advanced search', async function (capacity: string) {
  const actualCapacity = replacePlaceholders(capacity);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterCremationCapacityInAdvancedSearch(actualCapacity);
});

When('I enter interments qty from {string} to {string} in advanced search', async function (from: string, to: string) {
  const actualFrom = replacePlaceholders(from);
  const actualTo = replacePlaceholders(to);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterIntermentsQtyInAdvancedSearch(actualFrom, actualTo);
});

When('I click on first plot from search results', async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickFirstPlotFromSearchResults();
});

When('I click Edit plot button', async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickEditPlotButton();
});

Then('I should see plot type {string} in edit plot page', async function (plotType: string) {
  const actualPlotType = replacePlaceholders(plotType);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifyPlotTypeInEditPage(actualPlotType);
});

Then('I should see status {string} in edit plot page', async function (status: string) {
  const actualStatus = replacePlaceholders(status);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifyStatusInEditPage(actualStatus);
});

When('I close edit plot page', async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.closeEditPlotPage();
});
