import { Page, expect } from '@playwright/test';
import { AdvanceSearchSelectors } from '../../selectors/p0/advanceSearch.selectors.js';
import { IntermentSelectors } from '../../selectors/p0/interment.selectors.js';
import { Logger } from '../../utils/Logger.js';

/**
 * AdvanceSearchPage - Page Object Model for Advanced Search functionality
 * This class handles all advanced search operations for plots
 * Separated from IntermentPage for better organization and maintainability
 */
export class AdvanceSearchPage {
  readonly page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('AdvanceSearchPage');
  }

  /**
   * Click Advanced search button to open advanced search dialog
   */
  async clickAdvancedSearchButton(): Promise<void> {
    this.logger.info('Clicking Advanced search button');

    // Wait for the Advanced button to be visible and enabled (after loading completes)
    const advancedButton = this.page.locator(AdvanceSearchSelectors.advancedSearchButton);

    // Wait for button to be visible
    await advancedButton.waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Advanced button visible, waiting for it to be enabled...');

    // Wait for button to be enabled by using isEnabled check in a loop
    let isEnabled = false;
    const maxAttempts = 30; // 30 attempts * 500ms = 15 seconds max
    for (let i = 0; i < maxAttempts; i++) {
      isEnabled = await advancedButton.isEnabled();
      if (isEnabled) {
        break;
      }
      await this.page.waitForTimeout(500);
    }

    if (!isEnabled) {
      throw new Error('Advanced search button did not become enabled within timeout');
    }

    this.logger.info('Advanced button is now enabled, clicking...');

    // Click the button
    await advancedButton.click();
    await this.page.waitForTimeout(1000); // Wait for dialog to open
    this.logger.success('Advanced search dialog opened');
  }

  /**
   * Select section in advanced search
   * @param section - Section letter (e.g., "A", "B")
   */
  async selectSectionInAdvancedSearch(section: string): Promise<void> {
    this.logger.info(`Selecting section: ${section}`);

    // Section combobox has testid 'filter-section-row-input-number'
    await this.page.getByTestId('filter-section-row-input-number').click();
    await this.page.waitForTimeout(500);

    // Wait for the option to be visible before clicking
    const sectionOption = this.page.getByRole('option', { name: section, exact: true });
    await sectionOption.waitFor({ state: 'visible', timeout: 5000 });
    await sectionOption.click();
    await this.page.waitForTimeout(500);

    this.logger.success(`Section ${section} selected`);
  }

  /**
   * Select row in advanced search
   * @param row - Row letter (e.g., "A", "B", "C")
   */
  async selectRowInAdvancedSearch(row: string): Promise<void> {
    this.logger.info(`Selecting row: ${row}`);

    // Row is a combobox with aria-label "Row"
    await this.page.getByRole('combobox', { name: 'Row' }).click();
    await this.page.waitForTimeout(500);

    // Wait for the option to be visible before clicking
    const rowOption = this.page.getByRole('option', { name: row, exact: true });
    await rowOption.waitFor({ state: 'visible', timeout: 5000 });
    await rowOption.click();
    await this.page.waitForTimeout(500);

    this.logger.success(`Row ${row} selected`);
  }

  /**
   * Enter plot number in advanced search
   * @param number - Plot number (e.g., "1", "2")
   */
  async enterPlotNumberInAdvancedSearch(number: string): Promise<void> {
    this.logger.info(`Entering plot number: ${number}`);

    // Use the specific testid for the number field in advanced search
    // The testid is 'filter-section-row-input-12' where 12 is the placeholder value
    const numberField = this.page.getByTestId('filter-section-row-input-12');
    await numberField.click();
    await this.page.waitForTimeout(300);
    await numberField.fill(number);
    await this.page.waitForTimeout(500);

    this.logger.success(`Plot number ${number} entered`);
  }

  /**
   * Click Search button in advanced search dialog
   */
  async clickSearchButtonInAdvancedSearch(): Promise<void> {
    this.logger.info('Clicking Search button in advanced search');

    // Check if we're already on the search page
    const currentUrl = this.page.url();
    const isAlreadyOnSearchPage = currentUrl.includes('/search/advance');

    // Wait for search button to be visible and enabled
    const searchButton = this.page.locator(AdvanceSearchSelectors.searchButton);
    await searchButton.waitFor({ state: 'visible', timeout: 5000 });
    await expect(searchButton).toBeEnabled({ timeout: 5000 });

    await searchButton.click();

    // Wait for search results to load
    if (isAlreadyOnSearchPage) {
      // Already on search page, just wait for results to update
      this.logger.info('Already on search page, waiting for results to update...');
      await this.page.waitForTimeout(3000);
      
      // Wait for the search results heading to be updated (it should change text)
      await this.page.waitForSelector(AdvanceSearchSelectors.searchResultsHeading, { 
        state: 'visible', 
        timeout: 5000 
      });
    } else {
      // Wait for navigation to search page
      this.logger.info('Waiting for navigation to search results page...');
      await this.page.waitForURL('**/search/advance', { timeout: 10000 });
      await this.page.waitForTimeout(3000); // Wait for results to load
      
      // Verify we're on the search page by checking for results heading
      await this.page.waitForSelector(AdvanceSearchSelectors.searchResultsHeading, { 
        state: 'visible', 
        timeout: 5000 
      });
    }

    this.logger.success('Search completed, results displayed');
  }

  /**
   * Verify search results contain a specific plot
   * @param plotId - Plot ID to verify (e.g., "A A 1")
   */
  async verifySearchResultsContain(plotId: string): Promise<void> {
    this.logger.info(`Verifying search results contain plot: ${plotId}`);

    // Wait for search results heading
    await this.page.waitForSelector(AdvanceSearchSelectors.searchResultsHeading, { timeout: 10000 });

    // Use the specific testid for the search result div
    const searchResultDiv = this.page.getByTestId('advance-search-result-div-search-list');
    await searchResultDiv.waitFor({ state: 'visible', timeout: 10000 });

    // Verify the plot ID is visible in the search result
    await expect(searchResultDiv.getByText(plotId)).toBeVisible({ timeout: 5000 });

    this.logger.success(`Plot ${plotId} found in search results`);
  }

  /**
   * Click on a plot from search results
   * @param plotId - Plot ID to click (e.g., "A A 1")
   */
  async clickPlotFromSearchResults(plotId: string): Promise<void> {
    this.logger.info(`Clicking on plot ${plotId} from search results`);

    // Use the specific testid for the search result div and click on it
    const searchResultDiv = this.page.getByTestId('advance-search-result-div-search-list');
    await searchResultDiv.click();

    // Wait for navigation to plot detail page
    await this.page.waitForURL('**/plots/**', { timeout: 10000 });
    await this.page.waitForTimeout(3000); // Wait for sidebar to load

    this.logger.success(`Navigated to plot ${plotId} detail page`);
  }

  /**
   * Verify plot sidebar is visible with correct plot ID
   * @param plotId - Expected plot ID (e.g., "A A 1")
   */
  async verifyPlotSidebarWithPlotId(plotId: string): Promise<void> {
    this.logger.info(`Verifying plot sidebar shows plot ID: ${plotId}`);

    // Check for plot ID in sidebar heading
    const plotHeading = this.page.locator(IntermentSelectors.plotSidebarHeading(plotId));
    await plotHeading.waitFor({ state: 'visible', timeout: 10000 });

    this.logger.success(`Plot sidebar verified with ID: ${plotId}`);
  }

  /**
   * Verify plot details sidebar is visible
   */
  async verifyPlotDetailsSidebar(): Promise<void> {
    this.logger.info('Verifying plot details sidebar is visible');

    // Check for Edit button which indicates sidebar is loaded
    const editButton = this.page.locator(IntermentSelectors.editButtonInSidebar);
    await editButton.waitFor({ state: 'visible', timeout: 10000 });

    this.logger.success('Plot details sidebar verified');
  }

  // ==========================================
  // ADVANCED SEARCH WITH MULTIPLE FILTERS
  // ==========================================

  /**
   * Enter Plot ID in advanced search
   * @param plotId - Plot ID to search (e.g., "B G 5")
   */
  async enterPlotIdInAdvancedSearch(plotId: string): Promise<void> {
    this.logger.info(`Entering Plot ID: ${plotId}`);

    const plotIdField = this.page.getByRole('textbox', { name: 'Plot ID' });
    await plotIdField.click();
    await this.page.waitForTimeout(300);
    await plotIdField.fill(plotId);
    await this.page.waitForTimeout(500);

    this.logger.success(`Plot ID ${plotId} entered`);
  }

  /**
   * Select Plot type in advanced search
   * @param plotType - Plot type (e.g., "Lawn", "Garden", "Monumental", etc.)
   */
  async selectPlotTypeInAdvancedSearch(plotType: string): Promise<void> {
    this.logger.info(`Selecting Plot type: ${plotType}`);

    // Click the plot type combobox
    await this.page.getByRole('combobox', { name: 'Plot type' }).click();
    await this.page.waitForTimeout(500);

    // Wait for the option to be visible before clicking (important for slower environments)
    const plotTypeOption = this.page.getByRole('option', { name: plotType, exact: true });
    await plotTypeOption.waitFor({ state: 'visible', timeout: 5000 });
    this.logger.info(`Plot type option "${plotType}" is visible, clicking...`);

    await plotTypeOption.click();
    await this.page.waitForTimeout(500);

    this.logger.success(`Plot type ${plotType} selected`);
  }

  /**
   * Select Status in advanced search
   * @param status - Status (e.g., "Vacant", "Occupied", "Reserved", "For Sale")
   */
  async selectStatusInAdvancedSearch(status: string): Promise<void> {
    this.logger.info(`Selecting Status: ${status}`);

    await this.page.getByRole('combobox', { name: 'Status' }).click();
    await this.page.waitForTimeout(500);

    // Wait for the option to be visible before clicking
    const statusOption = this.page.getByRole('option', { name: status, exact: true });
    await statusOption.waitFor({ state: 'visible', timeout: 5000 });
    await statusOption.click();
    await this.page.waitForTimeout(500);

    this.logger.success(`Status ${status} selected`);
  }

  /**
   * Enter Price in advanced search
   * @param price - Price amount (e.g., "1000")
   */
  async enterPriceInAdvancedSearch(price: string): Promise<void> {
    this.logger.info(`Entering Price: ${price}`);

    const priceField = this.page.getByRole('textbox', { name: 'Price ($)' });
    await priceField.click();
    await this.page.waitForTimeout(300);
    await priceField.fill(price);
    await this.page.waitForTimeout(500);

    this.logger.success(`Price ${price} entered`);
  }

  /**
   * Enter Burial capacity in advanced search
   * @param capacity - Burial capacity number (e.g., "1")
   */
  async enterBurialCapacityInAdvancedSearch(capacity: string): Promise<void> {
    this.logger.info(`Entering Burial capacity: ${capacity}`);

    const burialCapacityField = this.page.getByRole('textbox', { name: 'Burials' });
    
    // Wait for field to be visible and enabled
    await burialCapacityField.waitFor({ state: 'visible', timeout: 5000 });
    await expect(burialCapacityField).toBeEnabled({ timeout: 5000 });
    
    // Clear any existing value first
    await burialCapacityField.clear();
    await this.page.waitForTimeout(300);
    
    // Fill with new value
    await burialCapacityField.fill(capacity);
    await this.page.waitForTimeout(500);
    
    // Verify value was entered correctly
    const enteredValue = await burialCapacityField.inputValue();
    if (enteredValue !== capacity) {
      this.logger.warn(`Value mismatch: expected "${capacity}", got "${enteredValue}". Retrying...`);
      await burialCapacityField.clear();
      await burialCapacityField.fill(capacity);
      await this.page.waitForTimeout(300);
    }

    this.logger.success(`Burial capacity ${capacity} entered`);
  }

  /**
   * Enter Entombment capacity in advanced search
   * @param capacity - Entombment capacity number (e.g., "0")
   */
  async enterEntombmentCapacityInAdvancedSearch(capacity: string): Promise<void> {
    this.logger.info(`Entering Entombment capacity: ${capacity}`);

    const entombmentCapacityField = this.page.getByRole('textbox', { name: 'Entombments' });
    
    // Wait for field to be visible and enabled
    await entombmentCapacityField.waitFor({ state: 'visible', timeout: 5000 });
    await expect(entombmentCapacityField).toBeEnabled({ timeout: 5000 });
    
    // Clear any existing value first
    await entombmentCapacityField.clear();
    await this.page.waitForTimeout(300);
    
    // Fill with new value
    await entombmentCapacityField.fill(capacity);
    await this.page.waitForTimeout(500);
    
    // Verify value was entered correctly
    const enteredValue = await entombmentCapacityField.inputValue();
    if (enteredValue !== capacity) {
      this.logger.warn(`Value mismatch: expected "${capacity}", got "${enteredValue}". Retrying...`);
      await entombmentCapacityField.clear();
      await entombmentCapacityField.fill(capacity);
      await this.page.waitForTimeout(300);
    }

    this.logger.success(`Entombment capacity ${capacity} entered`);
  }

  /**
   * Enter Cremation capacity in advanced search
   * @param capacity - Cremation capacity number (e.g., "0")
   */
  async enterCremationCapacityInAdvancedSearch(capacity: string): Promise<void> {
    this.logger.info(`Entering Cremation capacity: ${capacity}`);

    const cremationCapacityField = this.page.getByRole('textbox', { name: 'Cremations' });
    
    // Wait for field to be visible and enabled
    await cremationCapacityField.waitFor({ state: 'visible', timeout: 5000 });
    await expect(cremationCapacityField).toBeEnabled({ timeout: 5000 });
    
    // Clear any existing value first
    await cremationCapacityField.clear();
    await this.page.waitForTimeout(300);
    
    // Fill with new value
    await cremationCapacityField.fill(capacity);
    await this.page.waitForTimeout(500);
    
    // Verify value was entered correctly
    const enteredValue = await cremationCapacityField.inputValue();
    if (enteredValue !== capacity) {
      this.logger.warn(`Value mismatch: expected "${capacity}", got "${enteredValue}". Retrying...`);
      await cremationCapacityField.clear();
      await cremationCapacityField.fill(capacity);
      await this.page.waitForTimeout(300);
    }

    this.logger.success(`Cremation capacity ${capacity} entered`);
  }

  /**
   * Enter Interments Qty range in advanced search
   * @param from - From value (e.g., "0")
   * @param to - To value (e.g., "2")
   */
  async enterIntermentsQtyInAdvancedSearch(from: string, to: string): Promise<void> {
    this.logger.info(`Entering Interments Qty from ${from} to ${to}`);

    // Fill From field - use nth(0) to get the first matching element
    const fromField = this.page.locator('input[formcontrolname="fromQty"]');
    await fromField.click();
    await this.page.waitForTimeout(300);
    await fromField.fill(from);
    await this.page.waitForTimeout(500);

    // Fill To field - use nth(1) to get the second matching element
    const toField = this.page.locator('input[formcontrolname="toQty"]');
    await toField.click();
    await this.page.waitForTimeout(300);
    await toField.fill(to);
    await this.page.waitForTimeout(500);

    this.logger.success(`Interments Qty ${from} - ${to} entered`);
  }

  /**
   * Click on first plot from search results
   */
  async clickFirstPlotFromSearchResults(): Promise<void> {
    this.logger.info('Clicking on first plot from search results');

    // Wait for search results to load and be visible
    // The search results div contains the plot list after advance search
    await this.page.waitForTimeout(3000);

    // Use the specific testid for the search result div
    // This selector was verified to work with MCP Playwright browser
    const searchResultDiv = this.page.getByTestId('advance-search-result-div-search-list');

    // Wait for the element to be visible and clickable
    await searchResultDiv.waitFor({ state: 'visible', timeout: 10000 });

    // Click on the first result
    await searchResultDiv.click();

    // Wait for navigation to plot detail page
    await this.page.waitForURL('**/plots/**', { timeout: 15000 });
    await this.page.waitForTimeout(3000); // Wait for sidebar to load

    this.logger.success('Navigated to plot detail page');
  }

  /**
   * Click Edit plot button
   */
  async clickEditPlotButton(): Promise<void> {
    this.logger.info('Clicking Edit plot button');

    await this.page.getByTestId('plot-details-edit-button-edit-plot').click();

    // Wait for navigation to edit plot page
    await this.page.waitForURL('**/manage/edit/plot', { timeout: 10000 });
    await this.page.waitForTimeout(2000); // Wait for page to load

    this.logger.success('Navigated to edit plot page');
  }

  /**
   * Verify plot type in edit plot page
   * @param plotType - Expected plot type (e.g., "Lawn")
   */
  async verifyPlotTypeInEditPage(plotType: string): Promise<void> {
    this.logger.info(`Verifying plot type "${plotType}" in edit plot page`);

    const plotTypeField = this.page.getByRole('combobox', { name: /Plot type/i });
    const actualPlotType = (await plotTypeField.textContent())?.trim() || '';

    if (actualPlotType !== plotType) {
      throw new Error(`❌ Plot type mismatch! Expected: "${plotType}", Actual: "${actualPlotType}"`);
    }

    this.logger.success(`Plot type verified: "${plotType}"`);
  }

  /**
   * Verify status in edit plot page
   * @param status - Expected status (e.g., "Vacant")
   */
  async verifyStatusInEditPage(status: string): Promise<void> {
    this.logger.info(`Verifying status "${status}" in edit plot page`);

    const statusField = this.page.getByRole('combobox', { name: /Status/i });
    const actualStatus = (await statusField.textContent())?.trim() || '';

    if (actualStatus !== status) {
      throw new Error(`❌ Status mismatch! Expected: "${status}", Actual: "${actualStatus}"`);
    }

    this.logger.success(`Status verified: "${status}"`);
  }

  /**
   * Close edit plot page (navigate back)
   */
  async closeEditPlotPage(): Promise<void> {
    this.logger.info('Closing edit plot page');

    await this.page.goBack();
    await this.page.waitForTimeout(2000);

    this.logger.success('Edit plot page closed, returned to plot detail');
  }
}
