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
  logger.info('Navigating to organization home page');
  const baseUrl = BASE_CONFIG.baseUrl;
  // After login, navigate to the organization home page
  await this.page.goto(baseUrl);
  await this.page.waitForTimeout(3000); // Wait for page to load
  logger.success('Navigated to organization home page');
});
