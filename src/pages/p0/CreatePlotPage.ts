import { Page } from '@playwright/test';
import { PlotSelectors, PlotUrls } from '../../selectors/p0/plot.selectors.js';
import { Logger } from '../../utils/Logger.js';
import { getCustomerOrgBaseUrl } from '../../data/test-data.js';

export class CreatePlotPage {
  readonly page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('CreatePlotPage');
  }

  /**
   * Navigate to the Tables section (advance-table with plots tab)
   */
  async navigateToTablesSection(): Promise<void> {
    this.logger.info('Navigating to Tables section');
    const baseUrl = getCustomerOrgBaseUrl();
    const tablesUrl = `${baseUrl}${PlotUrls.advanceTable}`;
    await this.page.goto(tablesUrl, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(3000);
    this.logger.success('Navigated to Tables section');
  }

  /**
   * Click the ADD PLOT button to navigate to the add plot form
   */
  async clickAddPlot(): Promise<void> {
    this.logger.info('Clicking ADD PLOT button');
    await this.page.waitForSelector(PlotSelectors.addPlotButton, { state: 'visible', timeout: 10000 });
    await this.page.locator(PlotSelectors.addPlotButton).click();
    await this.page.waitForURL(`**${PlotUrls.addPlotPattern}**`, { timeout: 15000 });
    await this.page.waitForTimeout(2000);
    this.logger.success('Navigated to Add Plot form');
  }

  /**
   * Fill the add plot form with the given details
   */
  async fillAddPlotForm(details: {
    cemetery?: string;
    section?: string;
    row?: string;
    number?: string;
    status?: string;
    plotType?: string;
    direction?: string;
    price?: string;
    burialCapacity?: string;
    notes?: string;
  }): Promise<void> {
    this.logger.info('Filling Add Plot form');

    // Cemetery (mat-select with aria-label) — only present on multi-cemetery orgs
    if (details.cemetery) {
      this.logger.info(`Selecting cemetery: ${details.cemetery}`);
      const cemeterySelect = this.page.locator(PlotSelectors.cemeterySelect);
      const count = await cemeterySelect.count();
      if (count > 0) {
        await cemeterySelect.click();
        await this.page.waitForTimeout(800);
        await this.page.locator('mat-option').filter({ hasText: details.cemetery }).first().click();
        await this.page.waitForTimeout(500);
      } else {
        this.logger.info('Cemetery select not found — skipping (single-cemetery org)');
      }
    }

    // Section — autocomplete input; wait for it to become enabled (sections load via API)
    if (details.section) {
      this.logger.info(`Filling section: ${details.section}`);
      const sectionInput = this.page.locator(PlotSelectors.sectionInput);

      if (await sectionInput.count() > 0) {
        // Wait up to 15s for section input to become enabled (API must return sections first)
        await this.page.waitForFunction(
          (testid) => {
            const el = document.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement | null;
            return el !== null && !el.disabled;
          },
          'plot-add-input-type-your-section-name',
          { timeout: 15000 }
        ).catch(() => this.logger.info('Section input still disabled — continuing anyway'));

        await sectionInput.click({ timeout: 5000 }).catch(() => this.logger.info('Section click timed out'));
        await sectionInput.fill(details.section);
        await this.page.waitForTimeout(800);
        const suggestion = this.page.locator('mat-option').filter({ hasText: details.section }).first();
        if (await suggestion.count() > 0) {
          await suggestion.click();
        } else {
          await sectionInput.press('Enter');
        }
      } else {
        this.logger.info('Section field not found — skipping');
      }
      await this.page.waitForTimeout(300);
    }

    // Row — simple text input
    if (details.row) {
      this.logger.info(`Filling row: ${details.row}`);
      const rowInput = this.page.getByLabel('Row', { exact: false });
      const rowByTestid = this.page.locator(PlotSelectors.rowInput);
      if (await rowInput.count() > 0) {
        await rowInput.first().fill(details.row);
      } else if (await rowByTestid.count() > 0) {
        await rowByTestid.fill(details.row);
      }
    }

    // Number — simple text input
    if (details.number) {
      this.logger.info(`Filling number: ${details.number}`);
      const numInput = this.page.getByLabel('Number', { exact: false });
      const numByTestid = this.page.locator(PlotSelectors.numberInput);
      if (await numInput.count() > 0) {
        await numInput.first().fill(details.number);
      } else if (await numByTestid.count() > 0) {
        await numByTestid.fill(details.number);
      }
    }

    // Status (required) — mat-select by accessible label
    if (details.status) {
      this.logger.info(`Selecting status: ${details.status}`);
      const statusSelect = this.page.getByLabel('Status', { exact: false });
      if (await statusSelect.count() > 0) {
        await statusSelect.first().click();
      } else {
        await this.page.locator('mat-select').nth(0).click();
      }
      await this.page.waitForTimeout(600);
      await this.page.locator('mat-option').filter({ hasText: details.status }).first().click();
      await this.page.waitForTimeout(400);
    }

    // Plot type (required) — mat-select by accessible label
    if (details.plotType) {
      this.logger.info(`Selecting plot type: ${details.plotType}`);
      const plotTypeSelect = this.page.getByLabel('Plot type', { exact: false });
      if (await plotTypeSelect.count() > 0) {
        await plotTypeSelect.first().click();
      } else {
        await this.page.locator('mat-select').nth(1).click();
      }
      await this.page.waitForTimeout(600);
      await this.page.locator('mat-option').filter({ hasText: details.plotType }).first().click();
      await this.page.waitForTimeout(400);
    }

    // Direction (optional) — mat-select by accessible label
    if (details.direction) {
      this.logger.info(`Selecting direction: ${details.direction}`);
      const directionSelect = this.page.getByLabel('Direction', { exact: false });
      if (await directionSelect.count() > 0) {
        await directionSelect.first().click();
        await this.page.waitForTimeout(600);
        await this.page.locator('mat-option').filter({ hasText: details.direction }).first().click();
        await this.page.waitForTimeout(400);
      }
    }

    // Price
    if (details.price) {
      this.logger.info(`Filling price: ${details.price}`);
      await this.page.locator('mat-form-field:has(mat-label:has-text("Price")) input').fill(details.price);
    }

    // Burial capacity (ensures total > 0 which is needed for submission)
    if (details.burialCapacity) {
      this.logger.info(`Setting burial capacity: ${details.burialCapacity}`);
      const burialsInputs = await this.page.locator(PlotSelectors.burialsInput).all();
      if (burialsInputs.length > 0) {
        await burialsInputs[0].click({ clickCount: 3 });
        await burialsInputs[0].fill(details.burialCapacity);
        await this.page.waitForTimeout(300);
      }
    }

    // Notes
    if (details.notes) {
      this.logger.info(`Adding notes: ${details.notes}`);
      await this.page.locator(PlotSelectors.addNotesInput).fill(details.notes);
    }

    this.logger.success('Add Plot form filled');
  }

  /**
   * Save the new plot and wait for navigation back to the plots table
   * The add form URL is: /advance-table/manage/add/plot/{id}
   * The table URL is:    /advance-table?tab=plots
   */
  async saveNewPlot(): Promise<void> {
    this.logger.info('Saving new plot');
    const saveBtn = this.page.locator(PlotSelectors.saveButton);
    await saveBtn.scrollIntoViewIfNeeded();

    // Set up URL change listener BEFORE clicking (tab=plots is unique to the table page)
    const navigationPromise = this.page.waitForURL(
      (url) => {
        const href = url.href;
        return href.includes('advance-table') && (href.includes('tab=') || !href.includes('manage'));
      },
      { timeout: 25000 }
    );

    // Regular click - Angular form submit button
    await saveBtn.click();

    try {
      await navigationPromise;
    } catch {
      // Fallback: try JS click in case Angular change detection didn't fire
      this.logger.info('Regular click did not navigate — trying JS click fallback');
      await saveBtn.evaluate((el: HTMLElement) => el.click());
      await this.page.waitForURL(
        (url) => {
          const href = url.href;
          return href.includes('advance-table') && (href.includes('tab=') || !href.includes('manage'));
        },
        { timeout: 15000 }
      ).catch(() => {
        // Check for validation errors
        void this.page.locator('mat-error').allTextContents().then(errors => {
          if (errors.some(e => e.trim())) {
            this.logger.error(`Form validation errors: ${errors.filter(e => e.trim()).join(', ')}`);
          }
        });
        throw new Error('Save did not navigate back to plots table after both regular and JS click');
      });
    }

    await this.page.waitForTimeout(2000);
    this.logger.success('New plot saved, navigated back to plots table');
  }

  /**
   * Verify that a plot with the given ID appears in the plots table.
   * Waits for the table to load and checks all visible plot ID cells.
   * @param plotId - Plot ID string (e.g., 'A Z 99')
   */
  async verifyPlotInTable(plotId: string): Promise<boolean> {
    this.logger.info(`Verifying plot "${plotId}" appears in table`);

    // Wait for the table to populate (at least one row visible)
    try {
      await this.page.waitForSelector('[data-testid*="content-wrapper-div-plot-id"]', { state: 'visible', timeout: 15000 });
    } catch {
      this.logger.info('No plot rows found — table may still be loading');
    }
    await this.page.waitForTimeout(1000);

    const plotCells = await this.page.locator('[data-testid*="content-wrapper-div-plot-id"]').allTextContents();
    const found = plotCells.some(cell => cell.includes(plotId));

    if (found) {
      this.logger.success(`Plot "${plotId}" found in table`);
    } else {
      this.logger.info(`Plot "${plotId}" not found in first ${plotCells.length} rows.`);
      // Also check if the page has an API confirming plot creation
      // (new plots appear at the top of the table sorted by newest)
    }
    return found;
  }

  /**
   * Get the expected plot ID from form details
   */
  getExpectedPlotId(section: string, row: string, number: string): string {
    return `${section} ${row} ${number}`;
  }

  // ===== Edit Plot methods =====

  /**
   * Click the Edit Plot button on the plot detail view
   */
  async clickEditPlot(): Promise<void> {
    this.logger.info('Clicking Edit Plot button');
    const editBtn = this.page.locator(PlotSelectors.editPlotButton);
    await editBtn.waitFor({ state: 'visible', timeout: 10000 });
    await editBtn.evaluate((el: HTMLElement) => el.click());
    await this.page.waitForURL(`**${PlotUrls.editPlotPattern}**`, { timeout: 15000 });
    await this.page.waitForTimeout(2000);
    this.logger.success('Navigated to Edit Plot form');
  }

  /**
   * Fill the edit plot form with updated details
   */
  async fillEditPlotForm(details: {
    status?: string;
    plotType?: string;
    burialCapacity?: string;
    entombmentCapacity?: string;
    cremationCapacity?: string;
    price?: string;
    headstoneInscription?: string;
    notes?: string;
  }): Promise<void> {
    this.logger.info('Filling Edit Plot form');

    if (details.burialCapacity) {
      this.logger.info(`Setting burial capacity: ${details.burialCapacity}`);
      const burialsInput = this.page.locator(PlotSelectors.editBurialCapacityInput);
      await burialsInput.click({ clickCount: 3 });
      await burialsInput.fill(details.burialCapacity);
      await this.page.waitForTimeout(300);
    }

    if (details.entombmentCapacity) {
      const entombInput = this.page.locator(PlotSelectors.editEntombmentCapacityInput);
      await entombInput.click({ clickCount: 3 });
      await entombInput.fill(details.entombmentCapacity);
    }

    if (details.cremationCapacity) {
      const cremInput = this.page.locator(PlotSelectors.editCremationCapacityInput);
      await cremInput.click({ clickCount: 3 });
      await cremInput.fill(details.cremationCapacity);
    }

    if (details.price) {
      this.logger.info(`Setting price: ${details.price}`);
      const priceInput = this.page.locator(PlotSelectors.editPriceInput);
      await priceInput.click({ clickCount: 3 });
      await priceInput.fill(details.price);
    }

    if (details.headstoneInscription) {
      this.logger.info(`Setting headstone inscription: ${details.headstoneInscription}`);
      await this.page.locator(PlotSelectors.editHeadstoneInput).fill(details.headstoneInscription);
    }

    if (details.notes) {
      this.logger.info(`Adding notes: ${details.notes}`);
      await this.page.locator(PlotSelectors.editNotesInput).fill(details.notes);
    }

    this.logger.success('Edit Plot form filled');
  }

  /**
   * Save the edited plot and wait for navigation back to plot detail
   */
  async savePlotChanges(): Promise<void> {
    this.logger.info('Saving plot changes');
    const saveBtn = this.page.locator(PlotSelectors.editSaveButton);
    await saveBtn.scrollIntoViewIfNeeded();
    await saveBtn.evaluate((el: HTMLElement) => el.click());
    // After saving, navigate back to plot detail or plots list
    await this.page.waitForURL('**/plots/**', { timeout: 20000 });
    await this.page.waitForTimeout(2000);
    this.logger.success('Plot changes saved');
  }

  /**
   * Get the current plot ID from the detail page
   */
  async getPlotId(): Promise<string> {
    const plotIdEl = this.page.locator(PlotSelectors.plotIdHeading).first();
    const plotId = await plotIdEl.textContent();
    return plotId?.trim() || '';
  }

  // ===== Scenario: Edit plot from MAP page =====

  /**
   * Navigate to the cemetery map page (cemetery detail page with Leaflet map)
   */
  async navigateToCemeteryMapPage(): Promise<void> {
    this.logger.info('Navigating to cemetery map page');
    const { getCustomerOrgBaseUrl, CEMETERY_CONFIG, BASE_CONFIG } = await import('../../data/test-data.js');
    const cemeterySlug = `${CEMETERY_CONFIG.uniqueName}_${BASE_CONFIG.region}`;
    const url = `${getCustomerOrgBaseUrl()}/customer-organization/${cemeterySlug}`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(3000);
    this.logger.success('Navigated to cemetery map page');
  }

  /**
   * Search for a plot on the cemetery map page and click the first result
   * Navigates to the plot detail view page
   */
  async searchAndSelectPlotOnMap(plotName: string): Promise<void> {
    this.logger.info(`Searching for plot "${plotName}" on map`);
    const searchInput = this.page.locator(PlotSelectors.mapSearchInput);
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.click();
    await searchInput.fill(plotName);
    await this.page.waitForTimeout(1500);

    const firstResult = this.page.locator(PlotSelectors.mapSearchResultItem).first();
    await firstResult.waitFor({ state: 'visible', timeout: 10000 });
    await firstResult.click();
    await this.page.waitForURL(`**${PlotUrls.plotDetailPattern}**`, { timeout: 15000 });
    await this.page.waitForTimeout(2000);
    this.logger.success(`Plot "${plotName}" found and selected from map`);
  }

  /**
   * Click the Edit button on the plot detail view page (accessed from map or plots list)
   */
  async clickEditFromPlotDetail(): Promise<void> {
    this.logger.info('Clicking Edit button from plot detail view');
    const editBtn = this.page.locator(PlotSelectors.plotDetailEditButton);
    await editBtn.waitFor({ state: 'visible', timeout: 10000 });
    await editBtn.click();
    await this.page.waitForURL(`**${PlotUrls.editPlotPattern}**`, { timeout: 15000 });
    await this.page.waitForTimeout(2000);
    this.logger.success('Navigated to Edit Plot form from detail view');
  }

  // ===== Scenario: Delete plot from table =====

  /**
   * Click the first plot row in the advance-table to open the edit page
   */
  async clickFirstTableRow(): Promise<string> {
    this.logger.info('Clicking first plot row in table');
    const firstRow = this.page.locator(PlotSelectors.tableRow).first();
    await firstRow.waitFor({ state: 'visible', timeout: 10000 });
    // Get the plot ID text from the row
    const plotIdCell = firstRow.locator('[data-testid*="content-wrapper-div-plot-id"]').first();
    const plotId = ((await plotIdCell.textContent().catch(() => '')) || '').trim();
    await firstRow.click();
    await this.page.waitForURL(`**${PlotUrls.editPlotPattern}**`, { timeout: 15000 });
    await this.page.waitForTimeout(2000);
    this.logger.success(`Opened edit page for plot "${plotId}"`);
    return plotId;
  }

  /**
   * Get the plot ID shown on the edit page subtitle (e.g. "Astana Tegal Gundul - A Z 4086")
   */
  async getPlotIdFromEditPage(): Promise<string> {
    const subtitleEl = this.page.locator('h6, [class*="subtitle"], a[href*="/plots/"]').first();
    const text = ((await subtitleEl.textContent().catch(() => '')) || '').trim();
    // Extract the plot ID from format "Cemetery Name - A Z 4086"
    const match = text.match(/[A-Z]\s+[A-Z]\s+\d+/);
    return match ? match[0] : text;
  }

  /**
   * Click the MORE (⋮) button on the edit page
   */
  async clickMoreOptionsMenu(): Promise<void> {
    this.logger.info('Clicking MORE options menu');
    const moreBtn = this.page.locator(PlotSelectors.editMoreButton);
    await moreBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moreBtn.click();
    await this.page.waitForTimeout(800);
    this.logger.success('MORE menu opened');
  }

  /**
   * Click Delete from the MORE menu
   */
  async clickDeletePlot(): Promise<void> {
    this.logger.info('Clicking Delete from MORE menu');
    const deleteItem = this.page.locator(PlotSelectors.deletePlotMenuItem);
    await deleteItem.waitFor({ state: 'visible', timeout: 5000 });
    await deleteItem.click();
    await this.page.waitForTimeout(1000);
    this.logger.success('Delete option clicked');
  }

  /**
   * Confirm the delete dialog (or handle immediate deletion with no dialog)
   */
  async confirmDeletePlot(): Promise<void> {
    this.logger.info('Handling post-delete state');
    // Chronicle deletes immediately without a confirmation dialog.
    // After clicking Delete in the MORE menu, the app navigates back to the table.
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/manage/edit/plot')) {
      this.logger.success('Plot deleted immediately — no confirmation dialog needed');
      return;
    }
    // Fallback: if still on edit page, look for a dialog confirm button
    const confirmBtn = this.page.locator(
      '[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Yes")'
    ).first();
    const visible = await confirmBtn.isVisible().catch(() => false);
    if (visible) {
      await confirmBtn.click();
      await this.page.waitForURL(`**advance-table**`, { timeout: 10000 });
    }
    await this.page.waitForTimeout(1000);
    this.logger.success('Plot deletion confirmed');
  }

  /**
   * Verify that a plot is no longer visible in the advance-table
   */
  async verifyPlotRemovedFromTable(plotId: string): Promise<boolean> {
    this.logger.info(`Verifying plot "${plotId}" is removed from table`);
    await this.page.waitForTimeout(2000);
    const allCells = await this.page.locator('[data-testid*="content-wrapper-div-plot-id"]').allTextContents();
    const found = allCells.some(text => text.includes(plotId));
    if (!found) {
      this.logger.success(`Plot "${plotId}" confirmed removed from table`);
    } else {
      this.logger.info(`Plot "${plotId}" still found in table — may be on a later page`);
    }
    return !found;
  }

  // ===== Scenario: View plot detail from table =====

  /**
   * Verify the edit page is loaded after clicking a table row
   */
  async verifyEditPageLoaded(): Promise<void> {
    const url = this.page.url();
    if (!url.includes(PlotUrls.editPlotPattern)) {
      throw new Error(`Expected edit page URL but got: ${url}`);
    }
    // Wait for the MORE button (reliable indicator the edit page is fully loaded)
    await this.page.locator(PlotSelectors.editMoreButton).waitFor({ state: 'visible', timeout: 10000 });
    this.logger.success(`Edit page loaded: ${url}`);
  }

  /**
   * Get the plot subtitle info from edit page (Cemetery Name - Plot ID)
   */
  async getEditPagePlotSubtitle(): Promise<string> {
    // The subtitle link shows the plot ID (e.g., "A Z 4086" as a link)
    const linkEl = this.page.locator('[data-testid="toolbar-manage-a"], [data-testid="toolbar-manage-a-1"]').first();
    const text = ((await linkEl.textContent().catch(() => '')) || '').trim();
    return text;
  }
}
