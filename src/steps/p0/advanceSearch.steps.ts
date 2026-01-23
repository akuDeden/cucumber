import { When, Then, Given } from '@cucumber/cucumber';
import { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { AdvanceSearchSelectors } from '../../selectors/p0/advanceSearch.selectors.js';
import { AdvanceSearchPage } from '../../pages/p0/AdvanceSearchPage.js';
import { Logger } from '../../utils/Logger.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { BASE_CONFIG } from '../../data/test-data.js';

// Initialize logger and page object
const logger = new Logger('AdvanceSearchPlotSteps');

// Helper function to get or initialize advanceSearchPage
function getAdvanceSearchPage(page: Page): AdvanceSearchPage {
  return new AdvanceSearchPage(page);
}

// Background step
Given('I am on the Chronicle home page', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  const baseUrl = BASE_CONFIG.baseUrl;
  logger.info(`Navigating to Chronicle home page: ${baseUrl}`);
  await page.goto(baseUrl);
  await page.waitForTimeout(3000); // Wait for page to load
  logger.success('Chronicle home page loaded');
});

// Advanced Search Steps (Without Login)
When('I click Advanced search button without login', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Clicking Advanced search button');
  await page.waitForTimeout(1000); // Wait for button to be ready
  await page.locator(AdvanceSearchSelectors.advancedSearchButton).click();
  await page.waitForTimeout(1000); // Wait for dialog to open
  logger.success('Advanced search dialog opened');
});

When('I select cemetery {string} in advanced search', { timeout: 10000 }, async function (cemeteryName: string) {
  const page: Page = this.page;
  const cemetery = replacePlaceholders(cemeteryName);
  logger.info(`Selecting cemetery: ${cemetery}`);

  // Click cemetery combobox using getByRole (more robust than CSS selector)
  await page.getByRole('combobox', { name: 'Cemeteries' }).click();
  await page.waitForTimeout(500);

  await page.getByTestId('input-start-typing-to-search').fill(cemetery);
  await page.waitForTimeout(500);

  // Select the cemetery option using exact match - use .first() to avoid strict mode violations
  await page.locator('mat-option span.mat-option-text', { hasText: cemetery }).first().click();
  await page.waitForTimeout(500);

  // Close the dropdown by pressing Escape (required before clicking Plot tab)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  logger.success(`Cemetery ${cemetery} selected`);
});

When('I select Plot tab in advanced search', { timeout: 15000 }, async function () {
  const page: Page = this.page;
  logger.info('Clicking Plot tab');

  // Wait a bit for the dialog to settle after cemetery selection
  await page.waitForTimeout(1000);

  // Click Plot tab using getByRole with aria-label
  await page.getByRole('button', { name: 'Plot', exact: true }).click();
  await page.waitForTimeout(500);

  logger.success('Plot tab selected');
});

When('I select section {string} in advanced search without login', { timeout: 10000 }, async function (section: string) {
  const page: Page = this.page;
  // Replace placeholder with actual test data
  const sec = replacePlaceholders(section);
  logger.info(`Selecting section: ${sec}`);

  // Click section combobox using getByRole (the combobox has aria-label="Number")
  await page.getByRole('combobox', { name: 'Number' }).click();
  await page.waitForTimeout(500);

  // Select the section option
  await page.getByRole('option', { name: sec, exact: true }).click();
  await page.waitForTimeout(500);

  logger.success(`Section ${sec} selected`);
});

When('I select row {string} in advanced search without login', { timeout: 10000 }, async function (row: string) {
  const page: Page = this.page;
  const r = replacePlaceholders(row);
  logger.info(`Selecting row: ${r}`);

  // Click row combobox using getByRole
  await page.getByRole('combobox', { name: 'Row' }).click();
  await page.waitForTimeout(500);

  // Select the row option (use exact match for single letters)
  await page.getByRole('option', { name: r, exact: true }).click();
  await page.waitForTimeout(500);

  logger.success(`Row ${r} selected`);
});

When('I enter plot number {string} in advanced search without login', { timeout: 10000 }, async function (number: string) {
  const page: Page = this.page;
  const num = replacePlaceholders(number);
  logger.info(`Entering plot number: ${num}`);

  // Click on the number textbox
  await page.locator(AdvanceSearchSelectors.numberTextbox).click();
  await page.waitForTimeout(300);

  // Fill the number
  await page.locator(AdvanceSearchSelectors.numberTextbox).fill(num);
  await page.waitForTimeout(500);

  logger.success(`Plot number ${num} entered`);
});

When('I select status {string} in advanced search without login', { timeout: 10000 }, async function (status: string) {
  const page: Page = this.page;
  logger.info(`Selecting status: ${status}`);

  // Click status combobox
  await page.getByRole('combobox', { name: 'Status' }).click();
  await page.waitForTimeout(500);

  // Select the status option
  await page.getByRole('option', { name: status, exact: true }).click();
  await page.waitForTimeout(500);

  // Close the dropdown by pressing Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  logger.success(`Status ${status} selected`);
});

