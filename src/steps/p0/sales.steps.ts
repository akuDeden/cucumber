import { When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { SalesPage, SaleItem } from '../../pages/p0/SalesPage.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { Logger } from '../../utils/Logger.js';

// Initialize page objects
let salesPage: SalesPage;
const logger = new Logger('SalesSteps');

/**
 * Navigate to Sales page from dashboard
 */
When('I navigate to Sales page', { timeout: 15000 }, async function () {
  const page = this.page;
  salesPage = new SalesPage(page);
  await salesPage.navigateToSales();
  logger.info('Navigated to Sales page');
});

/**
 * Validate that sales table is loaded and visible
 */
When('I validate sales table is loaded', { timeout: 10000 }, async function () {
  await salesPage.validateSalesTableLoaded();
  logger.info('Sales table validated');
});

/**
 * Click Create Sale button to open the create sale form
 */
When('I click Create Sale button', { timeout: 10000 }, async function () {
  await salesPage.clickCreateSale();
  logger.info('Clicked Create Sale button');
});

/**
 * Fill the sale reference field
 * Supports placeholders like <TEST_SALES_REFERENCE>
 */
When('I fill sale reference with {string}', async function (reference: string) {
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
When('I add purchaser person {string}', { timeout: 30000 }, async function (purchaserData: string) {
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
When('I add sale items with following details:', { timeout: 180000 }, async function (dataTable: DataTable) {
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
Then('I should see sale summary with following values:', { timeout: 15000 }, async function (dataTable: DataTable) {
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
When('I click Create button', { timeout: 60000 }, async function () {
  await salesPage.clickCreate();
  logger.info('Clicked Create button and navigated back to sales list');
});

/**
 * Verify that sale was created successfully
 * This checks that we're redirected to sales table page and purchaser name is correct
 */
Then('the sale should be created successfully', { timeout: 20000 }, async function () {
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
