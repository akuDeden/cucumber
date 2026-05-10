import { Page } from '@playwright/test';
import { RoiSelectors, RoiUrls, PlotStatus } from '../../selectors/p0/roi/index.js';
import { Logger } from '../../utils/Logger.js';
import { getCustomerOrgUrl } from '../../data/test-data.js';
import { ROIPage } from './ROIPage.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';

export class PlotPage {
  readonly page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('PlotPage');
  }

  /**
   * Navigate to plots page from dashboard
   */
  async clickSeeAllPlots(): Promise<void> {
    this.logger.info('Navigating to plots page');
    // Try clicking the button first; if it doesn't appear within 8s, fall back to direct URL navigation
    // (the statistics widget can be slow to render on project servers)
    const btn = this.page.locator(RoiSelectors.seeAllPlotsButton);
    const btnVisible = await btn.isVisible({ timeout: 8000 }).catch(() => false);
    if (btnVisible) {
      await btn.click();
    } else {
      // Build plots URL from the current page URL to avoid hardcoding the org path
      const currentUrl = this.page.url();
      const orgBase = currentUrl.match(/https?:\/\/[^/]+\/customer-organization\/[^/]+/)?.[0];
      if (orgBase) {
        await this.page.goto(`${orgBase}${RoiUrls.plotsListPage}`, { waitUntil: 'domcontentloaded' });
      } else {
        // Last resort: click the button with extended timeout
        await btn.waitFor({ state: 'visible', timeout: 60000 });
        await btn.click();
      }
    }
    await this.page.waitForURL(`**${RoiUrls.plotsListPage}`);
    await NetworkHelper.waitForApiRequestsComplete(this.page, 8000);
    this.logger.success('Navigated to plots list page');
  }

  /**
   * Open filter dialog
   */
  async openFilter(): Promise<void> {
    this.logger.info('Opening filter dialog');
    await this.page.click(RoiSelectors.filterButton);
    // Wait for filter dialog to be visible (Done button appears inside it)
    await this.page.locator(RoiSelectors.filterDoneButton).waitFor({ state: 'visible' });
    this.logger.success('Filter dialog opened');
  }

  /**
   * Select vacant status filter
   */
  async selectVacantFilter(): Promise<void> {
    this.logger.info('Selecting vacant filter option');
    // Vacant is the first status filter button; use starts-with selector to handle
    // data-testid variants like "statuses-div-control-button-0" vs "statuses-div-control-button"
    const statusOptions = await this.page.locator('[data-testid^="statuses-div-control-button"]').all();
    if (statusOptions.length > 0) {
      await statusOptions[0].click();
    } else {
      // Fallback to exact selector for backward compatibility
      await this.page.click(RoiSelectors.vacantFilterOption);
    }
    this.logger.success('Vacant filter selected');
  }

  /**
   * Select reserved status filter
   */
  async selectReservedFilter(): Promise<void> {
    this.logger.info('Selecting reserved filter option');
    // In filter dialog, Reserved is the second status option after Vacant
    const statusOptions = await this.page.locator('[data-testid^="statuses-div-control-button"]').all();
    if (statusOptions.length > 1) {
      await statusOptions[1].click(); // Index 1 is Reserved
      this.logger.success('Reserved filter selected');
    } else {
      throw new Error('Reserved filter option not found');
    }
  }

  /**
   * Select occupied status filter
   */
  async selectOccupiedFilter(): Promise<void> {
    this.logger.info('Selecting occupied filter option');
    await this.page.locator('label').filter({ hasText: 'Occupied' }).click();
    this.logger.success('Occupied filter selected');
  }

  /**
   * Apply filter by clicking Done button
   */
  async applyFilter(): Promise<void> {
    this.logger.info('Applying filter');
    await this.page.click(RoiSelectors.filterDoneButton);
    // Wait for either section toggles (results found) or "No results" message
    const sectionToggles = this.page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').first();
    const noResults = this.page.locator('text=No results').first();
    try {
      await Promise.race([
        sectionToggles.waitFor({ state: 'visible', timeout: 15000 }),
        noResults.waitFor({ state: 'visible', timeout: 15000 }),
      ]);
    } catch {
      // Neither appeared — DOM may still be transitioning, do a final check
      const hasToggles = await sectionToggles.isVisible().catch(() => false);
      if (!hasToggles) {
        throw new Error('Filter applied but no plots found and no "No results" message — project may have no plots matching the filter');
      }
    }
    const hasToggles = await sectionToggles.isVisible().catch(() => false);
    if (!hasToggles) {
      throw new Error('Filter returned no matching plots — project test data may need to be refreshed (0 vacant/filtered plots)');
    }
    this.logger.success('Filter applied');
  }

  /**
   * Expand a section in plots list
   * @param section - Section letter (e.g., 'a', 'b', 'c')
   */
  async expandSection(section: string): Promise<void> {
    this.logger.info(`Expanding section ${section.toUpperCase()}`);
    const selector = RoiSelectors.sectionToggleButton(section);
    // Wait for section button to be visible before clicking (plots may be loading after filter)
    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.page.click(selector);
    // Wait for section expansion animation to complete and plot items to become visible
    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });
    this.logger.success(`Section ${section.toUpperCase()} expanded`);
  }

  /**
   * Expand the first visible section in plots list dynamically
   * This is more robust than hardcoding a section letter
   * @returns The section letter that was expanded
   *
   * Note: API endpoint is already called when filter is applied (applyFilter step),
   * so we don't need to wait for it here. Just find and click the first toggle button.
   */
  async expandFirstSection(): Promise<string> {
    this.logger.info('Expanding first visible section dynamically');

    // Find all section toggle buttons using the correct selector
    const toggleButtons = await this.page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').all();

    if (toggleButtons.length === 0) {
      throw new Error('No section toggle buttons found after filter');
    }

    // Get the first visible button
    const firstButton = toggleButtons[0];
    const testId = await firstButton.getAttribute('data-testid');

    // Extract section letter from data-testid (e.g., "shared-all-plots-button-toggle-a-0" -> "a")
    const sectionMatch = testId?.match(/shared-all-plots-button-toggle-([a-z])-\d+/);
    const sectionLetter = sectionMatch ? sectionMatch[1] : 'unknown';

    this.logger.info(`Found first section: ${sectionLetter.toUpperCase()}`);

    // Click the first section toggle button
    await firstButton.click();
    // Wait for section expansion animation to complete and plot items to become visible
    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });

    this.logger.success(`First section ${sectionLetter.toUpperCase()} expanded`);
    return sectionLetter;
  }

  /**
   * Select a plot by its name
   * @param plotName - Plot name (e.g., 'A B 3')
   */
  async selectPlot(plotName: string): Promise<void> {
    this.logger.info(`Selecting plot: ${plotName}`);

    // Plot items are inside overflow-hidden scroll container — use JS click to bypass visibility checks
    const plotLocator = this.page.getByText(`${plotName} Vacant`, { exact: true })
      .or(this.page.getByText(plotName).first());
    await plotLocator.first().waitFor({ state: 'attached' });
    await plotLocator.first().evaluate(el => (el as HTMLElement).click());

    await this.page.waitForURL(`**${RoiUrls.plotDetailPattern}**`);
    this.logger.success(`Plot ${plotName} selected`);
  }

  /**
   * Get the first vacant plot name from the list without clicking
   * Returns the plot name for direct navigation
   */
  async selectFirstVacantPlot(): Promise<string> {
    this.logger.info('Getting first vacant plot name from the list');
    await this.page.waitForFunction(() => {
      const tree = document.querySelector('[role="tree"]');
      if (!tree) return false;
      const items = tree.querySelectorAll('ul li, [role="list"] [role="listitem"]');
      return Array.from(items).some(item =>
        (item.textContent ?? '').toLowerCase().includes('vacant')
      );
    }, { timeout: 30000 });

    const plotName = await this.page.evaluate(() => {
      const tree = document.querySelector('[role="tree"]');
      if (!tree) return '';
      const items = tree.querySelectorAll('ul li, [role="list"] [role="listitem"]');
      for (const item of Array.from(items)) {
        const text = (item.textContent ?? '').trim();
        if (text.toLowerCase().includes('vacant')) {
          return text.replace(/\s*[Vv]acant\s*$/, '').trim();
        }
      }
      return '';
    });

    if (!plotName) {
      throw new Error('No vacant plots found in the list');
    }

    this.logger.info(`Found first vacant plot: ${plotName}`);
    this.logger.success(`First vacant plot name retrieved: ${plotName}`);
    return plotName;
  }

  /**
   * Get the first reserved plot name from the list and click it
   * Returns the plot name
   */
  async selectFirstReservedPlot(): Promise<string> {
    this.logger.info('Getting first reserved plot name from the list');
    // Wait for at least one reserved plot in the expanded section (items may be overflow-hidden)
    await this.page.getByText(/\w+\s+\w+\s+\d+\s+Reserved$/).first().waitFor({ state: 'attached' });

    // Use getByText to find elements containing "Reserved"
    const reservedPlots = await this.page.getByText(/\w+\s+\w+\s+\d+\s+Reserved$/).all();

    if (reservedPlots.length === 0) {
      throw new Error('No reserved plots found in the list');
    }

    // Get the first plot
    const firstPlot = reservedPlots[0];
    const plotText = await firstPlot.textContent();
    const plotName = plotText?.replace(/\s*Reserved\s*$/, '').trim() || 'Unknown';

    this.logger.info(`Found first reserved plot: ${plotName}`);

    // Click the plot to navigate to plot detail page
    // Plot items are inside overflow-hidden scroll container — use JS click to bypass visibility checks
    await firstPlot.evaluate(el => (el as HTMLElement).click());
    // Wait for navigation to plot detail page to complete
    await this.page.waitForURL('**/plots/**');
    // Wait for plot detail tablist to be visible (page fully loaded)
    await this.page.locator('[role="tablist"]').waitFor({ state: 'visible' });

    this.logger.success(`First reserved plot selected: ${plotName}`);
    return plotName;
  }

  /**
   * Get the first occupied plot name from the list and click it
   * Returns the plot name
   */
  async selectFirstOccupiedPlot(): Promise<string> {
    this.logger.info('Getting first occupied plot from the list');
    // Wait for at least one plot item in the expanded section (items may be overflow-hidden)
    await this.page.locator('[role="treeitem"] li').first().waitFor({ state: 'attached' });

    // Find occupied plots - they show deceased name instead of status
    // Pattern: "A A 1 Ahmad Setiawan" (plot name + deceased name)
    const plotItems = await this.page.locator('[role="treeitem"] li').all();

    if (plotItems.length === 0) {
      throw new Error('No occupied plots found in the list');
    }

    // Get the first plot item
    const firstPlot = plotItems[0];
    const plotText = await firstPlot.textContent();

    this.logger.info(`Found first occupied plot: ${plotText}`);

    // Click the plot to navigate to plot detail page
    // Plot items are inside overflow-hidden scroll container — use JS click to bypass visibility checks
    await firstPlot.evaluate(el => (el as HTMLElement).click());
    // Wait for navigation to plot detail page to complete
    await this.page.waitForURL('**/plots/**');
    // Wait for page to stabilize (tablist to load)
    await this.page.waitForSelector('[role="tablist"]', { state: 'visible' });

    this.logger.success(`First occupied plot selected`);
    return plotText?.trim() || 'Unknown';
  }

  /**
   * Navigate directly to add ROI page for a specific plot
   */
  async navigateToAddRoi(plotName: string): Promise<void> {
    this.logger.info(`Navigating directly to add ROI page for plot: ${plotName}`);
    const encodedPlotName = encodeURIComponent(plotName);

    // Build URL using centralized helper function
    const addRoiUrl = getCustomerOrgUrl(`${encodedPlotName}/manage/add/roi`);

    this.logger.info(`Constructed URL: ${addRoiUrl}`);
    await this.page.goto(addRoiUrl);
    // Wait for ROI form title to appear (form fully loaded)
    await this.page.waitForSelector(RoiSelectors.roiFormTitle, { state: 'visible' });

    this.logger.success(`Navigated to add ROI page for plot: ${plotName}`);
  }

  /**
   * Get current plot status
   */
  async getPlotStatus(): Promise<string> {
    this.logger.info('Getting plot status');
    const statusElement = this.page.locator(RoiSelectors.plotStatusBadge).first();
    await statusElement.waitFor({ state: 'attached', timeout: 10000 });
    // Status is determined by CSS class (reserved/vacant/occupied), not text content
    const className = await statusElement.getAttribute('class') || '';
    let status = '';
    if (className.includes('reserved')) status = 'RESERVED';
    else if (className.includes('occupied')) status = 'OCCUPIED';
    else if (className.includes('vacant') || className.includes('forsale')) status = 'VACANT';
    else {
      // Fallback: try text content
      const text = await statusElement.textContent();
      status = text?.trim() || className;
    }
    this.logger.info(`Current plot status: ${status}`);
    return status;
  }

  /**
   * Verify plot status has changed
   * @param expectedStatus - Expected status (e.g., 'RESERVED')
   */
  async verifyStatusChanged(expectedStatus: string): Promise<boolean> {
    this.logger.info(`Verifying plot status is: ${expectedStatus}`);

    // Wait for API to complete before reading status
    await NetworkHelper.waitForApiEndpoint(this.page, '/details/cemetery/', 15000, { optional: true });
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);

    const currentStatus = await this.getPlotStatus();
    const isCorrect = currentStatus.toUpperCase().includes(expectedStatus.toUpperCase());

    if (isCorrect) {
      this.logger.success(`Plot status verified: ${currentStatus}`);
    } else {
      this.logger.info(`Status mismatch - Expected: ${expectedStatus}, Got: ${currentStatus}`);
    }

    return isCorrect;
  }

  /**
   * Find and select a reserved plot that has a specific certificate number
   * Iterates through all reserved plots in each section, checks ROI tab for matching cert number.
   * @param certificateNumber - Certificate number to search for
   * @returns The plot name that was found and selected
   */
  async findReservedPlotByCertificateNumber(certificateNumber: string): Promise<string> {
    this.logger.info(`Searching for reserved plot with certificate number: ${certificateNumber}`);

    const roiPage = new ROIPage(this.page);

    // Wait for section toggle buttons to appear (plot list loaded after filter)
    await this.page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').first().waitFor({ state: 'visible' });

    // Find all section toggle buttons
    const sectionButtons = await this.page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').all();
    this.logger.info(`Found ${sectionButtons.length} section(s) to scan`);

    for (let s = 0; s < sectionButtons.length; s++) {
      // Re-query section buttons each time (DOM may change after navigation)
      const currentSectionButtons = await this.page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').all();
      if (s >= currentSectionButtons.length) break;

      const sectionBtn = currentSectionButtons[s];
      const testId = await sectionBtn.getAttribute('data-testid');
      const sectionMatch = testId?.match(/shared-all-plots-button-toggle-([a-z])-\d+/);
      const sectionLetter = sectionMatch ? sectionMatch[1] : 'unknown';

      this.logger.info(`Expanding section ${sectionLetter.toUpperCase()}`);
      await sectionBtn.click();
      // Wait for section expansion animation to complete
      await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });

      // Find all reserved plots in this section
      const reservedPlots = await this.page.getByText(/\w+\s+\w+\s+\d+\s+Reserved$/).all();
      this.logger.info(`Found ${reservedPlots.length} reserved plot(s) in section ${sectionLetter.toUpperCase()}`);

      for (let p = 0; p < reservedPlots.length; p++) {
        // Re-query reserved plots (DOM refreshes after back navigation)
        const currentReservedPlots = await this.page.getByText(/\w+\s+\w+\s+\d+\s+Reserved$/).all();
        if (p >= currentReservedPlots.length) break;

        const plot = currentReservedPlots[p];
        const plotText = await plot.textContent();
        const plotName = plotText?.replace(/\s*Reserved\s*$/, '').trim() || 'Unknown';

        this.logger.info(`Checking plot: ${plotName}`);

        // Click the plot to go to detail page
        await plot.click();
        await this.page.waitForURL('**/plots/**');
        await this.page.locator('[role="tablist"]').waitFor({ state: 'visible' });

        // Check certificate number in the ROI tab
        const certNumber = await roiPage.getCertificateNumberFromRoiTab();

        if (certNumber === certificateNumber) {
          this.logger.success(`✓ Found matching plot: ${plotName} with certificate number ${certificateNumber}`);
          return plotName;
        }

        this.logger.info(`Plot ${plotName} has cert "${certNumber}" - not a match, going back`);

        // Go back to plot list
        await this.page.goBack();
        // Wait for plots page to reload — section toggles appear when ready
        await this.page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').first().waitFor({ state: 'visible' });

        // After going back, the section may be collapsed - re-expand it
        const refreshedSectionBtns = await this.page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').all();
        if (s < refreshedSectionBtns.length) {
          // Check if section is already expanded
          const treeItem = refreshedSectionBtns[s].locator('..');
          const isExpanded = await treeItem.locator('..').getAttribute('aria-expanded').catch(() => null);
          if (isExpanded !== 'true') {
            await refreshedSectionBtns[s].click();
            // Wait for section expansion animation to complete
            await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });
          }
        }
      }

      // Collapse this section before moving to next
      const collapseButtons = await this.page.locator('button[data-testid^="shared-all-plots-button-toggle-"]').all();
      if (s < collapseButtons.length) {
        await collapseButtons[s].click();
        await NetworkHelper.waitForAnimation(this.page);
      }
    }

    throw new Error(`No reserved plot found with certificate number "${certificateNumber}"`);
  }
}
