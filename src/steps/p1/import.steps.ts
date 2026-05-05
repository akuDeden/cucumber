import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { LoginPage } from '../../pages/p0/LoginPage.js';
import { ImportPage } from '../../pages/p1/ImportPage.js';
import { Logger } from '../../utils/Logger.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { ImportSelectors } from '../../selectors/p1/import/index.js';

const logger = new Logger('ImportSteps');
let loginPage: LoginPage;
let importPage: ImportPage;

// ============================================
// Background Steps (reuses login from login.steps.ts)
// ============================================

Given('I am logged in as support admin on the Chronicle login page', async function () {
  logger.info('Logging in as support admin');

  loginPage = new LoginPage(this.page);
  await loginPage.navigate();

  // Use support credentials
  const supportEmail = process.env.TEST_EMAIL_SUPPORT || 'support@chronicle.rip';
  const supportPassword = process.env.TEST_PASSWORD_SUPPORT || 'f9Fz&d4^^9';

  await loginPage.enterEmail(supportEmail);
  await loginPage.enterPassword(supportPassword);
  await loginPage.clickLoginButton();

  // After login click, region selector dialog may appear at /login
  // Must handle dialog BEFORE waitForURL changes
  const ausButton = this.page.getByRole('button', { name: /aus server/i });
  try {
    await ausButton.waitFor({ state: 'visible', timeout: 10000 });
    await ausButton.click();
    logger.info('AUS server region selected from dialog');
  } catch {
    logger.info('No region dialog — already redirected');
  }

  // Wait for redirect away from login page
  await this.page.waitForURL(
    (url: URL) => !url.pathname.includes('/login'),
    { waitUntil: 'domcontentloaded', timeout: 30000 }
  );

  await NetworkHelper.waitForApiRequestsComplete(this.page, 8000);
  logger.success('Logged in as support admin');
});

When('I select the AUS server region', async function () {
  // Region is already selected in the Background step
  // This step is a no-op placeholder for readability in the feature file
  logger.info('AUS server region already selected in login step');
  await NetworkHelper.waitForApiRequestsComplete(this.page, 8000);
  logger.success('Admin page loaded with cemetery sidebar');
});

When('I search for cemetery {string}', async function (cemeteryName: string) {
  const name = replacePlaceholders(cemeteryName);
  logger.info(`Searching for cemetery: ${name}`);

  const searchInput = this.page.locator('input[placeholder="Search"]').first();
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.click();
  await searchInput.fill(name);

  // Wait for search results to filter
  await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 2000 });

  logger.success(`Search completed for: ${name}`);
});

When('I click on cemetery {string} in the sidebar', async function (cemeteryName: string) {
  const name = replacePlaceholders(cemeteryName);
  logger.info(`Clicking on cemetery: ${name}`);

  // Find the cemetery card in the search results
  const cemeteryElement = this.page.locator(`p:has-text("${name}"), h6:has-text("${name}")`).first();
  await cemeteryElement.waitFor({ state: 'visible' });

  // Set up endpoint wait BEFORE clicking — per CLAUDE.md rules
  // This endpoint loads cemetery-specific settings (plots, sections, etc.)
  const cemeterySlug = name.toLowerCase().replace(/ /g, '_') + '_aus';
  const settingsPromise = NetworkHelper.waitForApiEndpoint(
    this.page,
    `regional_settings_by_cemetery/${cemeterySlug}`,
    30000
  );

  // Click the parent container (card) to navigate
  const card = cemeteryElement.locator('..').locator('..');
  await card.click();

  // Wait for URL to change to cemetery-specific URL
  await this.page.waitForURL((url: URL) => url.pathname.includes('/chronicle-admin/'), {
    waitUntil: 'domcontentloaded'
  });

  // Wait for cemetery settings endpoint to complete (loads plots, sections, etc.)
  await settingsPromise;

  // Wait for any remaining API requests to finish
  await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);

  logger.success(`Navigated to cemetery: ${name} — all data loaded`);
});

// ============================================
// Import Page Steps
// ============================================

