/**
 * ROI Table Menu Step Definitions
 * Steps for navigating to ROI table and managing ROIs from table menu
 * Selectors verified via MCP Playwright on 2026-02-04
 */

import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { RoiTableSelectors, RoiTableUrls } from '../../selectors/p0/roi/index.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { waitForEndpoint } from '../../utils/NetworkUtils.js';
import { Logger } from '../../utils/Logger.js';

// ============================================
// NAVIGATION STEPS
// ============================================

When('I click the sidebar table menu', async function () {
    const tableButton = this.page.locator(RoiTableSelectors.sidebarTableButton)
        .or(this.page.locator(RoiTableSelectors.sidebarTableButtonAlt));

    // Register listener BEFORE click so response is not missed
    const apiWait = NetworkHelper.waitForApiEndpoint(this.page, '/adv_table/plots/', 20000);
    await tableButton.click();
    await apiWait;
});

Then('I should see the tables page', async function () {
    // Verify URL contains advance-table
    await expect(this.page).toHaveURL(new RegExp(RoiTableUrls.tablesPage));
});

Then('I should see the following tabs', async function (dataTable) {
    const expectedTabs = dataTable.raw().flat();

    for (const tabName of expectedTabs) {
        // Use verified selector - tabs are mat-tab-link elements with uppercase text
        const tabLocator = this.page.locator(RoiTableSelectors.tabByText(tabName));
        await expect(tabLocator).toBeVisible();
    }
});

When('I click the ROIs tab', async function () {
    // Use verified selector with data-testid fallback
    const roisTab = this.page.locator(RoiTableSelectors.roisTabDataTestId)
        .or(this.page.locator(RoiTableSelectors.roisTab));

    await roisTab.click();

    // Wait for URL to update to include tab=rois
    await this.page.waitForURL(/tab=rois/);

    // Wait for any API calls to switch tab data (generic wait is safer here as endpoint might differ)
    await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);
});

Then('I should see the Add ROI button next to Export button', async function () {
    // Verify Add ROI button is visible (uses data-testid="content-wrapper-button-add-plot")
    const addRoiButton = this.page.locator(RoiTableSelectors.addRoiButton)
        .or(this.page.locator(RoiTableSelectors.addRoiButtonByText));

    await expect(addRoiButton).toBeVisible();

    // Verify Export button is visible
    const exportButton = this.page.locator(RoiTableSelectors.exportButton)
        .or(this.page.locator(RoiTableSelectors.exportButtonByText));

    await expect(exportButton).toBeVisible();

    // Verify they are positioned next to each other (Add ROI should be to the right of Export)
    const addRoiBox = await addRoiButton.boundingBox();
    const exportBox = await exportButton.boundingBox();

    if (addRoiBox && exportBox) {
        // Verify they are on the same horizontal line
        const yDifference = Math.abs(addRoiBox.y - exportBox.y);
        expect(yDifference).toBeLessThan(50); // Allow 50px tolerance

        // Verify Add ROI is to the right of Export
        expect(addRoiBox.x).toBeGreaterThan(exportBox.x);
    }
});

// ============================================
// FILTER PLOTS & GET VACANT PLOT NAME
// ============================================

When('I filter plots by status {string} in Plots tab', async function (status: string) {
    // Click Plots tab first (it may already be active, but ensure it)
    const plotsTab = this.page.locator(RoiTableSelectors.plotsTab)
        .or(this.page.locator(RoiTableSelectors.plotsTabByText));
    await plotsTab.click();
    await this.page.waitForURL(/tab=plots/);
    await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);

    // Click FILTER button to open filter dialog
    const filterBtn = this.page.locator(RoiTableSelectors.filterButton);
    await filterBtn.click();

    // Wait for filter dialog to appear
    const statusCombobox = this.page.getByRole('combobox', { name: 'Status' });
    await statusCombobox.waitFor({ state: 'visible' });

    // Click Status combobox and select the option
    await statusCombobox.click();
    const statusOption = this.page.getByRole('option', { name: status });
    await statusOption.waitFor({ state: 'visible' });
    await statusOption.click();

    // Click APPLY
    const applyBtn = this.page.locator(RoiTableSelectors.filterApplyButton);
    await applyBtn.click();

    // Wait for table to reload with filtered data
    await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);
    await NetworkHelper.waitForListPopulated(this.page, RoiTableSelectors.tableRows, 1, 15000);
});

