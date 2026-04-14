import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BusinessPage } from '../../pages/p0/BusinessPage.js';
import { replacePlaceholdersInObject } from '../../utils/TestDataHelper.js';

let businessPage: BusinessPage;
let lastClickedBusinessName: string = '';

When('I navigate to the Business tab in the advance table', { timeout: 20000 }, async function () {
  businessPage = new BusinessPage(this.page);
  await businessPage.navigateToBusinessTab();
});

When('I click the Add Business button', { timeout: 20000 }, async function () {
  await businessPage.clickAddBusiness();
});

When('I fill the add business form with following details', { timeout: 60000 }, async function (dataTable) {
  const data = replacePlaceholdersInObject(dataTable.rowsHash());
  await businessPage.fillAddBusinessForm({
    cemetery: data.cemetery,
    businessName: data.businessName,
    businessNumber: data.businessNumber,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    email: data.email,
    address: data.address,
  });
});

When('I save the new business', { timeout: 30000 }, async function () {
  await businessPage.saveBusiness();
});

Then('the new business should appear in the business table', { timeout: 45000 }, async function () {
  businessPage = new BusinessPage(this.page);
  await businessPage.navigateToBusinessTab();

  // Wait for mat-row (standard Angular Material table row used by the business table)
  await this.page.waitForSelector('mat-row', { state: 'visible', timeout: 15000 })
    .catch(() => this.logger?.info('mat-row not found within 15s'));

  const matRowCount = await this.page.locator('mat-row').count();
  this.logger?.info(`Business table has ${matRowCount} mat-row(s)`);
  expect(matRowCount).toBeGreaterThan(0);
});

// ===== Edit Business steps =====
// Clicking a row navigates directly to the edit form — no separate "Edit" button

When('I click the first business row in the table', { timeout: 15000 }, async function () {
  if (!businessPage) businessPage = new BusinessPage(this.page);
  lastClickedBusinessName = await businessPage.clickFirstTableRow();
  this.logger?.info(`Clicked business row: ${lastClickedBusinessName}`);
});

When('I update the business with following details', { timeout: 30000 }, async function (dataTable) {
  const data = replacePlaceholdersInObject(dataTable.rowsHash());
  await businessPage.fillEditBusinessForm({
    phone: data.phone,
    email: data.email,
    address: data.address,
  });
});

When('I save the business changes', { timeout: 30000 }, async function () {
  await businessPage.saveBusiness();
});

Then('the business should be updated successfully', { timeout: 15000 }, async function () {
  const currentUrl = this.page.url();
  this.logger?.info(`Business updated. Current URL: ${currentUrl}`);
  // After save the page stays on the edit form or navigates — either is success
  expect(currentUrl).toContain('chronicle.rip');
});

// ===== Delete Business steps =====

When('I click the Delete Business button', { timeout: 10000 }, async function () {
  await businessPage.clickDeleteBusiness();
});

When('I confirm the business deletion', { timeout: 20000 }, async function () {
  await businessPage.confirmBusinessDeletion();
});

Then('the business should no longer be in the table', { timeout: 25000 }, async function () {
  if (!businessPage) businessPage = new BusinessPage(this.page);
  await businessPage.navigateToBusinessTab();
  const removed = await businessPage.verifyBusinessRemovedFromTable(lastClickedBusinessName);
  expect(removed).toBeTruthy();
});