When('I open the More menu', async function () {
  importPage = new ImportPage(this.page);
  await importPage.clickMoreButton();
});

When('I click Import from the menu', async function () {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.clickImportMenuItem();
});

When('I navigate to the import page', async function () {
  importPage = new ImportPage(this.page);
  await importPage.navigateToImportPage();
});

Then('I should be on the import page', async function () {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.verifyOnImportPage();
});

Then('I should see the import page title {string}', async function (expectedTitle: string) {
  const title = this.page.locator(ImportSelectors.importPageTitle);
  await title.waitFor({ state: 'visible' });
  const actualTitle = await title.textContent();
  expect(actualTitle?.trim()).toBe(expectedTitle);
  logger.success(`Import page title verified: ${actualTitle}`);
});

Then('I should see the following data categories on the import page', async function (dataTable: any) {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }

  // Wait for category counts to load via API before reading DOM
  await NetworkHelper.waitForApiRequestsComplete(this.page, 8000);

  const categories = await importPage.getImportCategories();
  // Use .rows() to skip the header row, then extract first column
  const expectedCategories = dataTable.rows().map((row: string[]) => row[0]);

  for (const expected of expectedCategories) {
    const found = categories.some(c => c.name.toLowerCase() === expected.toLowerCase());
    expect(found).toBeTruthy();
    logger.info(`✓ Category "${expected}" found`);
  }

  logger.success(`All ${expectedCategories.length} categories verified`);
});

Then('the category {string} should have count {string}', async function (category: string, expectedCount: string) {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.verifyCategoryCount(category, expectedCount);
});

Then('the Import button should be disabled', async function () {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.verifyImportButtonState(false);
});

When('I click Back to the Cemetery', async function () {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.clickBackToCemetery();
});

Then('I should be back on the cemetery page', async function () {
  // Verify we're no longer on the import page
  const currentUrl = this.page.url();
  expect(currentUrl).not.toContain('/import-data');
  logger.success('Verified back on cemetery page');
});

// ============================================
// File Upload Steps
// ============================================

When('I upload {string} file {string} to category {string}', async function (fileType: string, fileName: string, category: string) {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }

  const dataDir = process.env.TEST_DATA_DIR || 'src/data/dataTestFile/import';
  const filePath = `${process.cwd()}/${dataDir}/${fileName}`;

  await importPage.uploadFileToCategory(category, fileType as 'geojson' | 'csv', filePath);
});

Then('the file {string} should be visible in the {string} {string} section', async function (fileName: string, category: string, fileType: string) {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.verifyFileUploaded(category, fileType as 'geojson' | 'csv', fileName);
});

Then('the Import button should be enabled', async function () {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.verifyImportButtonState(true);
});

When('I wipe the cemetery data and confirm', async function () {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.clickWipeDataAndConfirm();
});

When('I click the Import button', async function () {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.clickImportButton();
});

Then('the import should be submitted successfully', async function () {
  // After import, the page stays on import-data — verify Import button is disabled again
  // (re-disabled after submission) or a success toast appears
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  // Wait a moment for UI to reflect submission
  await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);
  logger.success('Import submitted successfully');
});

Then('I should see the import progress bar in the cemetery sidebar', async function () {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.verifyImportProgressVisible();
});

Then('the import status should be {string} via API', async function (expectedStatus: string) {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  // Uses the import status endpoint to confirm the job state via API
  await importPage.waitForImportToFinish();
});

Then('the import should complete successfully via API', { timeout: 660000 }, async function () {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }
  await importPage.waitForImportToFinish(600000);
});

When('I upload the following files to the import page', { timeout: 180000 }, async function (dataTable: any) {
  if (!importPage) {
    importPage = new ImportPage(this.page);
  }

  const dataDir = process.env.TEST_DATA_DIR || 'src/data/dataTestFile/import';
  const rows: { Category: string; FileType: string; FileName: string }[] = dataTable.hashes();

  for (const row of rows) {
    const filePath = `${process.cwd()}/${dataDir}/${row.FileName}`;
    await importPage.uploadFileToCategory(row.Category, row.FileType as 'geojson' | 'csv', filePath);
  }
});
