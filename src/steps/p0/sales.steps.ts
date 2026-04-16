import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { SalesPage, SaleItem } from '../../pages/p0/SalesPage.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';

// Initialize page objects
let salesPage: SalesPage;
const logger = new Logger('SalesSteps');

/**
 * Navigate to Sales page from dashboard
 */
When('I navigate to Sales page', async function () {
  const page = this.page;
  salesPage = new SalesPage(page);
  await salesPage.navigateToSales();
  logger.info('Navigated to Sales page');
});

/**
 * Validate that sales table is loaded and visible
 */
When('I validate sales table is loaded', async function () {
  await salesPage.validateSalesTableLoaded();
  logger.info('Sales table validated');
});

/**
 * Click Create Sale button to open the create sale form
 */
When('I click Create Sale button', async function () {
  await salesPage.clickCreateSale();
  logger.info('Clicked Create Sale button');
});

/**
 * Fill the sale reference field
 * Supports placeholders like <TEST_SALES_REFERENCE>
 */
When('I fill sale reference with {string}', async function (reference: string) {
  if (!salesPage) salesPage = new SalesPage(this.page);
  const actualReference = replacePlaceholders(reference);
  await salesPage.fillReference(actualReference);
  logger.info(`Filled reference: ${actualReference}`);
});

/**
 * Validate issue date is pre-filled with current date
 */
When('I validate issue date is pre-filled with current date', async function () {
  await salesPage.validateIssueDate();
  logger.info('Issue date validated - pre-filled with current date');
});

/**
 * Validate due date is current date + default due days from invoice settings
 */
When('I validate due date is current date plus default due days', async function () {
  await salesPage.validateDueDate();
  logger.info('Due date validated - current date plus default due days');
});

/**
 * Fill the sale issue date field
 * Supports placeholders like <TEST_SALES_ISSUE_DATE>
 */
When('I fill sale issue date with {string}', async function (issueDate: string) {
  const actualIssueDate = replacePlaceholders(issueDate);
  await salesPage.fillIssueDate(actualIssueDate);
  logger.info(`Filled issue date: ${actualIssueDate}`);
});

/**
 * Fill the sale due date field
 * Supports placeholders like <TEST_SALES_DUE_DATE>
 */
When('I fill sale due date with {string}', async function (dueDate: string) {
  const actualDueDate = replacePlaceholders(dueDate);
  await salesPage.fillDueDate(actualDueDate);
  logger.info(`Filled due date: ${actualDueDate}`);
});

/**
 * Fill the sale issue date with a date relative to current date
 * Example: I fill sale issue date with current date minus 6 days
 */
When('I fill sale issue date with current date minus {int} days', async function (days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  await salesPage.fillIssueDate(formatted);
  logger.info(`Filled issue date: ${formatted} (current date minus ${days} days)`);
});

/**
 * Fill the sale due date with a date relative to current date
 * Example: I fill sale due date with current date minus 3 days
 */
When('I fill sale due date with current date minus {int} days', async function (days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  await salesPage.fillDueDate(formatted);
  logger.info(`Filled due date: ${formatted} (current date minus ${days} days)`);
});

/**
 * Fill the sale note field
 * Supports placeholders like <TEST_SALES_NOTE>
 */
When('I fill sale note with {string}', async function (note: string) {
  const actualNote = replacePlaceholders(note);
  await salesPage.fillNote(actualNote);
  logger.info(`Filled note: ${actualNote}`);
});

/**
 * Select owner for the sale
 * If no name provided, selects first available option
 */
When('I select sale owner', async function () {
  await salesPage.selectOwner();
  logger.info('Selected sale owner');
});

When('I select sale owner {string}', async function (ownerName: string) {
  const actualOwner = replacePlaceholders(ownerName);
  await salesPage.selectOwner(actualOwner);
  logger.info(`Selected sale owner: ${actualOwner}`);
});

/**
 * Add purchaser person by filling the Add Person dialog
 * Parameters: firstname|lastname|email format
 * Example: "Jon|Doe|jondoe@test.com"
 */
When('I add purchaser person {string}', async function (purchaserData: string) {
  // Parse purchaser data: "firstname|lastname|email" or just use placeholders
  let firstName, lastName, email;
  
  if (purchaserData.includes('|')) {
    [firstName, lastName, email] = purchaserData.split('|').map(s => replacePlaceholders(s.trim()));
  } else {
    // If single string, treat as placeholder that should be in format firstname|lastname|email
    const resolved = replacePlaceholders(purchaserData);
    if (resolved.includes('|')) {
      [firstName, lastName, email] = resolved.split('|').map(s => s.trim());
    } else {
      // Fallback: use from test data
      firstName = replacePlaceholders('<TEST_SALES_PURCHASER_FIRSTNAME>');
      lastName = replacePlaceholders('<TEST_SALES_PURCHASER_LASTNAME>');
      email = replacePlaceholders('<TEST_SALES_PURCHASER_EMAIL>');
    }
  }
  
  await salesPage.clickAddPurchaser();
  await salesPage.addNewPurchaser(firstName, lastName, email);
  logger.info(`Added purchaser: ${firstName} ${lastName} (${email})`);
});

