import { Page } from '@playwright/test';
import { BusinessSelectors, BusinessUrls } from '../../selectors/p0/business.selectors.js';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { getCustomerOrgBaseUrl } from '../../data/test-data.js';

export class BusinessPage {
  readonly page: Page;
  private logger: Logger;
  private businessListResponse: import('@playwright/test').Response | null = null;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('BusinessPage');
  }

  /**
   * Navigate to the advance table and click the BUSINESS tab
   */
  async navigateToBusinessTab(): Promise<void> {
    this.logger.info('Navigating to Business tab in advance table');
    const baseUrl = getCustomerOrgBaseUrl();
    await this.page.goto(`${baseUrl}${BusinessUrls.advanceTable}`, { waitUntil: 'domcontentloaded' });
    await NetworkHelper.waitForApiRequestsComplete(this.page, 8000);

    this.logger.info('Clicking BUSINESS tab');
    const businessTab = this.page.locator(BusinessSelectors.businessTab);
    await businessTab.waitFor({ state: 'visible', timeout: 10000 });
    await businessTab.click();

    // Wait for business list API to complete — captures both the response and its data
    const response = await this.page.waitForResponse(
      resp => resp.url().includes('/business-org') &&
              resp.request().method() === 'GET',
      { timeout: 15000 }
    ).catch(() => null);
    this.businessListResponse = response;

    await NetworkHelper.waitForApiRequestsComplete(this.page, 8000);
    this.logger.success('Navigated to Business tab');
  }

  /**
   * Click the Add Business button (shared testid across all tabs)
   */
  async clickAddBusiness(): Promise<void> {
    this.logger.info('Clicking Add Business button');
    const addBtn = this.page.locator(BusinessSelectors.addBusinessButton);
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    const currentUrl = this.page.url();
    await addBtn.click();
    await this.page.waitForURL(
      (url) => url.href !== currentUrl && url.href.includes('manage'),
      { timeout: 15000 }
    );
    await this.page.waitForTimeout(2000);
    this.logger.success(`Navigated to Add Business form: ${this.page.url()}`);
  }

  /**
   * Fill the add business form.
   * Required fields: cemetery, businessName, firstName, lastName
   */
  async fillAddBusinessForm(details: {
    cemetery?: string;
    businessName?: string;
    businessNumber?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<void> {
    this.logger.info('Filling Add Business form');

    // Cemetery dropdown
    if (details.cemetery) {
      this.logger.info(`Selecting cemetery: ${details.cemetery}`);
      const cemeterySelect = this.page.locator(BusinessSelectors.cemeterySelect).first();
      if (await cemeterySelect.count() > 0) {
        await cemeterySelect.click();
        await this.page.waitForTimeout(600);
        await this.page.locator('mat-option').filter({ hasText: details.cemetery }).first().click();
        await this.page.waitForTimeout(500);
      }
    }

    // Business name
    if (details.businessName) {
      this.logger.info(`Filling business name: ${details.businessName}`);
      const input = this.page.locator(BusinessSelectors.businessNameInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.businessName);
      } else {
        // Fallback to label
        await this.page.getByLabel('Business name', { exact: false }).first().fill(details.businessName);
      }
      await this.page.waitForTimeout(300);
    }

    // Business number (optional)
    if (details.businessNumber) {
      this.logger.info(`Filling business number: ${details.businessNumber}`);
      const input = this.page.locator(BusinessSelectors.businessNumberInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.businessNumber);
        await this.page.waitForTimeout(300);
      }
    }

    // First name (required)
    if (details.firstName) {
      this.logger.info(`Filling first name: ${details.firstName}`);
      const input = this.page.locator(BusinessSelectors.firstNameInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.firstName);
      } else {
        await this.page.getByLabel('First name', { exact: false }).first().fill(details.firstName);
      }
      await this.page.waitForTimeout(300);
    }

    // Last name (required)
    if (details.lastName) {
      this.logger.info(`Filling last name: ${details.lastName}`);
      const input = this.page.locator(BusinessSelectors.lastNameInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.lastName);
      } else {
        await this.page.getByLabel('Last name', { exact: false }).first().fill(details.lastName);
      }
      await this.page.waitForTimeout(300);
    }

    // Phone (mobile)
    if (details.phone) {
      this.logger.info(`Filling phone: ${details.phone}`);
      const input = this.page.locator(BusinessSelectors.phoneMobileInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.phone);
        await this.page.waitForTimeout(300);
      }
    }

    // Email
    if (details.email) {
      this.logger.info(`Filling email: ${details.email}`);
      const input = this.page.locator(BusinessSelectors.emailInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.email);
        await this.page.waitForTimeout(300);
      }
    }

    // Address
    if (details.address) {
      this.logger.info(`Filling address: ${details.address}`);
      const input = this.page.locator(BusinessSelectors.addressInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.address);
        await this.page.waitForTimeout(300);
      }
    }

    this.logger.success('Add Business form filled');
  }

  /**
   * Save the new/edited business by clicking the SAVE button
   */
  async saveBusiness(): Promise<void> {
    this.logger.info('Saving business');
    const saveBtn = this.page.locator(BusinessSelectors.saveButton).first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveBtn.click();
    await this.page.waitForTimeout(3000);
    this.logger.success('Business saved');
  }

  /**
   * Verify a business name appears in the table.
   */
  async verifyBusinessInTable(businessName: string): Promise<boolean> {
    this.logger.info(`Verifying business "${businessName}" appears in table`);
    await this.page.waitForTimeout(2000);

    const rows = await this.page.locator('mat-row').allTextContents();
    const found = rows.some(r => r.includes(businessName));

    if (found) {
      this.logger.success(`Business "${businessName}" found in table`);
    } else {
      this.logger.info(`Business "${businessName}" not found — ${rows.length} rows present`);
    }
    return found;
  }

  /**
   * Click the first data row in the business table to open the edit form.
   * Clicks each name cell to trigger the Angular router's API call, captures
   * the business ID from the network request, then navigates directly to the
   * edit URL — robust against broken rows (500) and tooltip interception.
   */
  async clickFirstTableRow(): Promise<string> {
    this.logger.info('Clicking first business row in table');

    await this.page.waitForSelector('mat-row', { state: 'visible', timeout: 15000 });

    // Wait for cell content to be rendered (data loaded, not skeleton rows)
    await this.page.waitForFunction(
      () => {
        const cell = document.querySelector('mat-row mat-cell');
        return cell && (cell.textContent || '').trim().length > 0;
      },
      { timeout: 15000 }
    );

    const rows = this.page.locator('mat-row');
    const rowCount = await rows.count();
    const baseUrl = this.page.url().split('/customer-organization')[0]; // e.g. https://aus.chronicle.rip
    const cemeterySlug = baseUrl.includes('aus.') ? 'astana_tegal_gundul_aus' : 'astana_tegal_gundul';

    for (let i = 0; i < Math.min(rowCount, 8); i++) {
      const row = rows.nth(i);
      const nameCell = row.locator('mat-cell').first();
      const rowText = ((await nameCell.textContent().catch(() => '')) || '').trim();

      // Move mouse to top-left to dismiss any tooltip from previous hover
      await this.page.mouse.move(0, 0);
      await this.page.waitForTimeout(400);

      // Set up request listener to capture business ID from the API call triggered by clicking
      let capturedBusinessId: string | null = null;
      const reqHandler = (req: import('@playwright/test').Request) => {
        const match = req.url().match(/\/business-org\/(\d+)\//);
        if (match) capturedBusinessId = match[1];
      };
      this.page.on('request', reqHandler);

      await nameCell.click({ timeout: 8000, force: true });
      await this.page.waitForTimeout(1500); // allow request to fire

      this.page.off('request', reqHandler);

      if (!capturedBusinessId) {
        this.logger.info(`Row ${i} ("${rowText}") did not trigger a business API request, trying next row`);
        continue;
      }

      this.logger.info(`Row ${i} ("${rowText}") triggered request for business ID: ${capturedBusinessId}`);

      // Navigate directly to the edit URL (bypasses Angular routing issues)
      const editUrl = `${baseUrl}/customer-organization/advance-table/manage/edit/business/${capturedBusinessId}/cemetery/${cemeterySlug}?from=table`;
      await this.page.goto(editUrl);

      try {
        await this.page.waitForURL(`**/manage/edit/business/${capturedBusinessId}/**`, { timeout: 10000 });
        const saveVisible = await this.page.locator(BusinessSelectors.saveButton).first().isVisible().catch(() => false);
        if (saveVisible) {
          this.logger.success(`Opened edit form for: "${rowText}" — ${this.page.url()}`);
          return rowText;
        }
        this.logger.info(`Edit form for business ${capturedBusinessId} has no save button (likely 500), trying next row`);
      } catch {
        this.logger.info(`Edit URL for business ${capturedBusinessId} timed out, trying next row`);
      }

      // Navigate back to the business tab for next retry
      await this.page.goto(`${baseUrl}/customer-organization/advance-table?tab=business`);
      await this.page.waitForSelector('mat-row', { state: 'visible', timeout: 10000 });
      await this.page.waitForFunction(
        () => {
          const cell = document.querySelector('mat-row mat-cell');
          return cell && (cell.textContent || '').trim().length > 0;
        },
        { timeout: 10000 }
      ).catch(() => {});
    }

    throw new Error('No business edit form could be opened from the first 8 rows');
  }

  /**
   * Update fields on the edit business form
   */
  async fillEditBusinessForm(details: {
    phone?: string;
    email?: string;
    address?: string;
  }): Promise<void> {
    this.logger.info('Filling Edit Business form');

    if (details.phone) {
      this.logger.info(`Updating phone: ${details.phone}`);
      const input = this.page.locator(BusinessSelectors.phoneMobileInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.phone);
        await this.page.waitForTimeout(300);
      }
    }

    if (details.email) {
      this.logger.info(`Updating email: ${details.email}`);
      const input = this.page.locator(BusinessSelectors.emailInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.email);
        await this.page.waitForTimeout(300);
      }
    }

    if (details.address) {
      this.logger.info(`Updating address: ${details.address}`);
      const input = this.page.locator(BusinessSelectors.addressInput).first();
      if (await input.count() > 0) {
        await input.click({ clickCount: 3 });
        await input.fill(details.address);
        await this.page.waitForTimeout(300);
      }
    }

    this.logger.success('Edit Business form filled');
  }

  /**
   * Click the DELETE button on the edit business page (top-right toolbar)
   */
  async clickDeleteBusiness(): Promise<void> {
    this.logger.info('Clicking DELETE button');
    const deleteBtn = this.page.locator(BusinessSelectors.deleteButton).first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 15000 });
    await deleteBtn.click();
    await this.page.waitForTimeout(1000);
    this.logger.success('DELETE button clicked');
  }

  /**
   * Confirm the business deletion dialog (or handle immediate deletion)
   */
  async confirmBusinessDeletion(): Promise<void> {
    this.logger.info('Confirming business deletion');

    const confirmBtn = this.page.locator(BusinessSelectors.confirmDeleteButton).first();
    const visible = await confirmBtn.isVisible().catch(() => false);
    if (visible) {
      await confirmBtn.click();
      this.logger.success('Confirmed deletion in dialog');
    } else {
      this.logger.info('No confirmation dialog — deletion may be immediate');
    }

    // Wait for navigation back to the table
    await this.page.waitForURL(
      (url) => !url.href.includes('/manage/'),
      { timeout: 15000 }
    ).catch(() => this.logger.info('Still on manage page after delete'));
    await this.page.waitForTimeout(1500);
    this.logger.success('Business deletion handled');
  }

  /**
   * Verify that a business is no longer visible in the table
   */
  async verifyBusinessRemovedFromTable(businessName: string): Promise<boolean> {
    this.logger.info(`Verifying business "${businessName}" is removed from table`);
    await this.page.waitForTimeout(2000);

    const rows = await this.page.locator('mat-row').allTextContents();
    const found = rows.some(r => r.includes(businessName));

    if (!found) {
      this.logger.success(`Business "${businessName}" confirmed removed`);
    } else {
      this.logger.info(`Business "${businessName}" still present`);
    }
    return !found;
  }
}