When('I click Search button in advanced search without login', { timeout: 15000 }, async function () {
  const page: Page = this.page;
  logger.info('Clicking Search button in advanced search');

  await page.locator(AdvanceSearchSelectors.searchButton).click();

  // Wait for navigation to search results page
  await page.waitForURL('**/search/advance', { timeout: 10000 });
  await page.waitForTimeout(2000); // Wait for results to load

  logger.success('Search completed, navigated to results page');
});

Then('I should be navigated to advance search results page', { timeout: 15000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying navigation to advance search results page');

  // Check URL
  await page.waitForURL('**/search/advance', { timeout: 10000 });

  // Check for search results heading
  const heading = page.locator(AdvanceSearchSelectors.searchResultsHeading);
  await heading.waitFor({ state: 'visible', timeout: 10000 });

  logger.success('Verified on advance search results page');
});

Then('I should see search results information', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying search results information');

  // Check for search results heading (e.g., "0 plots found...")
  const heading = page.locator(AdvanceSearchSelectors.searchResultsHeading);
  await expect(heading).toBeVisible({ timeout: 5000 });

  // Check for subheading (e.g., "in 0 cemeteries")
  const subheading = page.locator(AdvanceSearchSelectors.searchResultsSubheading);
  await expect(subheading).toBeVisible({ timeout: 5000 });

  logger.success('Search results information verified');
});

Then('I should see plot number {string} in sidebar results', { timeout: 10000 }, async function (plotNumber: string) {
  const page: Page = this.page;
  const actualPlotNumber = replacePlaceholders(plotNumber);
  logger.info(`Verifying plot number ${actualPlotNumber} in sidebar results`);

  // Get the plot detail text from sidebar
  const plotDetailText = page.locator(AdvanceSearchSelectors.plotDetailText);
  await expect(plotDetailText).toBeVisible({ timeout: 5000 });

  // Get the text content
  const text = await plotDetailText.textContent();

  // Verify the plot number is in the text (format: "A B 2" contains "2")
  expect(text).toContain(actualPlotNumber);

  logger.success(`Plot number ${actualPlotNumber} verified in sidebar: ${text}`);
});

Then('I should see cemetery name {string} in sidebar results', { timeout: 10000 }, async function (cemeteryName: string) {
  const page: Page = this.page;
  const actualCemeteryName = replacePlaceholders(cemeteryName);
  logger.info(`Verifying cemetery name ${actualCemeteryName} in sidebar results`);

  // Get the cemetery name text from sidebar
  const cemeteryNameText = page.locator(AdvanceSearchSelectors.cemeteryNameText);
  await expect(cemeteryNameText).toBeVisible({ timeout: 5000 });

  // Get the text content
  const text = await cemeteryNameText.textContent();

  // Verify the cemetery name matches exactly
  expect(text).toBe(actualCemeteryName);

  logger.success(`Cemetery name ${actualCemeteryName} verified in sidebar`);
});

Then('I should see status icon {string} in first result', { timeout: 10000 }, async function (expectedStatus: string) {
  const page: Page = this.page;
  logger.info(`Verifying status icon ${expectedStatus} in first result`);

  // Get the icon element from first result
  const icon = page.locator(AdvanceSearchSelectors.firstResultIcon);
  await expect(icon).toBeVisible({ timeout: 5000 });

  // Get the class attribute
  const className = await icon.getAttribute('class');

  // Convert expected status to lowercase for class matching
  // "For Sale" -> "for sale", "Vacant" -> "vacant", etc.
  const expectedClass = expectedStatus.toLowerCase();

  // Verify the icon has the expected class
  expect(className).toContain(expectedClass);

  logger.success(`Status icon ${expectedStatus} verified in first result (class: ${expectedClass})`);
});

When('I click close advance search button', { timeout: 20000 }, async function () {
  const page: Page = this.page;
  logger.info('Clicking close advance search button');

  await page.locator(AdvanceSearchSelectors.closeAdvanceSearchButton).click();

  // Wait for navigation back to home page with increased timeout
  const baseUrl = BASE_CONFIG.baseUrl;
  await page.waitForURL(baseUrl, { timeout: 15000 });
  await page.waitForTimeout(1500);

  logger.success('Advance search closed, navigated to home page');
});

Then('I should be on the home page', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying on home page');

  // Check URL - handle trailing slash difference
  const baseUrl = BASE_CONFIG.baseUrl;
  const currentUrl = page.url().replace(/\/$/, ''); // Remove trailing slash
  const expectedUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  expect(currentUrl).toBe(expectedUrl);

  logger.success('Verified on home page');
});

