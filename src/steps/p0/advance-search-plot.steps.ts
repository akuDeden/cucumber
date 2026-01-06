import { When, Then, Given } from '@cucumber/cucumber';
import { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { AdvanceSearchPlotSelectors } from '../../selectors/p0/advance-search-plot.selectors.js';
import { Logger } from '../../utils/Logger.js';

// Initialize logger
const logger = new Logger('AdvanceSearchPlotSteps');

// Background step
Given('I am on the Chronicle home page', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Navigating to Chronicle home page');
  await page.goto('https://staging.chronicle.rip/');
  await page.waitForTimeout(3000); // Wait for page to load
  logger.success('Chronicle home page loaded');
});

// Advanced Search Steps (Without Login)
When('I click Advanced search button without login', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Clicking Advanced search button');
  await page.locator(AdvanceSearchPlotSelectors.advancedSearchButton).click();
  await page.waitForTimeout(1000); // Wait for dialog to open
  logger.success('Advanced search dialog opened');
});

When('I select cemetery {string} in advanced search', { timeout: 10000 }, async function (cemeteryName: string) {
  const page: Page = this.page;
  logger.info(`Selecting cemetery: ${cemeteryName}`);

  // Click cemetery combobox using getByRole (more robust than CSS selector)
  await page.getByRole('combobox', { name: 'Cemeteries' }).click();
  await page.waitForTimeout(500);

  // Select the cemetery option using exact match to avoid strict mode violations
  await page.getByRole('option', { name: cemeteryName, exact: true }).click();
  await page.waitForTimeout(500);

  // Close the dropdown by pressing Escape (required before clicking Plot tab)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  logger.success(`Cemetery ${cemeteryName} selected`);
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
  logger.info(`Selecting section: ${section}`);

  // Click section combobox using getByRole (the combobox has aria-label="Number")
  await page.getByRole('combobox', { name: 'Number' }).click();
  await page.waitForTimeout(500);

  // Select the section option
  await page.getByRole('option', { name: section, exact: true }).click();
  await page.waitForTimeout(500);

  logger.success(`Section ${section} selected`);
});

When('I select row {string} in advanced search without login', { timeout: 10000 }, async function (row: string) {
  const page: Page = this.page;
  logger.info(`Selecting row: ${row}`);

  // Click row combobox using getByRole
  await page.getByRole('combobox', { name: 'Row' }).click();
  await page.waitForTimeout(500);

  // Select the row option (use exact match for single letters)
  await page.getByRole('option', { name: row, exact: true }).click();
  await page.waitForTimeout(500);

  logger.success(`Row ${row} selected`);
});

When('I enter plot number {string} in advanced search without login', { timeout: 10000 }, async function (number: string) {
  const page: Page = this.page;
  logger.info(`Entering plot number: ${number}`);

  // Click on the number textbox
  await page.locator(AdvanceSearchPlotSelectors.numberTextbox).click();
  await page.waitForTimeout(300);

  // Fill the number
  await page.locator(AdvanceSearchPlotSelectors.numberTextbox).fill(number);
  await page.waitForTimeout(500);

  logger.success(`Plot number ${number} entered`);
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

  await page.locator(AdvanceSearchPlotSelectors.searchButton).click();

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
  const heading = page.locator(AdvanceSearchPlotSelectors.searchResultsHeading);
  await heading.waitFor({ state: 'visible', timeout: 10000 });

  logger.success('Verified on advance search results page');
});

Then('I should see search results information', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying search results information');

  // Check for search results heading (e.g., "0 plots found...")
  const heading = page.locator(AdvanceSearchPlotSelectors.searchResultsHeading);
  await expect(heading).toBeVisible({ timeout: 5000 });

  // Check for subheading (e.g., "in 0 cemeteries")
  const subheading = page.locator(AdvanceSearchPlotSelectors.searchResultsSubheading);
  await expect(subheading).toBeVisible({ timeout: 5000 });

  logger.success('Search results information verified');
});

Then('I should see plot number {string} in sidebar results', { timeout: 10000 }, async function (plotNumber: string) {
  const page: Page = this.page;
  logger.info(`Verifying plot number ${plotNumber} in sidebar results`);

  // Get the plot detail text from sidebar
  const plotDetailText = page.locator(AdvanceSearchPlotSelectors.plotDetailText);
  await expect(plotDetailText).toBeVisible({ timeout: 5000 });

  // Get the text content
  const text = await plotDetailText.textContent();

  // Verify the plot number is in the text (format: "A B 2" contains "2")
  expect(text).toContain(plotNumber);

  logger.success(`Plot number ${plotNumber} verified in sidebar: ${text}`);
});

Then('I should see cemetery name {string} in sidebar results', { timeout: 10000 }, async function (cemeteryName: string) {
  const page: Page = this.page;
  logger.info(`Verifying cemetery name ${cemeteryName} in sidebar results`);

  // Get the cemetery name text from sidebar
  const cemeteryNameText = page.locator(AdvanceSearchPlotSelectors.cemeteryNameText);
  await expect(cemeteryNameText).toBeVisible({ timeout: 5000 });

  // Get the text content
  const text = await cemeteryNameText.textContent();

  // Verify the cemetery name matches exactly
  expect(text).toBe(cemeteryName);

  logger.success(`Cemetery name ${cemeteryName} verified in sidebar`);
});

Then('I should see status icon {string} in first result', { timeout: 10000 }, async function (expectedStatus: string) {
  const page: Page = this.page;
  logger.info(`Verifying status icon ${expectedStatus} in first result`);

  // Get the icon element from first result
  const icon = page.locator(AdvanceSearchPlotSelectors.firstResultIcon);
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

  await page.locator(AdvanceSearchPlotSelectors.closeAdvanceSearchButton).click();

  // Wait for navigation back to home page with increased timeout
  await page.waitForURL('https://staging.chronicle.rip/', { timeout: 15000 });
  await page.waitForTimeout(1500);

  logger.success('Advance search closed, navigated to home page');
});

Then('I should be on the home page', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying on home page');

  // Check URL
  expect(page.url()).toBe('https://staging.chronicle.rip/');

  logger.success('Verified on home page');
});

Then('I should not see advance search results sidebar', { timeout: 10000 }, async function () {
  const page: Page = this.page;
  logger.info('Verifying advance search results sidebar is not visible');

  // Check that search results heading is NOT visible
  const searchResultsHeading = page.locator(AdvanceSearchPlotSelectors.searchResultsHeading);
  await expect(searchResultsHeading).not.toBeVisible({ timeout: 5000 });

  // Check that search results subheading is NOT visible
  const searchResultsSubheading = page.locator(AdvanceSearchPlotSelectors.searchResultsSubheading);
  await expect(searchResultsSubheading).not.toBeVisible({ timeout: 5000 });

  // Check that plot detail is NOT visible
  const plotDetailText = page.locator(AdvanceSearchPlotSelectors.plotDetailText);
  await expect(plotDetailText).not.toBeVisible({ timeout: 5000 });

  logger.success('Advance search results sidebar is not visible');
});