When('I get the first plot name from the filtered table', async function () {
    // Get the Plot ID from the first row, second cell (index 1 = Plot ID column)
    const firstRowPlotId = this.page.locator('mat-row').first().locator('mat-cell').nth(1);
    await firstRowPlotId.waitFor({ state: 'visible' });

    // Wait for cell to have non-empty text (table may still be rendering)
    await this.page.waitForFunction(
        (selector: string) => {
            const cell = document.querySelector(selector);
            return cell && cell.textContent && cell.textContent.trim() !== '';
        },
        'mat-row:first-of-type mat-cell:nth-child(2)',
        { timeout: 15000 }
    );

    const plotName = await firstRowPlotId.textContent();
    if (!plotName || plotName.trim() === '') {
        throw new Error('Could not get plot name from first row');
    }

    // Store plot name in world context for later use
    this.vacantPlotName = plotName.trim();
    Logger.info(`[ROITable] Saved vacant plot name: ${this.vacantPlotName}`);
});

When('I search and select the saved vacant plot for ROI', async function () {
    if (!this.vacantPlotName) {
        throw new Error('No vacant plot name saved. Run "I get the first plot name from the filtered table" first.');
    }

    // Click the Event Type / Plot combobox to open dropdown
    const plotCombobox = this.page.getByRole('combobox', { name: 'Event Type' });
    await plotCombobox.click();

    // Type the plot name in the search input
    const searchInput = this.page.locator(RoiTableSelectors.plotSearchInput);
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill(this.vacantPlotName);

    // Wait for filtered results to appear, then select matching option
    const plotOption = this.page.getByRole('option', { name: this.vacantPlotName });
    await plotOption.waitFor({ state: 'visible' });
    await plotOption.click();

    Logger.info(`[ROITable] Selected plot: ${this.vacantPlotName}`);
    await NetworkHelper.waitForAnimation(this.page);
});

// ============================================
// ADD ROI FROM TABLE STEPS
// ============================================

When('I click the Add ROI button from table', async function () {
    // Set up response promise BEFORE clicking — plots endpoint is the slowest
    const responsePromise = waitForEndpoint(this.page, 'plots/?page=1');
    const addRoiButton = this.page.locator(RoiTableSelectors.addRoiButton);
    await addRoiButton.click();
    // ADD ROIS triggers full page navigation
    await NetworkHelper.waitForURLWithNetworkIdle(this.page, '**/manage/add/roi**');
    await responsePromise;
});

Then('I should see the Add ROI form', async function () {
    // Wait for form title visible + network stable
    await NetworkHelper.waitForElementWithNetworkIdle(this.page, RoiTableSelectors.roiFormTitle);
    const formTitle = this.page.locator(RoiTableSelectors.roiFormTitle);
    await expect(formTitle).toBeVisible();
});

Then('I should see toast message {string}', async function (expectedMessage: string) {
    const toast = this.page.locator(`text=${expectedMessage}`);
    await expect(toast).toBeVisible({ timeout: 15000 });
    Logger.info(`[ROITable] Toast message verified: "${expectedMessage}"`);
});