Then('I should not see advance search results sidebar', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying advance search results sidebar is not visible');

  // Check that search results heading is NOT visible
  const searchResultsHeading = page.locator(AdvanceSearchSelectors.searchResultsHeading);
  await expect(searchResultsHeading).not.toBeVisible({ timeout: 5000 });

  // Check that search results subheading is NOT visible
  const searchResultsSubheading = page.locator(AdvanceSearchSelectors.searchResultsSubheading);
  await expect(searchResultsSubheading).not.toBeVisible({ timeout: 5000 });

  // Check that plot detail is NOT visible
  const plotDetailText = page.locator(AdvanceSearchSelectors.plotDetailText);
  await expect(plotDetailText).not.toBeVisible({ timeout: 5000 });

  logger.success('Advance search results sidebar is not visible');
});

// ==========================================
// LOGGED-IN USER ADVANCED SEARCH STEPS
// ==========================================

When('I click Advanced search button', { timeout: 20000 }, async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickAdvancedSearchButton();
});

When('I select section {string} in advanced search', { timeout: 10000 }, async function (section: string) {
  const actualSection = replacePlaceholders(section);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.selectSectionInAdvancedSearch(actualSection);
});

When('I select row {string} in advanced search', { timeout: 10000 }, async function (row: string) {
  const actualRow = replacePlaceholders(row);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.selectRowInAdvancedSearch(actualRow);
});

When('I enter plot number {string} in advanced search', { timeout: 10000 }, async function (number: string) {
  const actualNumber = replacePlaceholders(number);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterPlotNumberInAdvancedSearch(actualNumber);
});

When('I click Search button in advanced search', { timeout: 15000 }, async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickSearchButtonInAdvancedSearch();
});

Then('I should see search results containing {string}', { timeout: 15000 }, async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifySearchResultsContain(actualPlotId);
});

When('I click on plot {string} from search results', { timeout: 15000 }, async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickPlotFromSearchResults(actualPlotId);
});

Then('I should see plot sidebar with plot ID {string}', { timeout: 15000 }, async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifyPlotSidebarWithPlotId(actualPlotId);
});

Then('I should see plot details sidebar', { timeout: 10000 }, async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifyPlotDetailsSidebar();
});

// ==========================================
// ADVANCED SEARCH WITH MULTIPLE FILTERS STEPS
// ==========================================

When('I enter plot ID {string} in advanced search', { timeout: 10000 }, async function (plotId: string) {
  const actualPlotId = replacePlaceholders(plotId);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterPlotIdInAdvancedSearch(actualPlotId);
});

When('I select plot type {string} in advanced search', { timeout: 10000 }, async function (plotType: string) {
  const actualPlotType = replacePlaceholders(plotType);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.selectPlotTypeInAdvancedSearch(actualPlotType);
});

When('I select status {string} in advanced search', { timeout: 10000 }, async function (status: string) {
  const actualStatus = replacePlaceholders(status);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.selectStatusInAdvancedSearch(actualStatus);
});

When('I enter price {string} in advanced search', { timeout: 10000 }, async function (price: string) {
  const actualPrice = replacePlaceholders(price);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterPriceInAdvancedSearch(actualPrice);
});

When('I enter burial capacity {string} in advanced search', { timeout: 10000 }, async function (capacity: string) {
  const actualCapacity = replacePlaceholders(capacity);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterBurialCapacityInAdvancedSearch(actualCapacity);
});

When('I enter entombment capacity {string} in advanced search', { timeout: 10000 }, async function (capacity: string) {
  const actualCapacity = replacePlaceholders(capacity);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterEntombmentCapacityInAdvancedSearch(actualCapacity);
});

When('I enter cremation capacity {string} in advanced search', { timeout: 10000 }, async function (capacity: string) {
  const actualCapacity = replacePlaceholders(capacity);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterCremationCapacityInAdvancedSearch(actualCapacity);
});

When('I enter interments qty from {string} to {string} in advanced search', { timeout: 10000 }, async function (From: string, to: string) {
  const actualFrom = replacePlaceholders(From);
  const actualTo = replacePlaceholders(to);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.enterIntermentsQtyInAdvancedSearch(actualFrom, actualTo);
});

When('I click on first plot from search results', { timeout: 15000 }, async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickFirstPlotFromSearchResults();
});

When('I click Edit plot button', { timeout: 15000 }, async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.clickEditPlotButton();
});

Then('I should see plot type {string} in edit plot page', { timeout: 10000 }, async function (plotType: string) {
  const actualPlotType = replacePlaceholders(plotType);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifyPlotTypeInEditPage(actualPlotType);
});

Then('I should see status {string} in edit plot page', { timeout: 10000 }, async function (status: string) {
  const actualStatus = replacePlaceholders(status);
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.verifyStatusInEditPage(actualStatus);
});

When('I close edit plot page', { timeout: 10000 }, async function () {
  const page = this.page as Page;
  const advanceSearchPage = getAdvanceSearchPage(page);
  await advanceSearchPage.closeEditPlotPage();
});
