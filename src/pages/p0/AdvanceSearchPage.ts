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
    await this.page.click(AdvanceSearchSelectors.advancedSearchButton);
    await this.page.waitForTimeout(1000); // Wait for dialog to open
    this.logger.success('Advanced search dialog opened');
  }

  /**
   * Select section in advanced search
   * @param section - Section letter (e.g., "A", "B")
   */
  async selectSectionInAdvancedSearch(section: string): Promise<void> {
    this.logger.info(`Selecting section: ${section}`);

    // Section is the first combobox with aria-label "Number" (confusing but that's the label)
    // We need to get the first combobox that has the label "Number" and is NOT a textbox
    await this.page.getByRole('combobox', { name: 'Number' }).first().click();
    await this.page.waitForTimeout(500);

    // Select the section option
    await this.page.getByRole('option', { name: section, exact: true }).click();
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

    // Select the row option
    await this.page.getByRole('option', { name: row, exact: true }).click();
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

    await this.page.click(AdvanceSearchSelectors.searchButton);

    // Wait for search results to load and redirect to search page
    await this.page.waitForURL('**/search/advance', { timeout: 10000 });
    await this.page.waitForTimeout(3000); // Wait for results to load

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
}
