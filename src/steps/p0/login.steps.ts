import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { LoginPage } from '../../pages/p0/LoginPage.js';
import { Logger } from '../../utils/Logger.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { BASE_CONFIG } from '../../data/test-data.js';

const logger = new Logger('LoginSteps');
let loginPage: LoginPage;

Given('I am on the Chronicle login page', { timeout: 30000 }, async function () {
  logger.info('Navigating to Chronicle login page');
  loginPage = new LoginPage(this.page);
  await loginPage.navigate();
});

When('I enter email {string}', async function (email: string) {
  const actualEmail = replacePlaceholders(email);
  logger.info(`Entering email: ${actualEmail}`);
  await loginPage.enterEmail(actualEmail);
});

When('I enter password {string}', async function (password: string) {
  const actualPassword = replacePlaceholders(password);
  logger.info('Entering password');
  await loginPage.enterPassword(actualPassword);
});

When('I click the login button', async function () {
  logger.info('Clicking login button');
  await loginPage.clickLoginButton();
});

Then('I should be logged in successfully', { timeout: 60000 }, async function () {
  logger.info('Verifying successful login');
  await loginPage.waitForSuccessfulLogin();
  const isLoggedIn = await loginPage.isLoggedIn();
  expect(isLoggedIn).toBeTruthy();
});

Then('I should see the organization name {string}', { timeout: 10000 }, async function (expectedOrgName: string) {
  const actualOrgName = replacePlaceholders(expectedOrgName);
  logger.info(`Verifying organization name: ${actualOrgName}`);
  const orgName = await loginPage.getOrganizationName();
  expect(orgName?.toLowerCase()).toContain(actualOrgName.toLowerCase());
});

Then('I should see my email {string}', { timeout: 10000 }, async function (expectedEmail: string) {
  const actualEmail = replacePlaceholders(expectedEmail);
  logger.info(`Verifying user email: ${actualEmail}`);
  const userEmail = await loginPage.getUserEmail();
  expect(userEmail).toContain(actualEmail);
});

Then('I should see an error message', async function () {
  logger.info('Verifying error message is displayed');
  const errorMessage = await loginPage.getErrorMessage();
  expect(errorMessage).toBeTruthy();
});

Then('the login button should be disabled', async function () {
  logger.info('Verifying login button is disabled');
  const isEnabled = await loginPage.isLoginButtonEnabled();
  expect(isEnabled).toBeFalsy();
});

When('I navigate to organization home page', { timeout: 30000 }, async function () {
  logger.info('Validating auto-redirect to organization home page after login');
  
  // After login, system automatically redirects from public URL to authenticated URL
  // Public URL pattern: (env).chronicle.rip (e.g., map.chronicle.rip, staging.chronicle.rip)
  // Authenticated URL pattern: (region).chronicle.rip or (env)-(region).chronicle.rip
  // Examples:
  //   - map.chronicle.rip → aus.chronicle.rip
  //   - staging.chronicle.rip → staging-aus.chronicle.rip  
  //   - dev.chronicle.rip → dev-aus.chronicle.rip
  
  // Wait for automatic redirect to complete
  // The redirect happens after successful login, so we just need to wait for URL to stabilize
  await this.page.waitForTimeout(2000);
  
  // Wait for URL to contain region (indicates successful redirect to authenticated area)
  // This will wait for URL pattern like: *-aus.chronicle.rip or aus.chronicle.rip
  const region = BASE_CONFIG.region; // e.g., "aus"
  const baseDomain = BASE_CONFIG.baseDomain; // e.g., "chronicle.rip"
  await this.page.waitForURL(`**/*${region}*${baseDomain}/**`, { timeout: 15000 });
  
  // Additional wait for page to be fully loaded
  await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
  await this.page.waitForTimeout(1500); // Wait for UI to be ready
  
  // Verify we're on authenticated URL (has region in URL)
  const currentUrl = this.page.url();
  const hasRegionInUrl = currentUrl.includes(`${region}.${baseDomain}`) || 
                         currentUrl.includes(`-${region}.${baseDomain}`);
  
  if (!hasRegionInUrl) {
    throw new Error(
      `Failed to redirect to authenticated URL with region "${region}". ` +
      `Current URL: ${currentUrl}`
    );
  }
  
  logger.success(`Successfully redirected to authenticated organization home page: ${currentUrl}`);
});