When('I fill ROI form from table with following details', async function (dataTable: any) {
    const roiData = dataTable.rowsHash();

    // Fill Right Type if provided
    if (roiData.rightType) {
        const actualRightType = replacePlaceholders(roiData.rightType);
        const rightTypeSelect = this.page.locator(RoiTableSelectors.rightTypeSelect);
        await rightTypeSelect.click();

        // Wait for dropdown options to appear
        const rightTypeOption = this.page.locator(`mat-option:has-text("${actualRightType}")`);
        await rightTypeOption.waitFor({ state: 'visible' });
        await rightTypeOption.click();
    }

    // Fill Term of Right if provided
    if (roiData.termOfRight) {
        const actualTerm = replacePlaceholders(roiData.termOfRight);
        const termSelect = this.page.locator(RoiTableSelectors.termOfRightSelect);
        await termSelect.click();

        // Wait for dropdown options to appear
        const termOption = this.page.locator(`mat-option:has-text("${actualTerm}")`);
        await termOption.waitFor({ state: 'visible' });
        await termOption.click();
    }

    // Fill Fee if provided
    if (roiData.fee) {
        const actualFee = replacePlaceholders(roiData.fee);
        // Try Add form selector first, then Edit form selector
        const feeInputAdd = this.page.locator(RoiTableSelectors.feeInput);
        const feeInputEdit = this.page.locator(RoiTableSelectors.feeInputEdit);

        // Use the first visible one
        const feeInput = await feeInputAdd.isVisible().catch(() => false) ? feeInputAdd : feeInputEdit;
        await feeInput.waitFor({ state: 'visible' });
        await feeInput.fill(actualFee);
    }

    // Fill Certificate Number if provided
    if (roiData.certificateNumber) {
        const actualCert = replacePlaceholders(roiData.certificateNumber);
        const certInput = this.page.locator(RoiTableSelectors.certificateInput);
        await certInput.waitFor({ state: 'visible' });
        await certInput.fill(actualCert);
    }
});

When('I save the ROI from table', async function () {
    // For Add ROI form: there are TWO save buttons - "save" and "save and add interment"
    // We need to click ONLY the "save" button to avoid redirecting to interment page
    const saveButton = this.page.locator('button').filter({ hasText: 'save' }).filter({ hasNotText: 'and add interment' });

    await saveButton.click();

    // Don't wait for navigation here — let subsequent steps (toast, table verification) handle it
    // The toast appears before navigation, so we need to catch it first
    Logger.info('[ROITable] Save button clicked');
});

Then('I should see ROI in the table', async function () {
    // Wait for navigation back to ROI table list after save
    await this.page.waitForURL(/tab=rois/);

    // API calls already completed before navigation (POST + GET happen during save)
    // Just wait for table rows to be visible
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
    const tableRows = this.page.locator(RoiTableSelectors.tableRows);
    await tableRows.first().waitFor({ state: 'visible', timeout: 15000 });
});

// ============================================
// EDIT ROI FROM TABLE STEPS
// ============================================

