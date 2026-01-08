import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { Logger } from '../../utils/Logger.js';

// Initialize logger
const logger = new Logger('SearchBoxSteps');

// ==========================================
// PUBLIC SEARCH STEPS (WITHOUT LOGIN)
// ==========================================

When('I select cemetery {string} for public search', { timeout: 30000 }, async function (cemeteryName: string) {
  const page = this.page;
  const actualCemetery = replacePlaceholders(cemeteryName);

  // Wait for page to load completely
  await page.waitForTimeout(3000);

  // Find and click the search input in header using data-testid
  const searchInput = page.getByTestId('autocomplete-base-routing-input-autocomplete-search-input');
  await searchInput.click();
  await searchInput.fill(actualCemetery);

  // Wait for search dropdown to appear
  await page.waitForTimeout(2000);

  // Find and click the cemetery search result (avoid US variant)
  const cemeteryResult = page.locator('cl-search-cemetery-item').filter({ hasText: new RegExp(actualCemetery, 'i') }).first();

  // Check if US variant exists and click the non-US one
  const allResults = await page.locator('cl-search-cemetery-item').all();
  let targetResult = cemeteryResult;

  for (const result of allResults) {
    const text = await result.textContent();
    if (text && text.toLowerCase().includes(actualCemetery.toLowerCase()) && !text.toLowerCase().includes('us')) {
      targetResult = result;
      break;
    }
  }

  await targetResult.click();

  // Wait for navigation to cemetery page
  await page.waitForURL(`**/${actualCemetery.replace(/\s+/g, '_')}**`, { timeout: 15000 });
  await page.waitForTimeout(2000);

  logger.info(`Selected cemetery: ${actualCemetery}, now at: ${page.url()}`);
});

When('I search for {string} in global search without login', { timeout: 15000 }, async function (searchQuery: string) {
  const page = this.page;

  // Wait for page to fully load before searching
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Find and click search input in header
  const searchInput = page.locator('input[type="text"][placeholder*="Search" i], [data-testid*="search-input" i]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 10000 });
  await searchInput.click();
  await searchInput.fill(searchQuery);

  // Wait for search API call to complete
  await page.waitForTimeout(3000);

  this.searchQuery = searchQuery;
  logger.info(`Searched for: ${searchQuery}`);
});

Then('I should see {string} message indicating privacy protection', { timeout: 10000 }, async function (expectedMessage: string) {
  const page = this.page;

  // Verify "No results" message is visible
  const noResultsMessage = page.getByText(expectedMessage, { exact: false });
  await noResultsMessage.waitFor({ state: 'visible', timeout: 5000 });

  logger.info(`Verified "${expectedMessage}" message is visible (privacy protection working)`);
});

// ==========================================
// LOGGED-IN USER SEARCH STEPS
// ==========================================

When('I search for {string} in global search', { timeout: 15000 }, async function (searchQuery: string) {
  const page = this.page;

  // Find and click search input in header
  const searchInput = page.locator('input[type="text"][placeholder*="Search" i], input[data-testid*="search" i]').first();
  await searchInput.click();
  await searchInput.fill(searchQuery);

  // Wait for search API call to complete and results to appear
  await page.waitForTimeout(3000);

  // Wait for search results panel
  const searchResultPanel = page.locator('cl-search-person-item').first();
  await searchResultPanel.waitFor({ state: 'visible', timeout: 10000 });

  this.searchQuery = searchQuery;
  logger.info(`Searched for: ${searchQuery}`);
});

Then('I should see search result with plot {string}', { timeout: 10000 }, async function (plotName: string) {
  const page = this.page;

  // Wait for search result item containing the plot name
  const searchResultItem = page.locator('cl-search-person-item').filter({ hasText: plotName });
  await searchResultItem.waitFor({ state: 'visible', timeout: 5000 });

  // Verify plot name is visible
  const plotNameVisible = await searchResultItem.locator(`text=${plotName}`).isVisible();
  expect(plotNameVisible).toBeTruthy();

  // Verify ROI Holder role is shown in search results
  const roiHolderText = searchResultItem.locator('text=/.*\(ROI Holder\).*/i');
  const hasRoiHolder = await roiHolderText.count() > 0;
  expect(hasRoiHolder).toBeTruthy();

  this.selectedPlotFromSearch = plotName;
  logger.info(`Search result verified with plot: ${plotName}`);
});

When('I click on search result plot {string}', { timeout: 20000 }, async function (plotName: string) {
  const page = this.page;

  // Click on the search result item
  const searchResult = page.locator('cl-search-person-item').filter({ hasText: plotName }).first();
  await searchResult.click();

  // Wait for navigation to plot detail page
  await page.waitForURL(`**/${encodeURIComponent(plotName)}**`, { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');

  // Wait for tab list to be visible
  await page.locator('[role="tablist"]').waitFor({ state: 'visible', timeout: 8000 });

  // Click ROI tab directly using getByRole
  const roiTab = page.getByRole('tab', { name: 'ROI' });
  await roiTab.waitFor({ state: 'visible', timeout: 5000 });
  await roiTab.click();

  // Verify ROI tab is actually selected after click
  await page.waitForTimeout(500);
  const isSelected = await roiTab.getAttribute('aria-selected');

  if (isSelected !== 'true') {
    // Tab click didn't work, try again
    console.log('ROI tab not selected, clicking again...');
    await roiTab.click();
    await page.waitForTimeout(500);
  }

  // Wait for ROI data to load completely
  await page.waitForTimeout(2000);

  logger.info(`Clicked on search result plot: ${plotName}, now at: ${page.url()}`);
});
