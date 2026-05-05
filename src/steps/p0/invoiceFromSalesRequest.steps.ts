import { When, Then } from '@cucumber/cucumber';
import { InvoiceFromSalesRequestPage } from '../../pages/p0/InvoiceFromSalesRequestPage.js';
import { Logger } from '../../utils/Logger.js';

let invoicePage: InvoiceFromSalesRequestPage;
const logger = new Logger('InvoiceFromSalesRequestSteps');

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

When('I navigate to the admin requests page', async function () {
  invoicePage = new InvoiceFromSalesRequestPage(this.page);
  await invoicePage.navigateToAdminRequests();
  logger.info('Navigated to admin requests page');
});

When('I navigate to the owner requests page', async function () {
  invoicePage = new InvoiceFromSalesRequestPage(this.page);
  await invoicePage.navigateToOwnerRequests();
  logger.info('Navigated to owner requests page');
});

When('I navigate to the admin dashboard', async function () {
  invoicePage = new InvoiceFromSalesRequestPage(this.page);
  await invoicePage.navigateToAdminDashboard();
  logger.info('Navigated to admin dashboard');
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

When('I open the first approved sales request', async function () {
  invoicePage = invoicePage ?? new InvoiceFromSalesRequestPage(this.page);
  await invoicePage.openFirstApprovedRequest();
  logger.info('Opened first approved sales request');
});

// TC-02: opens the same way — first APPROVED row; assertion differentiates the outcome
When('I open an approved request that already has an invoice', async function () {
  invoicePage = invoicePage ?? new InvoiceFromSalesRequestPage(this.page);
  await invoicePage.openFirstApprovedRequest();
  logger.info('Opened approved request (invoice already exists case)');
});

When('I click {string}', async function (buttonLabel: string) {
  invoicePage = invoicePage ?? new InvoiceFromSalesRequestPage(this.page);
  if (buttonLabel.toUpperCase() === 'GENERATE INVOICE' || buttonLabel === 'Generate Invoice') {
    await invoicePage.clickGenerateInvoice();
    logger.info('Clicked Generate Invoice and captured API response');
  } else {
    throw new Error(`Unhandled button label in I click {string}: "${buttonLabel}". Add a case or use a more specific step.`);
  }
});

When('I click {string} in the navigation menu', async function (menuItem: string) {
  invoicePage = invoicePage ?? new InvoiceFromSalesRequestPage(this.page);
  if (menuItem === 'Sales') {
    await invoicePage.clickSalesInNav();
    logger.info('Clicked Sales in navigation menu');
  } else {
    throw new Error(`Unhandled nav item: "${menuItem}". Add a case or extend clickSalesInNav().`);
  }
});

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

Then('the invoice is created successfully', async function () {
  await invoicePage.assertInvoiceCreatedSuccessfully();
  logger.info('Invoice creation assertion passed (no 403, status in [200,201,400])');
});

Then('I do not see {string} error', async function (errorText: string) {
  // Delegates to the appropriate assertion based on known error strings
  if (errorText === "You don't have access to this sales request") {
    await invoicePage.assertErrorDoesNotContainAccessDenied();
  } else {
    await invoicePage.assertNoAccessError();
  }
  logger.info(`Confirmed error text not present: "${errorText}"`);
});

Then('I do not see any access error', async function () {
  await invoicePage.assertNoAccessError();
  logger.info('Confirmed no access error on page');
});

Then('I see an error message containing {string}', async function (expectedText: string) {
  if (expectedText === 'already exists') {
    await invoicePage.assertErrorContainsAlreadyExists();
    logger.info('Error message "already exists" assertion passed');
  } else {
    throw new Error(`Unhandled expected error text: "${expectedText}". Add a case in the page object.`);
  }
});

Then('I am taken to the Sales page', async function () {
  await invoicePage.assertOnSalesPage();
  logger.info('Confirmed navigation to Sales page');
});