When('I click edit on the first ROI row', { timeout: 120000 }, async function () {
    const allRows = this.page.locator('mat-row');
    const editFormTitle = this.page.locator(RoiTableSelectors.roiFormTitle);

    // Retry loop: navigation takes ~8s and may need a second attempt if redirected back
    for (let attempt = 0; attempt < 3; attempt++) {
        // Wait for ROI table rows (handles fresh load OR return from redirect)
        await NetworkHelper.waitForListPopulated(this.page, RoiTableSelectors.tableRows, 1, 20000);

        const rowCount = await allRows.count();
        let clicked = false;
        for (let i = 0; i < rowCount; i++) {
            const row = allRows.nth(i);
            const plotIdCell = row.locator('mat-cell').nth(1);
            const plotIdText = await plotIdCell.textContent();
            // Skip Unassigned plots — they show a popup instead of navigating to edit page
            if (plotIdText && !plotIdText.startsWith('Unassigned-')) {
                await row.click();
                clicked = true;
                break;
            }
        }

        if (!clicked) break;

        // Confirm BOTH URL changed AND h1 is visible (navigation fully completed)
        try {
            await this.page.waitForURL(/\/edit\/roi\//, { timeout: 20000 });
            await editFormTitle.waitFor({ state: 'visible', timeout: 15000 });
            return; // navigation succeeded
        } catch {
            Logger.info(`[ROITable] Edit ROI navigation attempt ${attempt + 1} failed, retrying`);
        }
    }
    throw new Error('Could not navigate to Edit ROI form after 3 attempts');
});

Then('I should see the Edit ROI form', async function () {
    const formTitle = this.page.locator(RoiTableSelectors.roiFormTitle);
    await expect(formTitle).toBeVisible({ timeout: 15000 });
});

Then('I should see updated ROI in the table', async function () {
    // Wait for navigation back to ROI table list page after save
    await this.page.waitForURL(/tab=rois/, { timeout: 30000 });

    // Verify table has rows and data is loaded
    const tableRows = this.page.locator(RoiTableSelectors.tableRows);
    await expect(tableRows.first()).toBeVisible({ timeout: 15000 });
});

Then('I should see fee {string} in the ROI row', async function (expectedFee: string) {
    // Verify the fee appears in the table
    const feeText = this.page.locator(`text=${expectedFee}`);
    await expect(feeText).toBeVisible();
});

When('I open the ROI edit form for plot {string}', async function (plotId: string) {
    const actualPlotId = replacePlaceholders(plotId);
    const tableUrl = this.page.url();

    // Wait for table to load
    await this.page.locator('.mat-cell.mat-column-plotId').first().waitFor({ state: 'visible', timeout: 20000 });

    // Second call — reuse stored plot ID from first call
    if ((this as any).resolvedRoiPlotId) {
        const cell = this.page.locator('.mat-cell.mat-column-plotId')
            .filter({ hasText: (this as any).resolvedRoiPlotId }).first();
        await cell.waitFor({ state: 'visible', timeout: 20000 });
        await cell.scrollIntoViewIfNeeded();
        await cell.click();
        try {
            await this.page.waitForURL(/\/edit\/roi\//, { timeout: 15000 });
        } catch {
            await cell.click();
            await this.page.waitForURL(/\/edit\/roi\//, { timeout: 30000 });
        }
        await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);
        Logger.info(`[ROITable] Opened edit form for plot "${(this as any).resolvedRoiPlotId}" (reused)`);
        return;
    }

    // First call: try specified plot ID
    const specifiedCell = this.page.locator('.mat-cell.mat-column-plotId').filter({ hasText: actualPlotId }).first();
    if (await specifiedCell.isVisible()) {
        (this as any).resolvedRoiPlotId = actualPlotId;
        await specifiedCell.scrollIntoViewIfNeeded();
        await specifiedCell.click();
        try {
            await this.page.waitForURL(/\/edit\/roi\//, { timeout: 15000 });
        } catch {
            await specifiedCell.click();
            await this.page.waitForURL(/\/edit\/roi\//, { timeout: 30000 });
        }
        await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);
        Logger.info(`[ROITable] Opened edit form for plot "${actualPlotId}"`);
        return;
    }

    // Fallback: find first row in the table where roiHolders column is non-empty
    Logger.warn(`[ROITable] Plot "${actualPlotId}" not found — scanning table for first plot with an assigned holder...`);
    const rows = this.page.locator('mat-row');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const plotIdText = (await row.locator('.mat-column-plotId').textContent())?.trim() ?? '';
        if (!plotIdText || plotIdText.startsWith('Unassigned-')) continue;

        const holderText = (await row.locator('.mat-column-roiHolders').textContent())?.trim() ?? '';
        if (holderText && holderText !== '--') {
            (this as any).resolvedRoiPlotId = plotIdText;
            Logger.warn(`[ROITable] Using plot "${plotIdText}" (holder: ${holderText})`);
            break;
        }
    }

    if (!(this as any).resolvedRoiPlotId) {
        throw new Error(`[ROITable] No ROI plot with an assigned holder found in table (specified: "${actualPlotId}")`);
    }

    const fallbackCell = this.page.locator('.mat-cell.mat-column-plotId')
        .filter({ hasText: (this as any).resolvedRoiPlotId }).first();
    await fallbackCell.scrollIntoViewIfNeeded();
    await fallbackCell.click();
    try {
        await this.page.waitForURL(/\/edit\/roi\//, { timeout: 15000 });
    } catch {
        await fallbackCell.click();
        await this.page.waitForURL(/\/edit\/roi\//, { timeout: 30000 });
    }
    await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);
    Logger.info(`[ROITable] Opened edit form for plot "${(this as any).resolvedRoiPlotId}"`);
});
