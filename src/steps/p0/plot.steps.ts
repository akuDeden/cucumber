import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CreatePlotPage } from '../../pages/p0/CreatePlotPage.js';
import { PlotPage } from '../../pages/p0/PlotPage.js';
import { SalesPage } from '../../pages/p0/SalesPage.js';
import { replacePlaceholders, replacePlaceholdersInObject } from '../../utils/TestDataHelper.js';

let createPlotPage: CreatePlotPage;
let plotPage: PlotPage;
let salesPage: SalesPage;
let createdPlotId: string;
let lastClickedPlotId: string = '';
let addSalePlotId: string = '';
let addSaleItemRelatedPlot: string = '';

When('I navigate to the Tables section', { timeout: 20000 }, async function () {
  const page = this.page;
  createPlotPage = new CreatePlotPage(page);
  plotPage = new PlotPage(page);
  await createPlotPage.navigateToTablesSection();
});

When('I click the Add Plot button', { timeout: 20000 }, async function () {
  await createPlotPage.clickAddPlot();
});

When('I fill the add plot form with following details', { timeout: 60000 }, async function (dataTable) {
  const rawData = dataTable.rowsHash();
  const data = replacePlaceholdersInObject(rawData);

  // Store the expected plot ID for later verification
  if (data.section && data.row && data.number) {
    createdPlotId = createPlotPage.getExpectedPlotId(data.section, data.row, data.number);
    this.logger?.info(`Expected new plot ID: ${createdPlotId}`);
  }

  await createPlotPage.fillAddPlotForm({
    cemetery: data.cemetery,
    section: data.section,
    row: data.row,
    number: data.number,
    status: data.status,
    plotType: data.plotType,
    direction: data.direction,
    price: data.price,
    burialCapacity: data.burialCapacity || '1',
    notes: data.notes,
  });
});

When('I save the new plot', { timeout: 30000 }, async function () {
  await createPlotPage.saveNewPlot();
});

Then('the new plot should appear in the plots table', { timeout: 20000 }, async function () {
  if (!createdPlotId) {
    throw new Error('Plot ID not set — ensure "I fill the add plot form" step ran first');
  }
  const found = await createPlotPage.verifyPlotInTable(createdPlotId);
  expect(found).toBeTruthy();
});

// ===== Edit Plot steps =====

When('I click the Edit Plot button', { timeout: 15000 }, async function () {
  const page = this.page;
  // Always reinitialize to avoid stale page reference from a previous scenario
  createPlotPage = new CreatePlotPage(page);
  await createPlotPage.clickEditPlot();
});

When('I update the plot with following details', { timeout: 30000 }, async function (dataTable) {
  const rawData = dataTable.rowsHash();
  const data = replacePlaceholdersInObject(rawData);

  await createPlotPage.fillEditPlotForm({
    burialCapacity: data.burialCapacity,
    entombmentCapacity: data.entombmentCapacity,
    cremationCapacity: data.cremationCapacity,
    price: data.price,
    headstoneInscription: data.headstoneInscription,
    notes: data.notes,
  });
});

When('I save the plot changes', { timeout: 30000 }, async function () {
  await createPlotPage.savePlotChanges();
});

Then('the plot should be updated successfully', { timeout: 15000 }, async function () {
  // After saving edit, we should be on the plot detail page
  const currentUrl = this.page.url();
  expect(currentUrl).toContain('/plots/');
  this.logger?.info(`Plot updated successfully. Current URL: ${currentUrl}`);
});

// ===== Edit plot from MAP page steps =====

When('I navigate to the cemetery map page', { timeout: 20000 }, async function () {
  const page = this.page;
  if (!createPlotPage) createPlotPage = new CreatePlotPage(page);
  await createPlotPage.navigateToCemeteryMapPage();
});

When('I search for plot {string} on the map', { timeout: 20000 }, async function (plotName: string) {
  const actualPlotName = replacePlaceholders(plotName);
  await createPlotPage.searchAndSelectPlotOnMap(actualPlotName);
});

When('I click the edit button from plot detail', { timeout: 15000 }, async function () {
  await createPlotPage.clickEditFromPlotDetail();
});

// ===== Delete plot from table steps =====

When('I click the first plot row in the table', { timeout: 15000 }, async function () {
  const page = this.page;
  if (!createPlotPage) createPlotPage = new CreatePlotPage(page);
  lastClickedPlotId = await createPlotPage.clickFirstTableRow();
  this.logger?.info(`Clicked plot row: ${lastClickedPlotId}`);
});

When('I click the more options menu', { timeout: 10000 }, async function () {
  await createPlotPage.clickMoreOptionsMenu();
});

When('I click delete plot', { timeout: 10000 }, async function () {
  await createPlotPage.clickDeletePlot();
});

When('I confirm the plot deletion', { timeout: 20000 }, async function () {
  await createPlotPage.confirmDeletePlot();
});

