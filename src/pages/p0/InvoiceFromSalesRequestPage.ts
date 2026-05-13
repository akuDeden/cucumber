import { Page, expect } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { InvoiceFromSalesRequestSelectors as Sel } from '../../selectors/p0/invoice-from-sales-request/invoice-from-sales-request.selectors.js';

// US org — independent from AUS global config
const US_BASE_URL = process.env.US_BASE_URL || 'https://us.chronicle.rip';

export interface GenerateInvoiceResult {
  status: number;
  body: Record<string, unknown>;
}

export class InvoiceFromSalesRequestPage {
  private readonly page: Page;
  private readonly logger = new Logger('InvoiceFromSalesRequestPage');
  private lastGenerateResult: GenerateInvoiceResult | null = null;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async navigateToAdminRequests(): Promise<void> {
    this.logger.info('Navigating to admin requests page');
    const url = `${US_BASE_URL}/customer-admin/request`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.locator(Sel.loadingOverlay).waitFor({ state: 'hidden', timeout: 15000 });
    await NetworkHelper.waitForNetworkIdle(this.page);
  }

  async navigateToOwnerRequests(): Promise<void> {
    this.logger.info('Navigating to owner requests page');
    const url = `${US_BASE_URL}/customer-organization/request`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.locator(Sel.loadingOverlay).waitFor({ state: 'hidden', timeout: 15000 });
    await NetworkHelper.waitForNetworkIdle(this.page);
  }

  async navigateToAdminDashboard(): Promise<void> {
    this.logger.info('Navigating to admin dashboard');
    const url = `${US_BASE_URL}/customer-admin`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.locator(Sel.loadingOverlay).waitFor({ state: 'hidden', timeout: 15000 });
    await NetworkHelper.waitForNetworkIdle(this.page);
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Find the first APPROVED row in the request table and open it.
   * Angular SSR may render rows before hydration — use evaluate to locate by text.
   */
  async openFirstApprovedRequest(): Promise<void> {
    this.logger.info('Opening first APPROVED request');
    await this.page.evaluate(() => {
      const rows = document.querySelectorAll('mat-row, tr[mat-row]');
      const approvedRow = Array.from(rows).find(r => r.textContent?.includes('APPROVED'));
      (approvedRow as HTMLElement)?.click();
    });
    // Wait for the Generate Invoice button to confirm detail panel is open
    await this.page.locator(Sel.generateInvoiceButton).waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('APPROVED request opened — Generate Invoice button is visible');
  }

  /**
   * Click Generate Invoice and capture the API response.
   * Sets up the response interceptor BEFORE clicking (waitForResponse pattern).
   */
  async clickGenerateInvoice(): Promise<GenerateInvoiceResult> {
    this.logger.info('Clicking Generate Invoice button');
    const [response] = await Promise.all([
      this.page.waitForResponse(
        r =>
          r.url().includes(Sel.invoiceCreateEndpoint) &&
          r.request().method() === 'POST',
        { timeout: 15000 }
      ),
      this.page.locator(Sel.generateInvoiceButton).click(),
    ]);
    const result: GenerateInvoiceResult = {
      status: response.status(),
      body: await response.json(),
    };
    this.lastGenerateResult = result;
    this.logger.info(`Generate Invoice response: ${result.status}`);
    return result;
  }

  async clickSalesInNav(): Promise<void> {
    this.logger.info('Clicking Sales nav item');
    await this.page.locator(Sel.salesNavItem).first().click();
    await NetworkHelper.waitForNetworkIdle(this.page);
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /**
   * TC-01 / TC-03: invoice was created or already exists (200, 201, 400) — never 403.
   */
  async assertInvoiceCreatedSuccessfully(): Promise<void> {
    const result = this.lastGenerateResult;
    if (!result) throw new Error('clickGenerateInvoice() must be called before asserting');

    expect(result.status, 'Generate Invoice must not return 403 Forbidden').not.toBe(403);
    expect(
      String(result.body?.message ?? ''),
      'Response must not contain access-denied text'
    ).not.toContain("You don't have access");
    expect(
      [200, 201, 400],
      `Status ${result.status} is not in expected range [200, 201, 400]`
    ).toContain(result.status);
  }

  /**
   * TC-01 / TC-03 / TC-04: the page body must not show any access-denied text.
   */
  async assertNoAccessError(): Promise<void> {
    await expect(this.page.locator('body')).not.toContainText(Sel.accessErrorText);
    this.logger.info('No access error visible on page');
  }

  /**
   * TC-02: when invoice already exists (400), the error message must say "already exists",
   * not the old "You don't have access to this sales request" message.
   */
  async assertErrorDoesNotContainAccessDenied(): Promise<void> {
    const result = this.lastGenerateResult;
    if (!result) throw new Error('clickGenerateInvoice() must be called before asserting');

    expect(
      String(result.body?.message ?? ''),
      'Error message must not say "You don\'t have access to this sales request"'
    ).not.toBe(Sel.accessErrorSalesRequestText);
  }

  async assertErrorContainsAlreadyExists(): Promise<void> {
    const result = this.lastGenerateResult;
    if (!result) throw new Error('clickGenerateInvoice() must be called before asserting');

    if (result.status === 400) {
      expect(
        String(result.body?.message ?? ''),
        '400 error message must reference "already exists"'
      ).toMatch(/already exists/i);
    }
  }

  /**
   * TC-04: verify URL landed on the Sales page.
   */
  async assertOnSalesPage(): Promise<void> {
    await expect(this.page).toHaveURL(/customer-admin\/sales/);
    this.logger.info('Confirmed on Sales page');
  }
}