/**
 * Add multiple sale items with details from data table
 * Data table format:
 * | description | related_plot | quantity | price | discount |
 * | item a      | B F 1        | 1        | 100   | 0        |
 */
When('I add sale items with following details:', async function (dataTable: DataTable) {
  const rows = dataTable.hashes(); // Get array of objects from table
  const items: SaleItem[] = [];

  for (const row of rows) {
    const item: SaleItem = {
      description: row.description,
      related_plot: row.related_plot,
      quantity: parseInt(row.quantity),
      price: parseFloat(row.price),
      tax_rate: 10, // Default tax rate
      total: 0, // Will be calculated
      discount: parseFloat(row.discount || '0'),
      note: row.note || null
    };
    items.push(item);
  }

  logger.info(`Adding ${items.length} items to sale`);
  await salesPage.addItems(items);
  logger.info('All items added successfully');
});

/**
 * Validate sale summary matches expected values
 * Data table format:
 * | subtotal | <TEST_SALES_SUBTOTAL> |
 * | discount | <TEST_SALES_DISCOUNT> |
 * | vat      | <TEST_SALES_VAT>      |
 * | total    | <TEST_SALES_TOTAL>    |
 */
Then('I should see sale summary with following values:', async function (dataTable: DataTable) {
  const expectedData = dataTable.rowsHash(); // Get key-value pairs
  
  // Replace placeholders in expected values
  const expectedSummary = {
    subtotal: replacePlaceholders(expectedData.subtotal),
    discount: replacePlaceholders(expectedData.discount),
    vat: replacePlaceholders(expectedData.vat),
    total: replacePlaceholders(expectedData.total)
  };

  logger.info(`Expected summary: ${JSON.stringify(expectedSummary)}`);
  await salesPage.validateSaleSummary(expectedSummary);
  logger.info('Sale summary validation passed');
});

/**
 * Click the Create button to submit the sale
 */
When('I click Create button', async function () {
  await salesPage.clickCreate();
  logger.info('Clicked Create button and navigated back to sales list');
});

/**
 * Verify that sale was created successfully
 * This checks that we're redirected to sales table page and purchaser name is correct
 */
Then('the sale should be created successfully', async function () {
  // Note: NetworkHelper.waitForApiEndpoint for invoices is already handled inside clickCreate()
  // No need to wait again here — the API calls (POST create + GET list) are already completed

  // Verify we're back on sales table page
  await salesPage.validateSalesTableLoaded();
  logger.info('Sale created successfully and redirected to sales table');
  
  // Validate purchaser name in the table
  const purchaserData = replacePlaceholders('<TEST_SALES_PURCHASER>');
  const [firstName, lastName] = purchaserData.split('|');
  const expectedPurchaserName = `${firstName} ${lastName}`;
  await salesPage.validatePurchaserInTable(expectedPurchaserName);
  logger.info(`Purchaser name validated: ${expectedPurchaserName}`);
});

/**
 * Click the Save button (for draft saves)
 */
When('I click Save button', async function () {
  await salesPage.clickSave();
  logger.info('Clicked Save button');
});

/**
 * Click the Cancel button
 */
When('I click Cancel button', async function () {
  await salesPage.clickCancel();
  logger.info('Clicked Cancel button');
});

/**
 * Get the count of sales records in the table
 */
Then('I should see {int} sales record(s)', async function (expectedCount: number) {
  const actualCount = await salesPage.getSalesCount();
  expect(actualCount).toBe(expectedCount);
  logger.info(`Verified ${actualCount} sales records`);
});

/**
 * Open the latest created sale (first row in the table)
 */
When('I open the latest created sale', async function () {
  await salesPage.openLatestSale();
  logger.info('Opened the latest created sale');
});

/**
 * Add a payment with following details
 * Data table format:
 * | amount | method | note |
 * | 500   | Cash   | Test payment |
 */
When('I add payment with following details:', async function (dataTable: DataTable) {
  const paymentData = dataTable.hashes()[0]; // Get first row from table

  // Replace placeholders in payment data
  const amount = replacePlaceholders(paymentData.amount);
  const method = replacePlaceholders(paymentData.method);
  const note = replacePlaceholders(paymentData.note);

  logger.info(`Adding payment: ${amount} via ${method}`);

  await salesPage.addPayment({
    amount,
    method,
    note
  });

  logger.info('Payment added successfully');
});

/**
 * Add multiple payments with following details (add + save for each row)
 * Each row triggers: add payment → click save → wait for page reload
 * Data table format:
 * | amount | method | note |
 * | 100    | Bank Transfer | First payment  |
 * | 200    | Bank Transfer | Second payment |
 */