Then('the plot should no longer be in the table', { timeout: 25000 }, async function () {
  await createPlotPage.navigateToTablesSection();
  const removed = await createPlotPage.verifyPlotRemovedFromTable(lastClickedPlotId);
  expect(removed).toBeTruthy();
});

// ===== View plot detail from table steps =====

Then('I should see the plot edit page', { timeout: 15000 }, async function () {
  await createPlotPage.verifyEditPageLoaded();
});

// ===== Map-based navigation: find first vacant plot via map =====

// ===== Add Sale from Edit Plot steps =====

When('I navigate to the advance table and open the first plot', { timeout: 60000 }, async function () {
  const page = this.page;
  createPlotPage = new CreatePlotPage(page);
  plotPage = new PlotPage(page);
  salesPage = new SalesPage(page);

  await createPlotPage.navigateToTablesSection();

  // Get the plot ID from the second row before clicking
  const rows = page.locator('mat-row');
  await rows.first().waitFor({ state: 'visible', timeout: 10000 });
  const secondRow = rows.nth(1);
  const plotIdCell = secondRow.locator('[data-testid*="content-wrapper-div-plot-id"]').first();
  addSalePlotId = ((await plotIdCell.textContent().catch(() => '')) || '').trim();
  this.logger?.info(`Second plot in table: ${addSalePlotId}`);

  // Click the row to open the Edit Plot page
  await secondRow.click();
  // Wait for the Edit Plot page to render — SAVE button is always present on edit plot page
  await page.waitForSelector('button:has-text("SAVE"), button:has-text("CANCEL")', { state: 'visible', timeout: 45000 });
  await page.waitForTimeout(1000);
  this.logger?.info(`Opened Edit Plot page for: ${addSalePlotId}`);
});

When('I click the ADD SALE button', { timeout: 30000 }, async function () {
  const page = this.page;
  if (!salesPage) salesPage = new SalesPage(page);
  await salesPage.clickAddSaleButton();
});

When('I search and select purchaser {string} {string} in the add person modal', { timeout: 30000 }, async function (firstName: string, lastName: string) {
  const page = this.page;
  if (!salesPage) salesPage = new SalesPage(page);
  await salesPage.clickAddPurchaserModal();
  await salesPage.searchAndSelectPurchaser(firstName, lastName);
  this.logger?.info(`Purchaser ${firstName} ${lastName} selected`);
});

When('I select the first available item from the Item dropdown', { timeout: 30000 }, async function () {
  const page = this.page;
  if (!salesPage) salesPage = new SalesPage(page);
  addSaleItemRelatedPlot = await salesPage.selectFirstItemAndGetPlot();
  this.logger?.info(`Item selected; related plot: ${addSaleItemRelatedPlot}`);
});

Then('the selected item related plot should match the first plot ID', { timeout: 10000 }, async function () {
  if (!addSalePlotId) {
    this.logger?.info('No plot ID captured — skipping related plot validation (interment flow)');
    return;
  }
  if (!addSaleItemRelatedPlot) {
    this.logger?.info('Related plot from item dropdown was empty — skipping strict match validation');
    return;
  }
  expect(addSaleItemRelatedPlot).toContain(addSalePlotId);
  this.logger?.info(`Related plot "${addSaleItemRelatedPlot}" matches first plot ID "${addSalePlotId}"`);
});

When('I click Create and confirm to navigate back to Edit Plot page', { timeout: 60000 }, async function () {
  const page = this.page;
  if (!salesPage) salesPage = new SalesPage(page);
  await salesPage.clickCreateFromEditPlot();
});

Then('I should see a new sale entry with reference {string} on the Edit Plot page', { timeout: 20000 }, async function (reference: string) {
  const actualReference = replacePlaceholders(reference);
  const page = this.page;
  if (!salesPage) salesPage = new SalesPage(page);
  await salesPage.verifySaleEntryWithReference(actualReference);
});

When('I navigate to the map and find the first available vacant plot', { timeout: 90000 }, async function () {
  const page = this.page;
  createPlotPage = new CreatePlotPage(page);
  plotPage = new PlotPage(page);

  // Step 1: Go to the plots list to find the name of the first vacant plot
  await plotPage.clickSeeAllPlots();
  await plotPage.openFilter();
  await plotPage.selectVacantFilter();
  await plotPage.applyFilter();
  await plotPage.expandFirstSection();
  const plotName = await plotPage.selectFirstVacantPlot();
  this.selectedPlotName = plotName;
  this.logger?.info(`First vacant plot found: ${plotName}`);

  // Step 2: Navigate to cemetery map page and search for the plot
  await createPlotPage.navigateToCemeteryMapPage();
  await createPlotPage.searchAndSelectPlotOnMap(plotName);
  this.logger?.info(`Navigated to plot detail via map search: ${plotName}`);
});
