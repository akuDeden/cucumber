import { Page } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';
import { BASE_CONFIG, LOGIN_DATA } from '../../data/test-data.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { LoginSelectors, LoginUrls } from '../../selectors/p0/login/index.js';

export class LoginPage {
  private readonly page: Page;
  private readonly logger = new Logger('LoginPage');

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    this.logger.info('Navigating to login page');
    const baseUrl = BASE_CONFIG.baseUrl;
    this.logger.info(`Using BASE_URL: ${baseUrl}`);
    await this.page.goto(`${baseUrl}${LoginUrls.loginPage}`, { waitUntil: 'domcontentloaded' });
  }

  async enterEmail(email: string): Promise<void> {
    this.logger.info(`Entering email: ${email}`);
    // Click first to enable the input (it's readonly initially)
    await this.page.locator(LoginSelectors.emailInput).click();
    await this.page.locator(LoginSelectors.emailInput).fill(email);
  }

  async enterPassword(password: string): Promise<void> {
    this.logger.info('Entering password');
    // Click first to enable the input (it's readonly initially)
    await this.page.locator(LoginSelectors.passwordInput).click();
    await this.page.locator(LoginSelectors.passwordInput).fill(password);
  }

  async clickLoginButton(): Promise<void> {
    this.logger.info('Clicking login button');
    await this.page.locator(LoginSelectors.loginButton).click();
  }

  async isLoginButtonEnabled(): Promise<boolean> {
    const isDisabled = await this.page.locator(LoginSelectors.loginButton).isDisabled();
    return !isDisabled;
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      const errorElement = this.page.locator(LoginSelectors.errorMessage).first();
      await errorElement.waitFor({ state: 'visible', timeout: 10000 });
      return await errorElement.textContent();
    } catch (error) {
      this.logger.debug('No error message found');
    }
    return null;
  }

  async waitForSuccessfulLogin(): Promise<void> {
    this.logger.info('Waiting for successful login');
    // Production may redirect to /?ns=true (org selection landing) before the
    // authenticated dashboard. Accept both as valid post-login states.
    await this.page.waitForURL(/\/customer-|\?ns=true/, { waitUntil: 'domcontentloaded' });
    // Wait for API requests to complete and dashboard to fully load
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
    this.logger.success('Successfully logged in and dashboard loaded');
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      const url = this.page.url();
      return url.includes(LoginUrls.dashboardPattern) || url.includes('ns=true');
    } catch (error) {
      return false;
    }
  }

  async getOrganizationName(): Promise<string | null> {
    try {
      const orgElement = this.page.locator(LoginSelectors.organizationName).first();
      if (await orgElement.isVisible()) {
        return await orgElement.textContent();
      }
    } catch (error) {
      this.logger.error('Organization name not found');
    }
    return null;
  }

  async getUserEmail(): Promise<string | null> {
    try {
      // Build selector dynamically based on current region's email
      const email = LOGIN_DATA.valid.email;
      const emailElement = this.page.locator(`div:has-text("${email}")`).first();
      if (await emailElement.isVisible()) {
        return await emailElement.textContent();
      }
    } catch (error) {
      this.logger.error('User email not found');
    }
    return null;
  }
}