When('I add multiple payments with following details:', async function (dataTable: DataTable) {
  const payments = dataTable.hashes();

  logger.info(`Adding ${payments.length} payments sequentially`);

  for (let i = 0; i < payments.length; i++) {
    const paymentData = payments[i];
    const amount = replacePlaceholders(paymentData.amount);
    const method = replacePlaceholders(paymentData.method);
    const note = replacePlaceholders(paymentData.note);
    const isLastPayment = i === payments.length - 1;

    logger.info(`Payment ${i + 1}/${payments.length}: ${amount} via ${method}`);

    await salesPage.addPayment({ amount, method, note });
    logger.info(`Payment ${i + 1} form filled, clicking Save`);

    if (isLastPayment) {
      // Last payment: save and let app redirect to sales list (no need to navigate back)
      await salesPage.clickSaveLastPayment();
    } else {
      // Not last payment: save then navigate back to edit page for next payment
      await salesPage.clickSaveWithoutReload();
    }
    logger.info(`Payment ${i + 1} saved successfully`);
  }

  logger.info(`All ${payments.length} payments added and saved`);
});

/**
 * Verify invoice status matches expected value
 * Valid statuses: UNPAID, PARTIALLY PAID, PAID, OVERPAID, DRAFT
 */
Then('the invoice status should be {string}', async function (expectedStatus: string) {
  await salesPage.validateInvoiceStatus(expectedStatus);
  logger.info(`Invoice status validated: ${expectedStatus}`);
});

// ─── More Menu & Re-send Payment Steps ───────────────────────────────────────

/**
 * Click the MORE menu button on the invoice edit page
 */
When('I click the More menu', async function () {
  await salesPage.clickMoreMenu();
  logger.info('MORE menu opened');
});

/**
 * Close the MORE menu
 */
When('I close the More menu', async function () {
  await salesPage.closeMoreMenu();
  logger.info('MORE menu closed');
});

/**
 * Verify that "Re-send Payment" button is visible in the More menu
 */
Then('I should see {string} button in the More menu', async function (buttonText: string) {
  const visible = await salesPage.isMoreMenuItemVisible(buttonText);
  if (!visible) {
    throw new Error(`"${buttonText}" button not found in MORE menu`);
  }
  logger.info(`"${buttonText}" button is visible in MORE menu`);
});

/**
 * Verify that "Re-send Payment" button is NOT visible in the More menu
 */
Then('I should not see {string} button in the More menu', async function (buttonText: string) {
  const visible = await salesPage.isMoreMenuItemVisible(buttonText);
  if (visible) {
    throw new Error(`"${buttonText}" button should NOT be visible in MORE menu`);
  }
  logger.info(`"${buttonText}" button is correctly hidden in MORE menu`);
});

/**
 * Click a specific menu item in the More menu (e.g. "Re-send Payment")
 */
When('I click {string} in the More menu', async function (buttonText: string) {
  if (buttonText === 'Re-send Payment') {
    await salesPage.clickResendPayment();
  } else {
    // Generic menu item click
    const menuItem = this.page.locator(`[role="menuitem"]:has-text("${buttonText}")`);
    await menuItem.click();
  }
  logger.info(`Clicked "${buttonText}" in MORE menu`);
});

/**
 * Verify toast/snackbar notification message
 */
Then('I should see toast notification {string}', async function (expectedMessage: string) {
  await salesPage.validateToastNotification(expectedMessage);
  logger.info(`Toast notification validated: ${expectedMessage}`);
});

// ─── Void Invoice Steps ──────────────────────────────────────────────────────

/**
 * Click Void in the More menu and confirm the void dialog
 * MORE menu must already be open
 */
When('I click Void in the More menu and confirm', async function () {
  await salesPage.clickVoidInvoice();
  logger.info('Invoice voided successfully');
});

/**
 * Verify the invoice was voided (we're on sales table after void)
 */
Then('the invoice should be voided successfully', async function () {
  await salesPage.validateSalesTableLoaded();
  logger.info('Invoice voided — redirected to sales table');
});

/**
 * Open the latest voided sale (find VOID status row in table)
 * After voiding, the voided invoice may not be the first row
 * due to sorting. We re-use openLatestSale which clicks first row.
 */
When('I open the latest voided sale', async function () {
  // The voided invoice should still be in the same position in the table
  // since void doesn't change the sort order
  await salesPage.openLatestSale();
  logger.info('Opened the latest voided sale');
});

/**
 * Verify the Void button is disabled in the More menu (for VOID status invoices)
 */
Then('the Void button should be disabled in the More menu', async function () {
  const isDisabled = await salesPage.isVoidMenuItemDisabled();
  if (!isDisabled) {
    throw new Error('Void button should be disabled for VOID status invoice, but it is enabled');
  }
  logger.info('Void button is correctly disabled for VOID status invoice');
});
