import { Page } from '@playwright/test';
import { RoiSelectors, RoiUrls, PlotStatus } from '../../selectors/p0/roi.selectors.js';
import { Logger } from '../../utils/Logger.js';

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
    this.logger.info('Clicking "See all Plots" button');
    await this.page.click(RoiSelectors.seeAllPlotsButton);
    await this.page.waitForURL(`**${RoiUrls.plotsListPage}`, { timeout: 10000 });
    this.logger.success('Navigated to plots list page');
  }

  /**
   * Open filter dialog
   */
  async openFilter(): Promise<void> {
    this.logger.info('Opening filter dialog');
    await this.page.click(RoiSelectors.filterButton);
    await this.page.waitForTimeout(1000); // Wait for dialog animation
    this.logger.success('Filter dialog opened');
  }

  /**
   * Select vacant status filter
   */
  async selectVacantFilter(): Promise<void> {
    this.logger.info('Selecting vacant filter option');
    await this.page.click(RoiSelectors.vacantFilterOption);
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
      await this.page.waitForTimeout(500);
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
    await this.page.waitForTimeout(500);
    this.logger.success('Occupied filter selected');
  }

  /**
   * Apply filter by clicking Done button
   */
  async applyFilter(): Promise<void> {
    this.logger.info('Applying filter');
    await this.page.click(RoiSelectors.filterDoneButton);
    await this.page.waitForTimeout(2000); // Wait for filter to apply
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
    await this.page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
    await this.page.click(selector);
    await this.page.waitForTimeout(1000); // Wait for expansion animation
    this.logger.success(`Section ${section.toUpperCase()} expanded`);
  }

  /**
   * Expand the first visible section in plots list dynamically
   * This is more robust than hardcoding a section letter
   * @returns The section letter that was expanded
   */
  async expandFirstSection(): Promise<string> {
    this.logger.info('Expanding first visible section dynamically');
    
    // Wait for section toggle buttons to be visible after filter
    await this.page.waitForTimeout(2000);
    
    // Find all section toggle buttons that match the pattern
    // Pattern: [data-testid="perfect-scrollbar-button-toggle-{section}-0"]
    const toggleButtons = await this.page.locator('button[data-testid^="perfect-scrollbar-button-toggle-"]').all();
    
    if (toggleButtons.length === 0) {
      throw new Error('No section toggle buttons found after filter');
    }
    
    // Get the first visible button
    const firstButton = toggleButtons[0];
    const testId = await firstButton.getAttribute('data-testid');
    
    // Extract section letter from data-testid (e.g., "perfect-scrollbar-button-toggle-a-0" -> "a")
    const sectionMatch = testId?.match(/perfect-scrollbar-button-toggle-([a-z])-\d+/);
    const sectionLetter = sectionMatch ? sectionMatch[1] : 'unknown';
    
    this.logger.info(`Found first section: ${sectionLetter.toUpperCase()}`);
    
    // Click the first section toggle button
    await firstButton.click();
    await this.page.waitForTimeout(1000); // Wait for expansion animation
    
    this.logger.success(`First section ${sectionLetter.toUpperCase()} expanded`);
    return sectionLetter;
  }

  /**
   * Select a plot by its name
   * @param plotName - Plot name (e.g., 'A B 3')
   */
  async selectPlot(plotName: string): Promise<void> {
    this.logger.info(`Selecting plot: ${plotName}`);
    // Wait for plots to load
    await this.page.waitForTimeout(2000);
    
    // Try multiple selectors to find the plot
    try {
      // First try: exact match with status (most reliable)
      await this.page.getByText(`${plotName} Vacant`, { exact: true }).click({ timeout: 5000 });
    } catch (e1) {
      try {
        // Second try: contains text
        await this.page.getByText(plotName).first().click({ timeout: 5000 });
      } catch (e2) {
        // Third try: use role button with plot name
        await this.page.locator(`button:has-text("${plotName}")`).first().click({ timeout: 5000 });
      }
    }
    
    await this.page.waitForURL(`**${RoiUrls.plotDetailPattern}**`, { timeout: 10000 });
    this.logger.success(`Plot ${plotName} selected`);
  }

  /**
   * Get the first vacant plot name from the list without clicking
   * Returns the plot name for direct navigation
   */
  async selectFirstVacantPlot(): Promise<string> {
    this.logger.info('Getting first vacant plot name from the list');
    // Wait for plots to load
    await this.page.waitForTimeout(3000);
    
    // Use getByText to find elements containing "Vacant"
    const vacantPlots = await this.page.getByText(/\w+\s+\w+\s+\d+\s+Vacant$/).all();
    
    if (vacantPlots.length === 0) {
      throw new Error('No vacant plots found in the list');
    }
    
    // Get the first plot
    const firstPlot = vacantPlots[0];
    const plotText = await firstPlot.textContent();
    const plotName = plotText?.replace(/\s*Vacant\s*$/, '').trim() || 'Unknown';
    
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
    // Wait for plots to load
    await this.page.waitForTimeout(3000);
    
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
    await firstPlot.click();
    await this.page.waitForTimeout(3000);
    
    this.logger.success(`First reserved plot selected: ${plotName}`);
    return plotName;
  }

  /**
   * Get the first occupied plot name from the list and click it
   * Returns the plot name
   */
  async selectFirstOccupiedPlot(): Promise<string> {
    this.logger.info('Getting first occupied plot from the list');
    // Wait for plots to load
    await this.page.waitForTimeout(3000);
    
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
    await firstPlot.click();
    await this.page.waitForTimeout(3000);
    
    this.logger.success(`First occupied plot selected`);
    return plotText?.trim() || 'Unknown';
  }

  /**
   * Navigate directly to add ROI page for a specific plot
   */
  async navigateToAddRoi(plotName: string): Promise<void> {
    this.logger.info(`Navigating directly to add ROI page for plot: ${plotName}`);
    const encodedPlotName = encodeURIComponent(plotName);
    // URL format as per user's example: /customer-organization/{org}/{plotName}/manage/add/roi
    const addRoiUrl = `https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/${encodedPlotName}/manage/add/roi`;
    
    await this.page.goto(addRoiUrl);
    // Wait for ROI form to fully load and initialize
    await this.page.waitForTimeout(7000);
    
    this.logger.success(`Navigated to add ROI page for plot: ${plotName}`);
  }

  /**
   * Get current plot status
   */
  async getPlotStatus(): Promise<string> {
    this.logger.info('Getting plot status');
    const statusElement = await this.page.locator(RoiSelectors.plotStatusBadge).first();
    const status = await statusElement.textContent();
    this.logger.info(`Current plot status: ${status}`);
    return status?.trim() || '';
  }

  /**
   * Verify plot status has changed
   * @param expectedStatus - Expected status (e.g., 'RESERVED')
   */
  async verifyStatusChanged(expectedStatus: string): Promise<boolean> {
    this.logger.info(`Verifying plot status is: ${expectedStatus}`);
    const currentStatus = await this.getPlotStatus();
    const isCorrect = currentStatus.toUpperCase() === expectedStatus.toUpperCase();
    
    if (isCorrect) {
      this.logger.success(`Plot status verified: ${currentStatus}`);
    } else {
      this.logger.info(`Status mismatch - Expected: ${expectedStatus}, Got: ${currentStatus}`);
    }
    
    return isCorrect;
  }
}
