import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { LoginPage } from '../../pages/p0/LoginPage.js';
import { Logger } from '../../utils/Logger.js';
import { replacePlaceholders } from '../../utils/TestDataHelper.js';
import { BASE_CONFIG, getCustomerOrgBaseUrl } from '../../data/test-data.js';

const logger = new Logger('LoginSteps');
let loginPage: LoginPage;

Given('I am on the Chronicle login page', async function () {
  logger.info('Navigating to Chronicle login page');
  loginPage = new LoginPage(this.page);
  await loginPage.navigate();
});

Given('I am on the Chronicle map login page', async function () {
  logger.info('Navigating to Chronicle map login page (US admin)');
  loginPage = new LoginPage(this.page);
  await loginPage.navigate('https://map.chronicle.rip/login');
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

Then('I should be logged in successfully', async function () {
  logger.info('Verifying successful login');
  await loginPage.waitForSuccessfulLogin();
  const isLoggedIn = await loginPage.isLoggedIn();
  expect(isLoggedIn).toBeTruthy();
});

Then('I should see the organization name {string}', async function (expectedOrgName: string) {
  const actualOrgName = replacePlaceholders(expectedOrgName);
  logger.info(`Verifying organization name: ${actualOrgName}`);
  const orgName = await loginPage.getOrganizationName();
  expect(orgName?.toLowerCase()).toContain(actualOrgName.toLowerCase());
});

Then('I should see my email {string}', async function (expectedEmail: string) {
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

When('I navigate to organization home page', async function () {
  logger.info('Validating auto-redirect to organization home page after login');

  const region = BASE_CONFIG.region;
  const baseDomain = BASE_CONFIG.baseDomain;
  const currentUrl = this.page.url();

  // Production may land on /?ns=true (org-selection page) instead of auto-redirecting.
  // In that case, navigate directly to the authenticated base URL.
  if (currentUrl.includes('ns=true') || !currentUrl.includes(region)) {
    logger.info(`Landed on ${currentUrl} — navigating directly to authenticated org URL`);
    const authBaseUrl = getCustomerOrgBaseUrl(region);
    await this.page.goto(authBaseUrl, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('domcontentloaded');
  } else {
    await this.page.waitForURL(`**/*${region}*${baseDomain}/**`, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('domcontentloaded');
  }

  const finalUrl = this.page.url();
  const hasRegionInUrl = finalUrl.includes(`${region}.${baseDomain}`) ||
    finalUrl.includes(`-${region}.${baseDomain}`);

  if (!hasRegionInUrl) {
    throw new Error(
      `Failed to reach authenticated URL with region "${region}". ` +
      `Current URL: ${finalUrl}`
    );
  }

  logger.success(`Successfully on authenticated organization home page: ${finalUrl}`);
});

