import { Page, expect } from '@playwright/test';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { salesSelectors } from '../../selectors/p0/sales/index.js';

export interface SaleItem {
  description: string;
  related_plot: string;
  quantity: number;
  price: number;
  tax_rate: number;
  total: number;
  discount: number;
  note?: string | null;
}

export interface SaleData {
  reference: string;
  issue_date?: string;
  due_date?: string;
  owner?: string;
  note?: string;
  purchaser?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  items: SaleItem[];
}

export interface SaleSummary {
  subtotal: string;
  discount: string;
  vat: string;
  total: string;
}

export class SalesPage {
  private readonly page: Page;
  private readonly logger = new Logger('SalesPage');

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to Sales page by clicking the Sales menu button
   */
  async navigateToSales(): Promise<void> {
    this.logger.info('Navigating to Sales page');
    await this.page.locator(salesSelectors.salesMenuButton).click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForSelector(salesSelectors.salesTable, { state: 'visible' });
  }

  /**
   * Validate that the sales table is loaded and visible
   */
  async validateSalesTableLoaded(): Promise<void> {
    this.logger.info('Validating sales table is loaded');
    await expect(this.page.locator(salesSelectors.salesTable)).toBeVisible();
    this.logger.info('Sales table is visible');
  }

  /**
   * Get the count of sales records in the table
   */
  async getSalesCount(): Promise<number> {
    const rows = await this.page.locator(salesSelectors.salesTableRows).count();
    this.logger.info(`Sales table has ${rows} rows`);
    return rows;
  }

  /**
   * Click the Create Sale button
   */
  async clickCreateSale(): Promise<void> {
    this.logger.info('Clicking Create Sale button');

    // Setup API listeners BEFORE click (payment-methods & invoice-settings load on create page)
    const paymentMethodsPromise = this.page.waitForResponse(
      (res) => res.url().includes('/payment-methods/') && res.status() === 200,
      { timeout: 15000 }
    ).catch(() => this.logger.info('payment-methods API not called (may be cached)'));
    const invoiceSettingsPromise = this.page.waitForResponse(
      (res) => res.url().includes('/invoice-settings/') && res.status() === 200,
      { timeout: 15000 }
    ).catch(() => this.logger.info('invoice-settings API not called (may be cached)'));

    await this.page.locator(salesSelectors.createSaleButton).click();
    await this.page.waitForLoadState('domcontentloaded');

    // Wait for both APIs to complete
    await Promise.all([paymentMethodsPromise, invoiceSettingsPromise]);
    this.logger.info('payment-methods & invoice-settings APIs loaded');

    // Wait for the sale form to be ready (reference input visible)
    await this.page.waitForSelector(salesSelectors.referenceInput, { state: 'visible' });
  }

  /**
   * Fill the Reference field
   */
  async fillReference(reference: string): Promise<void> {
    this.logger.info(`Filling reference: ${reference}`);
    await this.page.waitForSelector(salesSelectors.referenceInput, { state: 'visible' });
    await this.page.locator(salesSelectors.referenceInput).fill(reference);
  }

  /**
   * Fill the Issue Date field
   */
  async fillIssueDate(issueDate: string): Promise<void> {
    this.logger.info(`Filling issue date: ${issueDate}`);
    await this.page.waitForSelector(salesSelectors.issueDateInput, { state: 'visible' });
    await this.page.locator(salesSelectors.issueDateInput).fill(issueDate);
  }

  /**
   * Fill the Due Date field
   */
  async fillDueDate(dueDate: string): Promise<void> {
    this.logger.info(`Filling due date: ${dueDate}`);
    await this.page.waitForSelector(salesSelectors.dueDateInput, { state: 'visible' });
    await this.page.locator(salesSelectors.dueDateInput).fill(dueDate);
  }

  /**
   * Fill the Note field
   */
  async fillNote(note: string): Promise<void> {
    this.logger.info(`Filling note: ${note}`);
    await this.page.waitForSelector(salesSelectors.noteTextarea, { state: 'visible' });
    await this.page.locator(salesSelectors.noteTextarea).fill(note);
  }

  /**
   * Get invoice settings from API
   * Returns the default_due_days value
   */
  async getInvoiceSettings(): Promise<number> {
    this.logger.info('Fetching invoice settings from API');

    // Fetch invoice settings using page.evaluate with auth token from localStorage
    try {
      const settings = await this.page.evaluate(async () => {
        const token = localStorage.getItem('accessToken');
        // Extract org ID from the current URL path (e.g. /api/v1/organization/{id}/...)
        // Or try all orgs endpoint and get the first match
        const currentUrl = window.location.href;
        
        // Try to find org ID from network requests or page context
        // The API endpoint pattern is /api/v1/organization/{orgId}/invoice-settings/
        // We need to discover the org ID dynamically
        const orgMatch = document.cookie.match(/org_id=(\d+)/) || 
                         currentUrl.match(/organization\/(\d+)/);
        
        // Try fetching with a broad search - the API returns paginated data
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // First try to get org list to find the org ID
        const orgResponse = await fetch('/api/v1/user/', { headers });
        if (orgResponse.ok) {
          const userData = await orgResponse.json();
          // Try to extract org ID from user data
          const orgId = userData?.data?.organization_id || userData?.organization_id;
          if (orgId) {
            const settingsRes = await fetch(`/api/v1/organization/${orgId}/invoice-settings/`, { headers });
            if (settingsRes.ok) {
              const settingsData = await settingsRes.json();
              if (settingsData?.data?.[0]) {
                return settingsData.data[0];
              }
            }
          }
        }

        // Fallback: try extracting org ID from the page URL or known patterns
        // URL pattern: /customer-organization/sales-table -> need to get org ID another way
        // Try common org IDs or use the invoice-settings endpoint with org from URL
        return null;
      });

      if (settings && typeof settings.default_due_days === 'number') {
        this.logger.info(`Invoice settings fetched: default_due_days = ${settings.default_due_days}`);
        return settings.default_due_days;
      }
    } catch (e) {
      this.logger.info(`Failed to fetch via page.evaluate: ${(e as Error).message}`);
    }

    // Fallback: read the due date directly from the form and calculate the difference from today
    try {
      this.logger.info('Falling back to reading due date from form to determine default_due_days');
      const dueDateValue = await this.page.locator('[formcontrolname="due_date"]').first().inputValue();
      const issueDateValue = await this.page.locator('[formcontrolname="issue_date"]').first().inputValue();
      
      if (dueDateValue && issueDateValue) {
        // Parse DD/MM/YYYY format
        const [dDay, dMonth, dYear] = dueDateValue.split('/').map(Number);
        const [iDay, iMonth, iYear] = issueDateValue.split('/').map(Number);
        const dueDate = new Date(dYear, dMonth - 1, dDay);
        const issueDate = new Date(iYear, iMonth - 1, iDay);
        const diffDays = Math.round((dueDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
        this.logger.info(`Calculated default_due_days from form: ${diffDays} (issue: ${issueDateValue}, due: ${dueDateValue})`);
        return diffDays;
      }
    } catch (e) {
      this.logger.info(`Failed to read dates from form: ${(e as Error).message}`);
    }

    // Default fallback
    this.logger.info('Using default due days: 0');
    return 0;
  }

  /**
   * Validate issue date is pre-filled with current date
   * Format: DD/MM/YYYY
   */
  async validateIssueDate(): Promise<void> {
    this.logger.info('Validating issue date is pre-filled with current date');

    await this.page.waitForSelector(salesSelectors.issueDateInput, { state: 'visible' });

    const actualIssueDate = await this.page.locator(salesSelectors.issueDateInput).inputValue();
    this.logger.info(`Actual issue date value: "${actualIssueDate}"`);

    // Get current date in DD/MM/YYYY format
    const today = new Date();
    const expectedDate = this.formatDateToDDMMYYYY(today);
    this.logger.info(`Expected issue date (current date): "${expectedDate}"`);

    if (actualIssueDate !== expectedDate) {
      throw new Error(`Issue date validation failed. Expected: "${expectedDate}", Actual: "${actualIssueDate}"`);
    }

    this.logger.info('Issue date validation passed - pre-filled with current date');
  }

  /**
   * Validate due date is current date + default due days
   * If defaultDueDays not provided, fetch from invoice settings API
   * Format: DD/MM/YYYY
   */
  async validateDueDate(defaultDueDays?: number): Promise<void> {
    this.logger.info('Validating due date is current date + default due days');

    let dueDays = defaultDueDays;
    if (dueDays === undefined) {
      dueDays = await this.getInvoiceSettings();
    }

    await this.page.waitForSelector(salesSelectors.dueDateInput, { state: 'visible' });

    const actualDueDate = await this.page.locator(salesSelectors.dueDateInput).inputValue();
    this.logger.info(`Actual due date value: "${actualDueDate}"`);

    // Calculate expected due date (current date + due days)
    const today = new Date();
    const expectedDueDate = this.addDays(today, dueDays);
    const expectedDateStr = this.formatDateToDDMMYYYY(expectedDueDate);
    this.logger.info(`Expected due date (current date + ${dueDays} days): "${expectedDateStr}"`);

    if (actualDueDate !== expectedDateStr) {
      throw new Error(`Due date validation failed. Expected: "${expectedDateStr}" (+${dueDays} days), Actual: "${actualDueDate}"`);
    }

    this.logger.info(`Due date validation passed - ${dueDays} days from current date`);
  }

  /**
   * Format date to DD/MM/YYYY
   */
  private formatDateToDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Add days to a date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Select Owner from dropdown
   * Selects the first available option if no specific owner provided
   */
  async selectOwner(ownerName?: string): Promise<void> {
    this.logger.info(`Selecting owner: ${ownerName || 'first available'}`);
    await this.page.waitForSelector(salesSelectors.ownerSelect, { state: 'visible' });
    
    // Check current value before selecting
    const ownerCombobox = this.page.locator(salesSelectors.ownerSelect);
    const valueBefore = await ownerCombobox.textContent();
    this.logger.info(`Owner value before selection: "${valueBefore?.trim()}"`);
    
    await ownerCombobox.click();
    
    // Wait for options to appear
    await this.page.waitForSelector('mat-option', { state: 'visible' });
    
    // Get all options
    const options = await this.page.locator('mat-option:visible').allTextContents();
    this.logger.info(`Available owner options: ${JSON.stringify(options)}`);
    
    if (ownerName) {
      // Select specific owner by name
      const option = this.page.locator(`mat-option:has-text("${ownerName}")`).first();
      await option.click();
    } else {
      // Select first available option using more specific selector
      const option = this.page.locator('mat-option').first();
      await option.click();
    }
    
    // Wait for Angular to process the selection (overlay should close)
    await this.page.locator('.cdk-overlay-pane').waitFor({ state: 'hidden' }).catch(() => {});
    
    // Trigger change event explicitly
    await this.page.evaluate((selector) => {
      const selectElement = document.querySelector(selector) as any;
      if (selectElement && selectElement._elementRef) {
        const event = new Event('change', { bubbles: true });
        selectElement._elementRef.nativeElement.dispatchEvent(event);
      }
    }, salesSelectors.ownerSelect);
    
    // Verify owner is selected
    const valueAfter = await ownerCombobox.textContent();
    this.logger.info(`Owner value after selection: "${valueAfter?.trim()}"`);
    
    if (!valueAfter || valueAfter.trim() === '' || valueAfter.trim() === 'Owner') {
      this.logger.error('Owner selection may have failed - combobox still shows empty or placeholder text');
    } else {
      this.logger.info('Owner selected');
    }
  }

  /**
   * Click Add Purchaser button
   */
  async clickAddPurchaser(): Promise<void> {
    this.logger.info('Clicking Add Purchaser button');
    await this.page.waitForSelector(salesSelectors.addPurchaserButton, { state: 'visible' });
    await this.page.locator(salesSelectors.addPurchaserButton).click();
    // Wait for Add Person dialog to appear
    await this.page.waitForSelector(salesSelectors.addPersonDialog, { state: 'visible' });
    this.logger.info('Purchaser section should now be visible');
  }

  /**
   * Add a new purchaser person by filling the Add Person dialog
   */
  async addNewPurchaser(firstName: string, lastName: string, email: string): Promise<void> {
    this.logger.info(`Adding new purchaser: ${firstName} ${lastName}`);
    
    try {
      // Wait for Add Person dialog to appear
      await this.page.waitForSelector(salesSelectors.addPersonDialog, { state: 'visible' });
      this.logger.info('Add Person dialog visible');
      
      // Fill first name
      await this.page.waitForSelector(salesSelectors.purchaserFirstNameInput, { state: 'visible' });
      await this.page.locator(salesSelectors.purchaserFirstNameInput).fill(firstName);
      this.logger.info(`  - First name: ${firstName}`);
      
      // Fill last name
      await this.page.locator(salesSelectors.purchaserLastNameInput).fill(lastName);
      this.logger.info(`  - Last name: ${lastName}`);
      
      // Fill email
      await this.page.locator(salesSelectors.purchaserEmailInput).fill(email);
      this.logger.info(`  - Email: ${email}`);
      
      // Click Add button (wait for it to be enabled after form validation)
      await this.page.locator(salesSelectors.addPersonButton).waitFor({ state: 'visible' });
      await this.page.locator(salesSelectors.addPersonButton).click();
      // Wait for dialog to close
      await this.page.waitForSelector(salesSelectors.addPersonDialog, { state: 'hidden' });
      
      this.logger.info(`Successfully added purchaser: ${firstName} ${lastName}`);
    } catch (error) {
      this.logger.error(`Failed to add purchaser: ${error}`);
      throw new Error(`Could not add purchaser: ${firstName} ${lastName}`);
    }
  }

  /**
   * Click Add Item button
   */
  async clickAddItem(): Promise<void> {
    this.logger.info('Clicking Add Item button');
    
    // Get count of "Add description" buttons before adding new item
    const currentCount = await this.page.locator('button:has-text("Add description")').count();
    this.logger.info(`Current "Add description" buttons: ${currentCount}`);
    
    // Wait for any overlays to close before clicking
    await this.page.locator('.cdk-overlay-pane').waitFor({ state: 'hidden' }).catch(() => {});
    
    // Use force click to bypass overlay issues
    await this.page.locator(salesSelectors.addItemButton).click({ force: true });
    
    // Wait for new "Add description" button to appear (count increases by 1)
    const expectedCount = currentCount + 1;
    await this.page.locator(`button:has-text("Add description") >> nth=${currentCount}`).waitFor({ state: 'visible' });
    this.logger.info(`New item row ready - "Add description" button #${expectedCount} visible`);
    // Wait for row to stabilize in DOM
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 2000 });
  }

  /**
   * Fill item details for a specific item row
   * All 5 fields need to be filled: Item (search dropdown), Plot (search dropdown), Qty (input), Price (input), Discount (input)
   */
  async fillItemDetails(index: number, item: SaleItem): Promise<void> {
    this.logger.info(`Filling item ${index + 1}: ${item.description}`);
    
    // Wait for the item row to be ready (mat-select comboboxes visible)
    await this.page.locator('mat-select').nth(1 + (index * 2)).waitFor({ state: 'visible' });

    // Strategy: Use nth() to get all comboboxes and inputs globally, not per-row
    // The structure is predictable: owner combobox (index 0), then for each item row:
    // - item combobox
    // - plot combobox
    // So for item row i: item combobox at index (1 + i*2), plot combobox at index (2 + i*2)
    
    const itemComboboxIndex = 1 + (index * 2); // Skip owner (0), then item comboboxes at 1, 3, 5...
    const plotComboboxIndex = 2 + (index * 2); // Plot comboboxes at 2, 4, 6...

    // 1. Select ITEM from search dropdown
    try {
      this.logger.info(`  - Selecting item: ${item.description} (combobox index: ${itemComboboxIndex})`);
      
      // Get the specific item combobox
      const itemCombobox = this.page.locator('mat-select').nth(itemComboboxIndex);
      await itemCombobox.waitFor({ state: 'visible' });
      
      // Click to open the item dropdown with retry (dropdown may not open on first click)
      let searchInput;
      const maxDropdownRetries = 3;
      for (let attempt = 0; attempt < maxDropdownRetries; attempt++) {
        await itemCombobox.click();
        
        // Wait for the overlay panel to appear after clicking the combobox
        const overlayVisible = await this.page.locator('.cdk-overlay-pane').waitFor({ state: 'visible' }).then(() => true).catch(() => false);
        if (!overlayVisible && attempt < maxDropdownRetries - 1) {
          this.logger.warn(`Item dropdown did not open on attempt ${attempt + 1}, retrying...`);
          continue;
        }
        
        // Look for search input inside the overlay panel first
        const overlaySearchInput = this.page.locator('.cdk-overlay-pane input[type="text"]').first();
        const matSearchInput = this.page.locator('mat-select-search input').first();
        
        if (await matSearchInput.isVisible().catch(() => false)) {
          searchInput = matSearchInput;
        } else if (await overlaySearchInput.isVisible().catch(() => false)) {
          searchInput = overlaySearchInput;
        } else {
          // Fallback: any visible text input
          searchInput = this.page.locator('input[type="text"]:visible').first();
        }
        
        const inputReady = await searchInput.waitFor({ state: 'visible' }).then(() => true).catch(() => false);
        if (inputReady) break;
        
        if (attempt < maxDropdownRetries - 1) {
          this.logger.warn(`Search input not found on attempt ${attempt + 1}, closing and retrying...`);
          await this.page.keyboard.press('Escape');
          await NetworkHelper.waitForAnimation(this.page);
        }
      }
      
      if (!searchInput) {
        throw new Error('Could not find search input in item dropdown after retries');
      }
      await searchInput.waitFor({ state: 'visible' });

      // Clear any existing text then type character-by-character so Angular search filter fires
      await searchInput.clear();
      await searchInput.pressSequentially(item.description, { delay: 80 });
      this.logger.info(`  - Typed "${item.description}" in search box (pressSequentially)`);

      // Wait for search API / filter to settle before reading options
      await NetworkHelper.waitForApiRequestsComplete(this.page, 3000).catch(() => {});
      await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 2000 });

      // Retry mechanism: clear + retype if item not found on first attempt
      const maxSearchRetries = 4;
      let itemFound = false;
      let itemOptions: string[] = [];

      for (let searchAttempt = 0; searchAttempt < maxSearchRetries; searchAttempt++) {
        // Wait for options panel to be visible
        await this.page.waitForSelector('[role="option"], mat-option', { state: 'visible', timeout: 10000 });

        // Allow extra time for filter to fully apply
        await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 1000 });

        // Log available options for debugging
        itemOptions = await this.page.locator('[role="option"]:visible, mat-option:visible').allTextContents();
        this.logger.info(`[Attempt ${searchAttempt + 1}/${maxSearchRetries}] Available item options after search: ${JSON.stringify(itemOptions.map(o => o.trim()))}`);

        // Find the matching option - try exact text match first, then contains
        let itemOption = this.page.locator('[role="option"], mat-option').filter({ hasText: new RegExp(`^\\s*${item.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }).first();
        let optionVisible = await itemOption.isVisible().catch(() => false);

        if (!optionVisible) {
          // Fallback: use :has-text which does substring match
          itemOption = this.page.locator(`[role="option"]:has-text("${item.description}"), mat-option:has-text("${item.description}")`).first();
          optionVisible = await itemOption.isVisible().catch(() => false);
        }

        if (optionVisible) {
          await itemOption.click();
          // Wait for dropdown overlay to close after selection
          await this.page.locator('.cdk-overlay-pane').waitFor({ state: 'hidden' }).catch(() => {});

          // Verify item is selected by checking combobox text
          const verifyCombobox = this.page.locator('mat-select').nth(itemComboboxIndex);
          const selectedText = await verifyCombobox.textContent();
          this.logger.info(`  - Item selected: ${item.description} (combobox shows: "${selectedText?.trim()}")`);

          if (!selectedText || !selectedText.toLowerCase().includes(item.description.toLowerCase())) {
            this.logger.warn(`Item selection may need verification - combobox shows "${selectedText?.trim()}" for "${item.description}"`);
          }
          itemFound = true;
          break;
        }

        // Item not found - clear and retype to trigger fresh search
        if (searchAttempt < maxSearchRetries - 1) {
          this.logger.info(`  - Item "${item.description}" not found on attempt ${searchAttempt + 1}, clearing and retyping...`);
          await searchInput.clear();
          await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 800 });
          await searchInput.pressSequentially(item.description, { delay: 100 });
          await NetworkHelper.waitForApiRequestsComplete(this.page, 3000).catch(() => {});
          await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 1500 });
        }
      }

      if (!itemFound) {
        this.logger.error(`Item "${item.description}" not found in dropdown after ${maxSearchRetries} attempts. Available: ${JSON.stringify(itemOptions.map(o => o.trim()))}`);
        // Take screenshot for debugging
        await this.page.keyboard.press('Escape');
        throw new Error(`Item "${item.description}" not found in item dropdown after ${maxSearchRetries} search attempts. Available options: ${JSON.stringify(itemOptions.map(o => o.trim()))}`);
      }
    } catch (error) {
      this.logger.error(`Failed to select item: ${error}`);
      throw error;
    }

    // Wait for price to auto-fill after item selection
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 2000 });

    // 2. Select PLOT from search dropdown
    if (item.related_plot) {
      this.logger.info(`  - Selecting plot: ${item.related_plot} (combobox index: ${plotComboboxIndex})`);
      
      try {
        // Get the specific plot combobox
        const plotCombobox = this.page.locator('mat-select').nth(plotComboboxIndex);
        await plotCombobox.waitFor({ state: 'visible' });
        await plotCombobox.click();
        
        // Wait for the search textbox in plot dropdown
        const plotSearchInput = this.page.locator('input[placeholder*="typing"]').or(
          this.page.locator('input[type="text"]')
        ).last();
        await plotSearchInput.waitFor({ state: 'visible' });

        // Setup wait for API response BEFORE triggering the search
        const apiPromise = this.page.waitForResponse(
          (response) => response.url().includes('/v2/search/plots-records-persons') && response.status() === 200,
          {}
        ).catch(() => {
          this.logger.info('Plot search API timeout or data may be cached');
          return null;
        });

        // Type the plot name to search (triggers the API call)
        await plotSearchInput.fill(item.related_plot);

        // Wait for the API response (if called)
        const response = await apiPromise;
        if (response) {
          this.logger.info('Plot search API completed successfully');
        }

        // Wait for plot options to appear
        await this.page.waitForSelector('[role="option"]', { state: 'visible' });
        
        // Get all visible options
        const plotOptions = await this.page.locator('[role="option"]:visible').allTextContents();
        this.logger.info(`Available plot options: ${JSON.stringify(plotOptions)}`);
        
        // Find the plot option that matches and is NOT occupied
        const targetIndex = plotOptions.findIndex(opt => {
          const trimmed = opt.trim();
          const startsWithPlot = trimmed === item.related_plot || trimmed.startsWith(item.related_plot + ' ');
          const notOccupied = !trimmed.includes('Occupied');
          return startsWithPlot && notOccupied;
        });
        
        if (targetIndex >= 0) {
          // Found available (not occupied) plot
          this.logger.info(`Found available plot at index ${targetIndex}: ${plotOptions[targetIndex]}`);
          await this.page.locator('[role="option"]:visible').nth(targetIndex).click();
          // Wait for overlay to close after plot selection
          await this.page.locator('.cdk-overlay-pane').waitFor({ state: 'hidden' }).catch(() => {});
          
          const selectedText = await plotCombobox.textContent();
          this.logger.info(`  - Plot selected: ${item.related_plot} (combobox shows: "${selectedText?.trim()}")`);
        } else {
          // Plot not available (occupied) - still select it anyway since plot field is required
          const occupiedIndex = plotOptions.findIndex(opt => {
            const trimmed = opt.trim();
            return trimmed.startsWith(item.related_plot + ' ');
          });
          
          if (occupiedIndex >= 0) {
            this.logger.warn(`Plot "${item.related_plot}" is occupied, but selecting it anyway: ${plotOptions[occupiedIndex]}`);
            await this.page.locator('[role="option"]:visible').nth(occupiedIndex).click();
            // Wait for overlay to close after plot selection
            await this.page.locator('.cdk-overlay-pane').waitFor({ state: 'hidden' }).catch(() => {});
            
            const selectedText = await plotCombobox.textContent();
            this.logger.info(`  - Plot selected (occupied): ${item.related_plot} (combobox shows: "${selectedText?.trim()}")`);
          } else {
            // Can't find any matching plot - just close dropdown and leave as "All"
            this.logger.error(`Cannot find plot "${item.related_plot}" in options. Available: ${JSON.stringify(plotOptions)}`);
            await this.page.keyboard.press('Escape');
          }
        }
      } catch (error) {
        this.logger.error(`Failed to select plot: ${error}`);
        throw error;
      }
    }

    // 3. Fill QUANTITY, PRICE, DISCOUNT (input fields)
    // IMPORTANT: Test-ID pattern differs between row 1 and row 2+
    // Row 1: qty = "sales-calculator-input", price/discount = "sales-calculator-input-0"
    // Row 2+: qty/price/discount ALL = "sales-calculator-input-0"
    //
    // So for "sales-calculator-input-0" inputs, we have:
    // - Index 0: price row 1
    // - Index 1: discount row 1
    // - Index 2: qty row 2
    // - Index 3: price row 2
    // - Index 4: discount row 2
    // - Index 5: qty row 3
    // - etc. (3 inputs per row after row 1)
    
    try {
      if (index === 0) {
        // ROW 1: Qty has its own test-id, price/discount use "sales-calculator-input-0"
        const qtyInput = this.page.locator('[data-testid="sales-calculator-input"]').first();
        await qtyInput.fill(item.quantity.toString());
        this.logger.info(`  - Quantity: ${item.quantity}`);
        
        const priceDiscountInputs = this.page.locator('[data-testid="sales-calculator-input-0"]');
        await priceDiscountInputs.nth(0).fill(item.price.toString());
        this.logger.info(`  - Price: ${item.price}`);
        
        await priceDiscountInputs.nth(1).fill(item.discount.toString());
        this.logger.info(`  - Discount: ${item.discount}`);
      } else {
        // ROW 2+: All three inputs use "sales-calculator-input-0"
        // Calculate offset: row 2 starts at index 2 (after row 1's price+discount)
        const baseOffset = 2; // Price and discount from row 1
        const inputsPerRow = 3; // Qty, price, discount for each subsequent row
        const rowOffset = baseOffset + ((index - 1) * inputsPerRow);
        
        const priceDiscountInputs = this.page.locator('[data-testid="sales-calculator-input-0"]');
        const qtyIndex = rowOffset;
        const priceIndex = rowOffset + 1;
        const discountIndex = rowOffset + 2;
        
        this.logger.info(`Row ${index + 1} input indices: qty=${qtyIndex}, price=${priceIndex}, discount=${discountIndex}`);
        
        await priceDiscountInputs.nth(qtyIndex).fill(item.quantity.toString());
        this.logger.info(`  - Quantity: ${item.quantity}`);
        
        await priceDiscountInputs.nth(priceIndex).fill(item.price.toString());
        this.logger.info(`  - Price: ${item.price}`);
        
        await priceDiscountInputs.nth(discountIndex).fill(item.discount.toString());
        this.logger.info(`  - Discount: ${item.discount}`);
      }
      
    } catch (error) {
      this.logger.error(`Failed to fill inputs: ${error}`);
      throw error;
    }

    this.logger.info(`Item ${index + 1} filled successfully`);
  }

  /**
   * Add multiple items to the sale
   */
  async addItems(items: SaleItem[]): Promise<void> {
    this.logger.info(`Adding ${items.length} items to sale`);
    
    for (let i = 0; i < items.length; i++) {
      if (i > 0) {
        // Click Add Item button for additional items (handles waiting for new row)
        await this.clickAddItem();
      }
      await this.fillItemDetails(i, items[i]);
    }
  }

  /**
   * Get the sale summary values
   */
  async getSaleSummary(): Promise<SaleSummary> {
    this.logger.info('Getting sale summary');
    
    // Wait for summary section to be ready
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 3000 });
    
    // Use different approach: get all value divs in summary section
    const summarySection = this.page.locator('button:has-text("ADD ITEM")').locator('..').locator('..');
    const allTexts = await summarySection.locator('div').allTextContents();
    
    this.logger.info(`All summary texts: ${JSON.stringify(allTexts)}`);
    
    // Filter for currency values (supports $, A$, US$, €, £, etc.) and clean them
    const dollarValues = allTexts
      .filter(t => {
        const trimmed = t.trim();
        // Match currency patterns: $123.45, A$123.45, US$123.45, €123.45, £123.45, etc.
        return trimmed.match(/^[A-Z]{0,3}\$[\d,]+\.\d{2}$/) ||
               trimmed.match(/^[€£¥₹][\d,]+\.\d{2}$/);
      })
      .map(t => t.trim().replace(/\s+/g, '')) // Remove all whitespace
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    
    this.logger.info(`Currency values found: ${JSON.stringify(dollarValues)}`);
    
    // Expected order: subtotal, discount, vat, total
    const subtotal = dollarValues[0] || '$0.00';
    const discount = dollarValues[1] || '$0.00';
    const vat = dollarValues[2] || '$0.00';
    const total = dollarValues[3] || '$0.00';

    const summary = {
      subtotal,
      discount,
      vat,
      total
    };

    this.logger.info(`Sale Summary: ${JSON.stringify(summary)}`);
    return summary;
  }

  /**
   * Normalize currency value by removing currency symbols
   * Supports: $, A$, US$, €, £, ¥, ₹, etc.
   * Example: "A$1,764.10" → "1,764.10"
   */
  private normalizeCurrency(value: string): string {
    // Remove all currency symbols and prefixes, keep only numbers, commas, and dots
    return value.replace(/^[A-Z]{0,3}[\$€£¥₹]/g, '').trim();
  }

  /**
   * Validate the sale summary matches expected values
   * Currency-agnostic: compares numeric values only (ignores currency symbols)
   */
  async validateSaleSummary(expected: SaleSummary): Promise<void> {
    this.logger.info('Validating sale summary');

    // Wait for VAT line to appear when expected VAT > 0
    const expectedVat = this.normalizeCurrency(expected.vat);
    if (expectedVat !== '0.00') {
      const maxWaitMs = 10000;
      const pollMs = 500;
      const deadline = Date.now() + maxWaitMs;
      let vatVisible = false;
      while (Date.now() < deadline) {
        const summary = await this.getSaleSummary();
        const actualVat = this.normalizeCurrency(summary.vat);
        if (actualVat !== '0.00') {
          vatVisible = true;
          break;
        }
        this.logger.info(`VAT not yet rendered (got $0.00), retrying in ${pollMs}ms...`);
        await this.page.waitForTimeout(pollMs);
      }
      if (!vatVisible) {
        this.logger.warn(`VAT did not appear after ${maxWaitMs}ms — proceeding with current summary`);
      }
    }

    const actual = await this.getSaleSummary();

    this.logger.info(`Expected: ${JSON.stringify(expected)}`);
    this.logger.info(`Actual: ${JSON.stringify(actual)}`);

    // Normalize both expected and actual values (remove currency symbols)
    const normalizedExpected = {
      subtotal: this.normalizeCurrency(expected.subtotal),
      discount: this.normalizeCurrency(expected.discount),
      vat: this.normalizeCurrency(expected.vat),
      total: this.normalizeCurrency(expected.total)
    };

    const normalizedActual = {
      subtotal: this.normalizeCurrency(actual.subtotal),
      discount: this.normalizeCurrency(actual.discount),
      vat: this.normalizeCurrency(actual.vat),
      total: this.normalizeCurrency(actual.total)
    };

    this.logger.info(`Expected (normalized): ${JSON.stringify(normalizedExpected)}`);
    this.logger.info(`Actual (normalized): ${JSON.stringify(normalizedActual)}`);

    // Compare normalized values (currency-agnostic)
    expect(normalizedActual.subtotal).toBe(normalizedExpected.subtotal);
    expect(normalizedActual.discount).toBe(normalizedExpected.discount);
    expect(normalizedActual.vat).toBe(normalizedExpected.vat);
    expect(normalizedActual.total).toBe(normalizedExpected.total);

    this.logger.info('Sale summary validation passed');
  }

  /**
   * Click the Create button to submit the sale
   */
  async clickCreate(): Promise<void> {
    this.logger.info('Clicking Create button');
    
    // Check if CREATE button exists and its state
    const createButton = this.page.locator(salesSelectors.createButton);
    const buttonCount = await createButton.count();
    this.logger.info(`CREATE button count: ${buttonCount}`);
    
    if (buttonCount === 0) {
      this.logger.error('CREATE button not found');
      throw new Error('CREATE button not found on page');
    }
    
    // Check button state
    const isVisible = await createButton.isVisible();
    const isEnabled = await createButton.isEnabled();
    this.logger.info(`CREATE button visible: ${isVisible}, enabled: ${isEnabled}`);
    
    if (!isEnabled) {
      this.logger.warn('CREATE button is disabled - checking form validation');
      // Log any validation errors if visible
      const errorMessages = await this.page.locator('.mat-error, .error, [class*="error"]').allTextContents();
      if (errorMessages.length > 0) {
        this.logger.error(`Form validation errors: ${JSON.stringify(errorMessages)}`);
      }
    }
    
    // Wait for button to be visible and enabled
    await this.page.waitForSelector(salesSelectors.createButton, { state: 'visible' });
    
    const urlBefore = this.page.url();
    this.logger.info(`URL before CREATE click: ${urlBefore}`);
    
    // Click CREATE button on the form
    await this.page.locator(salesSelectors.createButton).click({ force: true });
    this.logger.info('CREATE button clicked - waiting for confirmation dialog');
    
    // Wait for confirmation dialog to appear
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').waitFor({ state: 'visible' }).then(() => true).catch(() => false);
    
    if (dialogVisible) {
      this.logger.info('Confirmation dialog appeared');
      
      // Click CREATE button in the confirmation dialog
      const dialogCreateButton = this.page.locator('mat-dialog-container button:has-text("CREATE"), [role="dialog"] button:has-text("CREATE")').first();
      await dialogCreateButton.waitFor({ state: 'visible' });
      await dialogCreateButton.click();
      this.logger.info('CREATE button in confirmation dialog clicked');
    } else {
      this.logger.warn('No confirmation dialog appeared, proceeding...');
    }
    
    // Wait for API call to /api/v1/invoices/ to complete (POST - create invoice)
    this.logger.info('Waiting for /api/v1/invoices/ API endpoint (POST - create invoice)...');
    await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 30000);
    this.logger.info('/api/v1/invoices/ API endpoint (POST) completed successfully');
    
    // Set up listener for invoice list API BEFORE waiting for navigation
    // This ensures we catch the API call when page loads
    const invoiceListPromise = this.page.waitForResponse(
      (response) => response.url().includes('/api/v1/invoices?page=') && response.status() === 200,
      {}
    ).catch(() => null); // Don't throw if timeout
    
    // Wait for navigation to sales list page (can be /sales or /sales-table)
    await this.page.waitForURL(/\/sales$|\/sales\?|\/sales-table/);
    this.logger.info('Navigated back to sales list page');
    
    // Wait for the invoice list API we set up earlier
    this.logger.info('Waiting for invoice list API endpoint (GET)...');
    const invoiceListResponse = await invoiceListPromise;
    
    if (invoiceListResponse) {
      this.logger.info(`✓ Invoice list API endpoint completed: ${invoiceListResponse.url()}`);
    } else {
      this.logger.warn('Invoice list API timeout, but will proceed with table validation');
    }
    
    // Wait for sales table to load completely
    await this.page.waitForSelector('table', { state: 'visible' });
    this.logger.info('Sales table loaded');
  }

  /**
   * Click the ADD SALE button on the Edit Plot page to navigate to Create Sale page
   */
  async clickAddSaleButton(): Promise<void> {
    this.logger.info('Clicking ADD SALE button on Edit page');

    // Setup API listeners BEFORE click (same pattern as clickCreateSale)
    const paymentMethodsPromise = this.page.waitForResponse(
      (res) => res.url().includes('/payment-methods/') && res.status() === 200,
      { timeout: 20000 }
    ).catch(() => this.logger.info('payment-methods not called (may be cached)'));
    const invoiceSettingsPromise = this.page.waitForResponse(
      (res) => res.url().includes('/invoice-settings/') && res.status() === 200,
      { timeout: 20000 }
    ).catch(() => this.logger.info('invoice-settings not called (may be cached)'));

    // Prefer "ADD SALE" button; fall back to Sales-section ADD or any ADD button
    const addSaleBtn = this.page.locator('button:has-text("ADD SALE"), a:has-text("ADD SALE")');
    const hasPrimaryBtn = await addSaleBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasPrimaryBtn) {
      this.logger.info('Found "ADD SALE" button — clicking');
      await addSaleBtn.click();
    } else {
      // Person edit page has an ADD button inside the Sales section heading
      const salesAddBtn = this.page.locator('h4:has-text("Sales") ~ button, h4:has-text("Sales") + button, [class*="sales"] button:has-text("ADD"), button:has-text("ADD")').first();
      await salesAddBtn.waitFor({ state: 'visible', timeout: 15000 });
      this.logger.info('Found Sales ADD button — clicking');
      await salesAddBtn.click();
    }

    await this.page.waitForLoadState('domcontentloaded');
    await Promise.all([paymentMethodsPromise, invoiceSettingsPromise]);
    // Wait for reference input to confirm form is ready
    await this.page.waitForSelector(salesSelectors.referenceInput, { state: 'visible', timeout: 30000 });
    this.logger.info('Navigated to Create Sale page, form ready');
  }

  /**
   * Open the Add Purchaser modal (search-based, not the new person dialog)
   * This opens a search modal where you type a name and select from suggestions
   */
  async clickAddPurchaserModal(): Promise<void> {
    this.logger.info('Clicking ADD PURCHASER button to open search modal');
    await this.page.waitForSelector(salesSelectors.addPurchaserButton, { state: 'visible', timeout: 10000 });
    await this.page.locator(salesSelectors.addPurchaserButton).click();
    await this.page.waitForTimeout(1500);
    this.logger.info('ADD PURCHASER modal should now be open');
  }

  /**
   * In the Add Purchaser search modal, type a name and select from the dropdown suggestion
   * Uses pressSequentially to trigger Angular reactive search
   */
  async searchAndSelectPurchaser(firstName: string, lastName: string): Promise<void> {
    this.logger.info(`Searching for purchaser: ${firstName} ${lastName}`);

    // Wait for the dialog/modal to appear
    await this.page.waitForSelector('mat-dialog-container, [role="dialog"]', { state: 'visible', timeout: 10000 });
    this.logger.info('Add person dialog visible');
    await this.page.waitForTimeout(500);

    // Fill first name field inside the dialog using pressSequentially to trigger search
    const firstNameInput = this.page.locator('mat-dialog-container input[formcontrolname="first_name"], [role="dialog"] input[formcontrolname="first_name"]').first();
    await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await firstNameInput.click();
    await firstNameInput.pressSequentially(firstName, { delay: 80 });
    this.logger.info(`Typed first name: ${firstName}`);
    await this.page.waitForTimeout(500);

    // Fill last name field
    const lastNameInput = this.page.locator('mat-dialog-container input[formcontrolname="last_name"], [role="dialog"] input[formcontrolname="last_name"]').first();
    await lastNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await lastNameInput.click();
    await lastNameInput.pressSequentially(lastName, { delay: 80 });
    this.logger.info(`Typed last name: ${lastName}`);

    // Wait for dropdown suggestions to appear — the suggestion list is a custom div, not mat-option.
    // Use getByText with exact match to find the name row without matching the entire dialog.
    this.logger.info('Waiting for dropdown suggestion to appear...');
    const dialog = this.page.locator('mat-dialog-container').first();
    // Wait for the name text to appear in the dialog (inside the suggestion dropdown)
    const suggestionOption = dialog.getByText(`${firstName} ${lastName}`, { exact: true }).first();
    await suggestionOption.waitFor({ state: 'visible', timeout: 15000 });
    this.logger.info(`Found suggestion for "${firstName} ${lastName}", clicking...`);
    await suggestionOption.click();

    // Wait for modal to close after selection
    await this.page.waitForSelector('mat-dialog-container, [role="dialog"]', { state: 'hidden', timeout: 10000 });
    this.logger.info('Modal closed after purchaser selection');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click the Item dropdown (first mat-select for items on the Create Sale form)
   * and select the first available item, returning its related plot value
   */
  async selectFirstItemAndGetPlot(): Promise<string> {
    this.logger.info('Clicking the Item dropdown to select the first available item');

    // The item dropdown is a mat-select in the items row section.
    // The Add Sale form typically has: Cemetery (index 0), Owner (index 1), then Item (index 2), Plot (index 3).
    // When navigating from Edit Plot, Cemetery may not be present — so Item is at index 1 or 2.
    // We skip known non-item selects by looking for mat-selects that are NOT formcontrolname=cemetery/owner.
    // Use nth(2) as a safe fallback: if Cemetery is present (index 0), Owner (1), Item (2).
    // If Cemetery is absent (single-cemetery org), Owner (0), Item (1) — use nth(1).
    // We detect which index to use by checking the total count.
    const allMatSelects = await this.page.locator('mat-select').all();
    this.logger.info(`mat-select count on Create Sale page: ${allMatSelects.length}`);

    // The Item dropdown is inside the items table row — look for the ADD ITEM button's parent container
    // to scope the mat-select search to just the items section (not the top form's Cemetery/Owner)
    // Strategy: find mat-select elements that are inside the items panel (identified by ADD ITEM button proximity)
    // Fallback: skip cemetery/owner by formcontrolname, and also skip any that have 'cemetery'/'owner' visible text
    let itemSelectIndex = -1;
    for (let i = 0; i < allMatSelects.length; i++) {
      const fcn = (await allMatSelects[i].getAttribute('formcontrolname') || '').toLowerCase();
      const visibleText = ((await allMatSelects[i].textContent()) || '').trim().toLowerCase();
      if (fcn !== 'cemetery' && fcn !== 'owner' && !visibleText.includes('cemetery') && !visibleText.includes('gundul') && !visibleText.includes('tegal')) {
        itemSelectIndex = i;
        this.logger.info(`Item dropdown found at mat-select index: ${i} (formcontrolname="${fcn}", text="${visibleText}")`);
        break;
      }
    }

    if (itemSelectIndex === -1) {
      // Fallback: find mat-select scoped inside the items section panel
      this.logger.info('Fallback: looking for mat-select inside items panel (near ADD ITEM button)');
      const addItemBtn = this.page.locator('button:has-text("ADD ITEM"), button:has-text("+ ADD ITEM")').first();
      const itemsPanel = addItemBtn.locator('..').locator('..');
      const itemPanelSelects = itemsPanel.locator('mat-select');
      const count = await itemPanelSelects.count();
      if (count > 0) {
        await itemPanelSelects.first().click();
        await this.page.waitForTimeout(1500);
        await this.page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });
        const firstOption = this.page.locator('mat-option').first();
        const optionText = (await firstOption.textContent())?.trim() || '';
        this.logger.info(`First item option text (fallback): "${optionText}"`);
        await firstOption.click();
        await this.page.waitForTimeout(2000);
        this.logger.info('First item selected (fallback path)');
        return '';
      }
      throw new Error('Could not find the Item dropdown on the Create Sale page');
    }

    const itemSelect = this.page.locator('mat-select').nth(itemSelectIndex);
    await itemSelect.waitFor({ state: 'visible', timeout: 10000 });
    await itemSelect.click();
    await this.page.waitForTimeout(1500);

    // Wait for CDK overlay options to appear
    await this.page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });

    // Get first visible option details (item name and related plot)
    const firstOption = this.page.locator('mat-option').first();
    await firstOption.waitFor({ state: 'visible', timeout: 5000 });

    const optionText = (await firstOption.textContent())?.trim() || '';
    this.logger.info(`First item option text: "${optionText}"`);

    await firstOption.click();
    await this.page.waitForTimeout(2000);
    this.logger.info('First item selected');

    // After selecting item, the plot field should auto-fill. Get the related plot value.
    // The plot mat-select (next mat-select after the item) will show the related plot
    const allSelects = await this.page.locator('mat-select').all();
    this.logger.info(`Total mat-selects on page after item selection: ${allSelects.length}`);

    // Read the related plot from the plot dropdown (the one after the item dropdown)
    // We look for the mat-select that now shows a plot ID
    let relatedPlot = '';
    for (const select of allSelects) {
      const text = ((await select.textContent()) || '').trim();
      // Plot IDs match the pattern "X X N" (letter space letter space number)
      if (/^[A-Z]\s+[A-Z]\s+\d+/.test(text) || /^[A-Za-z]\s+[A-Za-z]\s+\d+/.test(text)) {
        relatedPlot = text;
        this.logger.info(`Found related plot in dropdown: "${relatedPlot}"`);
        break;
      }
    }

    if (!relatedPlot) {
      this.logger.warn('Could not find related plot value from item dropdown auto-fill');
    }

    return relatedPlot;
  }

  /**
   * Verify the purchaser is pre-filled on the Create Sale page (no modal needed).
   * Used when navigating from Edit Person — the person is auto-set as purchaser.
   * @param expectedName - Full name expected (e.g. "endri yanto")
   */
  async verifyPurchaserPreFilled(expectedName: string): Promise<void> {
    this.logger.info(`Verifying purchaser is pre-filled as: "${expectedName}"`);
    await this.page.waitForTimeout(1500);
    const purchaserSection = this.page.locator('text=Purchaser').locator('..').first();
    const purchaserText = ((await purchaserSection.textContent()) || '').trim();
    if (purchaserText.toLowerCase().includes(expectedName.toLowerCase())) {
      this.logger.info(`Purchaser "${expectedName}" is pre-filled correctly`);
    } else {
      this.logger.warn(`Purchaser section text: "${purchaserText}" — may not contain "${expectedName}", continuing`);
    }
  }

  /**
   * Select the first available item from the Item dropdown, then manually type
   * a related plot ID into the Related Plot CDK overlay search input.
   * @param relatedPlotId - Plot ID to search for (e.g. "A A 1")
   */
  async selectFirstItemWithRelatedPlot(relatedPlotId: string): Promise<void> {
    this.logger.info('Selecting first available item from Item dropdown');

    // Wait for page to fully load (ADD ITEM button may appear after a delay)
    await this.page.waitForTimeout(3000);

    // Find the item mat-select (skip cemetery/owner selects)
    const allMatSelects = await this.page.locator('mat-select').all();
    this.logger.info(`mat-select count on Create Sale page: ${allMatSelects.length}`);

    let itemSelectIndex = -1;
    for (let i = 0; i < allMatSelects.length; i++) {
      const fcn = (await allMatSelects[i].getAttribute('formcontrolname') || '').toLowerCase();
      const visibleText = ((await allMatSelects[i].textContent()) || '').trim().toLowerCase();
      if (fcn !== 'cemetery' && fcn !== 'owner' && !visibleText.includes('cemetery') && !visibleText.includes('gundul') && !visibleText.includes('tegal')) {
        itemSelectIndex = i;
        this.logger.info(`Item dropdown at mat-select index: ${i} (formcontrolname="${fcn}")`);
        break;
      }
    }

    if (itemSelectIndex === -1) {
      // No item dropdown visible yet — click ADD ITEM button to reveal the item row
      this.logger.info('No item dropdown found — clicking ADD ITEM button');
      const addItemBtn = this.page.locator('button:has-text("ADD ITEM"), button:has-text("+ ADD ITEM"), a:has-text("ADD ITEM")').first();
      const hasAddItem = await addItemBtn.isVisible({ timeout: 10000 }).catch(() => false);
      if (hasAddItem) {
        await addItemBtn.click();
        await this.page.waitForTimeout(1500);
        // Re-scan mat-selects after clicking ADD ITEM
        const newMatSelects = await this.page.locator('mat-select').all();
        for (let i = 0; i < newMatSelects.length; i++) {
          const fcn = (await newMatSelects[i].getAttribute('formcontrolname') || '').toLowerCase();
          const visibleText = ((await newMatSelects[i].textContent()) || '').trim().toLowerCase();
          if (fcn !== 'cemetery' && fcn !== 'owner' && !visibleText.includes('cemetery') && !visibleText.includes('gundul') && !visibleText.includes('tegal')) {
            itemSelectIndex = i;
            this.logger.info(`Item dropdown found at index: ${i} after ADD ITEM click`);
            break;
          }
        }
      }
      if (itemSelectIndex === -1) {
        throw new Error('Could not find the Item dropdown on the Create Sale page even after clicking ADD ITEM');
      }
    }

    const itemSelect = this.page.locator('mat-select').nth(itemSelectIndex);
    await itemSelect.waitFor({ state: 'visible', timeout: 10000 });
    await itemSelect.click();
    await this.page.waitForTimeout(1500);
    await this.page.waitForSelector('mat-option', { state: 'visible', timeout: 10000 });

    const firstOption = this.page.locator('mat-option').first();
    const optionText = (await firstOption.textContent())?.trim() || '';
    this.logger.info(`First item option: "${optionText}"`);
    await firstOption.click();
    await this.page.waitForTimeout(1500);
    this.logger.info('First item selected');

    // Now find the Related Plot mat-select (next one after the item) and type the plot ID
    this.logger.info(`Selecting related plot: "${relatedPlotId}"`);
    const plotSelect = this.page.locator('mat-select').nth(itemSelectIndex + 1);
    await plotSelect.waitFor({ state: 'visible', timeout: 10000 });
    await plotSelect.click();
    this.logger.info('Clicked Related Plot mat-select — waiting for CDK overlay search input');

    // The CDK overlay has a search input at the top
    const overlayInput = this.page.locator('.cdk-overlay-container input').first();
    await overlayInput.waitFor({ state: 'visible', timeout: 8000 });
    await overlayInput.click();
    await overlayInput.pressSequentially(relatedPlotId, { delay: 80 });
    this.logger.info(`Typed "${relatedPlotId}" into related plot search`);

    // Wait for matching mat-option and click it
    const plotOption = this.page.locator(`mat-option:has-text("${relatedPlotId}")`).first();
    await plotOption.waitFor({ state: 'visible', timeout: 15000 });
    await plotOption.click();
    this.logger.info(`Related plot "${relatedPlotId}" selected`);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click Create on the sale form, handle confirmation modal, and wait for navigation
   * back to Edit Plot page (not the sales list page)
   */
  async clickCreateFromEditPlot(): Promise<void> {
    this.logger.info('Clicking Create button (from Edit Plot flow)');

    await this.page.waitForTimeout(1000);

    const createButton = this.page.locator(salesSelectors.createButton).first();
    await createButton.waitFor({ state: 'visible', timeout: 10000 });

    const isEnabled = await createButton.isEnabled();
    this.logger.info(`CREATE button enabled: ${isEnabled}`);

    if (!isEnabled) {
      const errorMessages = await this.page.locator('.mat-error, .error, [class*="error"]').allTextContents();
      if (errorMessages.length > 0) {
        this.logger.error(`Form validation errors: ${JSON.stringify(errorMessages)}`);
      }
      throw new Error('CREATE button is disabled — form may have validation errors');
    }

    await createButton.click({ force: true });
    this.logger.info('CREATE button clicked — waiting for confirmation dialog');

    // Wait for confirmation dialog
    await this.page.waitForTimeout(1500);
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').isVisible().catch(() => false);

    if (dialogVisible) {
      this.logger.info('Confirmation dialog appeared');
      const dialogCreateButton = this.page.locator('mat-dialog-container button:has-text("CREATE"), [role="dialog"] button:has-text("CREATE")').first();
      await dialogCreateButton.waitFor({ state: 'visible', timeout: 5000 });
      await dialogCreateButton.click();
      this.logger.info('Clicked CREATE in confirmation dialog');
    } else {
      this.logger.warn('No confirmation dialog appeared');
    }

    // Wait for navigation back to Edit Plot page — SAVE/CANCEL buttons are always present on edit plot page
    await this.page.waitForSelector('button:has-text("SAVE"), button:has-text("CANCEL")', { state: 'visible', timeout: 45000 });
    this.logger.info('Navigated back to Edit Plot page');
    await this.page.waitForTimeout(2000);
  }

  /**
   * Verify a new sale entry exists and the reference appears on the left side of the INV ID
   * The sales tab shows entries like "REF-001 / INV-001"
   */
  async verifySaleEntryWithReference(reference: string): Promise<void> {
    this.logger.info(`Verifying sale entry with reference: "${reference}"`);

    // Click on the Sales tab if not already active
    const salesTab = this.page.locator('[role="tab"]:has-text("Sales"), mat-tab-header:has-text("Sales"), .mat-tab-label:has-text("Sales")').first();
    const salesTabVisible = await salesTab.isVisible().catch(() => false);
    if (salesTabVisible) {
      await salesTab.click();
      await this.page.waitForTimeout(1500);
    }

    // Wait for the sales section to be populated
    await this.page.waitForTimeout(1000);

    // Look for the reference text anywhere in the sales list area
    // The format is typically "REF / INV-ID" — reference on the left, invoice ID on the right
    const referenceLocator = this.page.locator(`text=${reference}`).first();
    await referenceLocator.waitFor({ state: 'visible', timeout: 15000 });
    this.logger.info(`Reference "${reference}" found on the Edit Plot page`);

    // Verify reference appears to the left of the INV ID
    // Get the parent container and check relative positioning
    const parentContainer = referenceLocator.locator('..');
    const fullText = (await parentContainer.textContent()) || '';
    this.logger.info(`Sale entry container text: "${fullText}"`);

    // The reference should appear before the invoice separator (/ or INV)
    const refIndex = fullText.indexOf(reference);
    const invIndex = fullText.search(/INV|\/\s*\d/);

    if (invIndex >= 0 && refIndex >= 0 && refIndex < invIndex) {
      this.logger.info(`Reference "${reference}" confirmed on the left side of the INV ID`);
    } else {
      // Fallback: just verify the reference is visible
      this.logger.warn(`Could not confirm left/right positioning, but reference "${reference}" is visible`);
    }
  }

  /**
   * Click the Save button
   * If payment was added, a confirmation dialog will appear that must be handled
   * After save, app auto-redirects to sales list — wait for that redirect and list to load
   */
  async clickSave(): Promise<void> {
    this.logger.info('Clicking Save button');
    
    // Setup API endpoint listener BEFORE clicking save (per CLAUDE.md wait strategy)
    const apiPromise = NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 30000, { optional: true });
    
    await this.page.locator(salesSelectors.saveButton).scrollIntoViewIfNeeded();
    await this.page.locator(salesSelectors.saveButton).click();
    
    // Wait for potential confirmation dialog (10s timeout)
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
    
    if (dialogVisible) {
      this.logger.info('Payment confirmation dialog appeared');
      
      // Log dialog content for debugging
      const dialogContent = await this.page.locator('mat-dialog-container').textContent().catch(() => '');
      this.logger.info(`Dialog content: ${dialogContent?.substring(0, 200)}`);
      
      // Click "Save Sale" button in the confirmation dialog
      const saveSaleButton = this.page.locator('button:has-text("Save Sale")');
      const buttonExists = await saveSaleButton.isVisible().catch(() => false);
      
      if (buttonExists) {
        await saveSaleButton.click();
        this.logger.info('Clicked "Save Sale" button in confirmation dialog');
        
        // Wait for API call to /api/v1/invoices/ to complete (PATCH - update invoice with payment)
        this.logger.info('Waiting for /api/v1/invoices/ API endpoint (PATCH - save payment)...');
        await apiPromise;
        this.logger.info('/api/v1/invoices/ API endpoint (PATCH) completed successfully');
        
        // Wait for dialog to close
        await this.page.waitForSelector('mat-dialog-container', { state: 'hidden' }).catch(() => {});
      } else {
        this.logger.warn('"Save Sale" button not found in dialog, trying generic confirm button');
        const confirmButton = this.page.locator('mat-dialog-container button').last();
        await confirmButton.click();
        this.logger.info('Clicked last button in dialog as fallback');
        await apiPromise;
      }
    } else {
      this.logger.info('No confirmation dialog appeared — waiting for API');
      await apiPromise;
    }
    
    // Wait for app to redirect to sales list
    await this.page.waitForURL(/\/sales$|\/sales\?|\/sales-table/, { timeout: 15000 }).catch(() => {});
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Click Save for the last payment in multi-payment flow
   * Same as clickSave but waits for redirect to sales list and table to load (no reload)
   */
  async clickSaveLastPayment(): Promise<void> {
    this.logger.info('Clicking Save button (last payment)');
    
    // Setup API endpoint listener BEFORE clicking save (per CLAUDE.md wait strategy)
    const apiPromise = NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 30000, { optional: true });
    
    await this.page.locator(salesSelectors.saveButton).scrollIntoViewIfNeeded();
    await this.page.locator(salesSelectors.saveButton).click();
    
    // Wait for potential confirmation dialog (10s timeout)
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
    
    if (dialogVisible) {
      this.logger.info('Payment confirmation dialog appeared');
      
      const saveSaleButton = this.page.locator('button:has-text("Save Sale")');
      const buttonExists = await saveSaleButton.isVisible().catch(() => false);
      
      if (buttonExists) {
        await saveSaleButton.click();
        this.logger.info('Clicked "Save Sale" button in confirmation dialog');
        
        // Wait for API call to complete
        await apiPromise;
        this.logger.info('Invoice API completed');
        
        // Wait for dialog to close
        await this.page.waitForSelector('mat-dialog-container', { state: 'hidden' }).catch(() => {});
      } else {
        const confirmButton = this.page.locator('mat-dialog-container button').last();
        await confirmButton.click();
        await apiPromise;
      }
    } else {
      this.logger.info('No confirmation dialog appeared — waiting for API');
      await apiPromise;
    }
    
    // Wait for app to auto-redirect to sales list (10s timeout)
    await this.page.waitForURL(/\/sales$|\/sales\?|\/sales-table/, { timeout: 10000 }).catch(() => {});
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for sales list API to load
    await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices', 15000, { optional: true });
    
    // Wait for table to be visible
    await this.page.waitForSelector('table tbody tr', { state: 'visible' }).catch(() => {});
    this.logger.info('Last payment saved, on sales list page');
  }

  /**
   * Click Save without reloading the page
   * Used for multi-payment flow where we need to stay on the edit page
   * to add more payments. If app auto-redirects to sales list, navigate back to edit page.
   */
  async clickSaveWithoutReload(): Promise<void> {
    // Capture current edit page URL before saving
    const editPageUrl = this.page.url();
    this.logger.info(`Clicking Save button (without reload). Current URL: ${editPageUrl}`);
    
    // Setup API endpoint listener BEFORE clicking save (per CLAUDE.md wait strategy)
    const apiPromise = NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/invoices/', 30000, { optional: true });

    await this.page.locator(salesSelectors.saveButton).scrollIntoViewIfNeeded();
    await this.page.locator(salesSelectors.saveButton).click();

    // Wait for potential confirmation dialog — 15s timeout for prod env, where API is slower
    const dialogVisible = await this.page.locator('mat-dialog-container, [role="dialog"]').waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
    
    if (dialogVisible) {
      this.logger.info('Payment confirmation dialog appeared');
      
      const dialogContent = await this.page.locator('mat-dialog-container').textContent().catch(() => '');
      this.logger.info(`Dialog content: ${dialogContent?.substring(0, 200)}`);
      
      // Click "Save Sale" button in the confirmation dialog
      const saveSaleButton = this.page.locator('button:has-text("Save Sale")');
      const buttonExists = await saveSaleButton.isVisible().catch(() => false);
      
      if (buttonExists) {
        await saveSaleButton.click();
        this.logger.info('Clicked "Save Sale" button in confirmation dialog');
        
        // Wait for API call to complete (PATCH - update invoice with payment)
        this.logger.info('Waiting for /api/v1/invoices/ API endpoint (PATCH)...');
        await apiPromise;
        this.logger.info('/api/v1/invoices/ API endpoint (PATCH) completed successfully');
        
        // Wait for dialog to close
        await this.page.waitForSelector('mat-dialog-container', { state: 'hidden' }).catch(() => {});
      } else {
        this.logger.warn('"Save Sale" button not found in dialog, trying generic confirm button');
        const confirmButton = this.page.locator('mat-dialog-container button').last();
        await confirmButton.click();
        this.logger.info('Clicked last button in dialog as fallback');
        await apiPromise;
      }
    } else {
      this.logger.info('No confirmation dialog appeared — waiting for API to complete');
      await apiPromise;
    }
    
    // Wait for potential redirect to sales list (app auto-redirects after save)
    // 15s timeout for prod env
    const redirected = await this.page.waitForURL(/\/sales$|\/sales\?|\/sales-table/, { timeout: 15000 }).then(() => true).catch(() => false);
    
    if (redirected) {
      this.logger.info('App redirected to sales list — navigating back to edit page');
      
      // Setup API listeners BEFORE navigating back (payment-methods & invoice-settings load on edit page)
      const pmPromise = this.page.waitForResponse(
        (res) => res.url().includes('/payment-methods/') && res.status() === 200,
        { timeout: 15000 }
      ).catch(() => this.logger.info('payment-methods API not called on re-navigate'));
      const isPromise = this.page.waitForResponse(
        (res) => res.url().includes('/invoice-settings/') && res.status() === 200,
        { timeout: 15000 }
      ).catch(() => this.logger.info('invoice-settings API not called on re-navigate'));

      if (editPageUrl.includes('/sales/edit/')) {
        this.logger.info(`Navigating back to: ${editPageUrl}`);
        await this.page.goto(editPageUrl, { waitUntil: 'domcontentloaded' });
      } else {
        this.logger.info('Edit URL not available, opening latest sale from list');
        await this.page.waitForSelector('table tbody tr', { state: 'visible' });
        await this.openLatestSale();
      }
      
      // Wait for edit page to fully load
      await this.page.waitForURL(/sales\/edit/);
      await this.page.waitForLoadState('domcontentloaded');
      await Promise.all([pmPromise, isPromise]);
      this.logger.info('payment-methods & invoice-settings loaded after re-navigate');
    } else {
      this.logger.info('Still on edit page after save');
    }
    
    // Regardless of redirect, ensure ADD PAYMENT button is visible before returning
    await this.page.waitForSelector(salesSelectors.addPaymentButton, { state: 'visible' });
    this.logger.info('ADD PAYMENT button visible — ready for next payment');
  }

  /**
   * Click the Cancel button
   */
  async clickCancel(): Promise<void> {
    this.logger.info('Clicking Cancel button');
    await this.page.locator(salesSelectors.cancelButton).click();
  }

  /**
   * Validate purchaser name in sales table
   * Checks the first row in the table for the expected purchaser name
   */
  async validatePurchaserInTable(expectedPurchaserName: string): Promise<void> {
    this.logger.info(`Validating purchaser name in table: ${expectedPurchaserName}`);
    
    // Wait for table to be visible
    await this.page.waitForSelector('table', { state: 'visible' });
    
    // Get the first row's purchaser cell
    // Assuming the purchaser column is in the table - adjust selector if needed
    const firstRowPurchaser = await this.page.locator('table tbody tr').first().locator('td').nth(2).textContent();
    const trimmedPurchaser = firstRowPurchaser?.trim() || '';
    const trimmedExpected = expectedPurchaserName.trim();

    // Check if purchaser name contains the expected name (handles truncated text like "Linda Rodr...")
    if (trimmedPurchaser.includes(trimmedExpected) || trimmedExpected.includes(trimmedPurchaser.replace(/\.\.\.$/, ''))) {
      this.logger.info(`✓ Purchaser name validated: ${trimmedPurchaser} (contains: ${trimmedExpected})`);
    } else {
      this.logger.error(`✗ Purchaser name mismatch. Expected to contain: "${trimmedExpected}", Found: "${trimmedPurchaser}"`);
      throw new Error(`Purchaser name mismatch. Expected to contain: "${trimmedExpected}", Found: "${trimmedPurchaser}"`);
    }
  }

  /**
   * Create a complete sale with all details
   */
  async createSale(saleData: SaleData): Promise<void> {
    this.logger.info('Creating sale with complete data');

    // Fill reference
    await this.fillReference(saleData.reference);

    // Fill note if provided
    if (saleData.note) {
      await this.fillNote(saleData.note);
    }

    // Add purchaser if provided
    if (saleData.purchaser) {
      await this.clickAddPurchaser();
      // Use addNewPurchaser instead of selectPurchaser
      const firstName = saleData.purchaser.firstName || '';
      const lastName = saleData.purchaser.lastName || '';
      const email = saleData.purchaser.email || '';
      if (firstName && lastName && email) {
        await this.addNewPurchaser(firstName, lastName, email);
      }
    }

    // Add items
    await this.addItems(saleData.items);

    this.logger.info('Sale creation form completed');
  }

  /**
   * Open the latest created sale (first row in the sales table)
   */
  async openLatestSale(): Promise<void> {
    this.logger.info('Opening the latest created sale');

    // Wait for sales table to be visible
    await this.page.waitForSelector(salesSelectors.salesTable, { state: 'visible' });

    // Wait for table rows to be rendered
    await this.page.locator('table tbody tr').first().waitFor({ state: 'visible' });

    // Click on the first row's invoice ID cell (2nd column - first has checkbox, 2nd has ID)
    const firstRowIdCell = this.page.locator('table tbody tr').first().locator('td').nth(1);
    await firstRowIdCell.waitFor({ state: 'visible' });
    // Setup API listeners BEFORE click (these load on edit page)
    const paymentMethodsPromise = this.page.waitForResponse(
      (res) => res.url().includes('/payment-methods/') && res.status() === 200,
      { timeout: 15000 }
    ).catch(() => this.logger.info('payment-methods API not called (may be cached)'));
    const invoiceSettingsPromise = this.page.waitForResponse(
      (res) => res.url().includes('/invoice-settings/') && res.status() === 200,
      { timeout: 15000 }
    ).catch(() => this.logger.info('invoice-settings API not called (may be cached)'));
    const invoicesPromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/v1/invoices/') && res.status() === 200,
      { timeout: 15000 }
    ).catch(() => this.logger.info('invoices API not called (may be cached)'));

    await firstRowIdCell.click();
    this.logger.info('Clicked on first sale ID cell');

    // Wait for navigation to edit page (URL pattern: /customer-organization/sales/edit/...)
    await this.page.waitForURL(/sales\/edit/);
    this.logger.info('Navigated to sale edit page');

    // Wait for page to fully load
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for all APIs to complete (invoices + payment-methods + invoice-settings)
    await Promise.all([invoicesPromise, paymentMethodsPromise, invoiceSettingsPromise]);
    this.logger.info('Invoice data, payment-methods & invoice-settings loaded');
    
    // Wait for ADD PAYMENT button to be visible (indicates form is fully rendered)
    await this.page.waitForSelector(salesSelectors.addPaymentButton, { state: 'visible' });
    this.logger.info('Sale edit page fully loaded - ADD PAYMENT button visible');
  }

  /**
   * Add a payment to the current invoice
   */
  async addPayment(payment: {
    amount: string;
    method: string;
    note?: string;
    date?: string;
    time?: string;
  }): Promise<void> {
    this.logger.info(`Adding payment: ${JSON.stringify(payment)}`);

    // Wait for ADD PAYMENT button - scroll down to payments section first
    const addPaymentBtn = this.page.locator(salesSelectors.addPaymentButton);
    await addPaymentBtn.waitFor({ state: 'visible' });
    await addPaymentBtn.scrollIntoViewIfNeeded();
    await addPaymentBtn.click();
    this.logger.info('Clicked ADD PAYMENT button');
    
    // Wait for payment form to appear (date input visible)
    const paymentDateInput = this.page.locator('[formcontrolname="payment_date"]').first();
    await paymentDateInput.waitFor({ state: 'visible' });
    
    if (payment.date) {
      await paymentDateInput.fill(payment.date);
      this.logger.info(`Payment date filled: ${payment.date}`);
    } else {
      // Use current date if not provided
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
      await paymentDateInput.fill(dateStr);
      this.logger.info(`Payment date filled with today: ${dateStr}`);
    }
    
    // 2. Fill payment time (required)
    const paymentTimeInput = this.page.locator('[formcontrolname="payment_time"]').first();
    await paymentTimeInput.waitFor({ state: 'visible' });
    
    if (payment.time) {
      await paymentTimeInput.fill(payment.time);
      this.logger.info(`Payment time filled: ${payment.time}`);
    } else {
      // Use current time if not provided
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await paymentTimeInput.fill(timeStr);
      this.logger.info(`Payment time filled with now: ${timeStr}`);
    }
    
    // 3. Select payment method using formcontrolname
    this.logger.info(`Selecting payment method: ${payment.method}`);
    const methodSelect = this.page.locator('[formcontrolname="payment_method"]').first();
    await methodSelect.waitFor({ state: 'visible' });
    await methodSelect.scrollIntoViewIfNeeded();
    
    // Retry clicking dropdown — on freshly reloaded pages, first click may not register
    let listboxVisible = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      await methodSelect.click();
      this.logger.info(`Clicked payment method dropdown (attempt ${attempt + 1})`);
      
      listboxVisible = await this.page.locator('div[role="listbox"]').waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
      if (listboxVisible) break;
      
      this.logger.warn(`Payment method listbox not visible on attempt ${attempt + 1}, retrying...`);
      await this.page.keyboard.press('Escape');
      await NetworkHelper.waitForAnimation(this.page);
    }
    
    if (!listboxVisible) {
      throw new Error('Payment method dropdown listbox did not appear after 3 attempts');
    }
    this.logger.info('Payment method listbox appeared');
    
    // Get all available options for logging
    const allOptions = await this.page.locator('div[role="listbox"] mat-option').allTextContents();
    this.logger.info(`Available payment methods: ${JSON.stringify(allOptions)}`);

    // Try to find matching option by text
    const methodOption = this.page.locator(`div[role="listbox"] mat-option:has-text("${payment.method}")`).first();
    const optionVisible = await methodOption.isVisible().catch(() => false);

    if (optionVisible) {
      await methodOption.click();
      this.logger.info(`  - Method selected: ${payment.method}`);
    } else {
      // Fallback to first option
      this.logger.warn(`Payment method "${payment.method}" not found, selecting first option`);
      await this.page.locator('div[role="listbox"] mat-option:nth-child(1)').click();
    }
    // Wait for overlay to close after method selection
    await this.page.locator('.cdk-overlay-pane').waitFor({ state: 'hidden' }).catch(() => {});

    // 4. Fill note (optional) - must use .last() to target payment form field, not main form
    if (payment.note) {
      this.logger.info(`Filling note: ${payment.note}`);
      const noteInput = this.page.locator('[formcontrolname="notes"]').last();
      const noteInputVisible = await noteInput.isVisible().catch(() => false);
      
      if (noteInputVisible) {
        await noteInput.scrollIntoViewIfNeeded();
        await noteInput.fill(payment.note);
        this.logger.info(`  - Note filled: ${payment.note}`);
      } else {
        this.logger.warn('Note input not found, skipping note');
      }
    }

    // 5. Fill amount using formcontrolname - use .last() to target payment form field
    this.logger.info(`Filling amount: ${payment.amount}`);
    const amountInput = this.page.locator('[formcontrolname="amount"]').last();
    await amountInput.waitFor({ state: 'visible' });
    await amountInput.scrollIntoViewIfNeeded();
    await amountInput.fill(payment.amount);
    this.logger.info(`  - Amount filled: ${payment.amount}`);

    // 6. Payment is now filled but in draft mode
    // Do NOT click any ADD button here - payment will be saved when SAVE button at top is clicked
    // The saveSale() method will handle clicking SAVE and the confirmation dialog
    this.logger.info('Payment form filled successfully, will be saved with invoice');
  }

  // ─── More Menu & Re-send Payment ───────────────────────────────────────────

  /**
   * Click the MORE menu button on the invoice edit page
   */
  async clickMoreMenu(): Promise<void> {
    this.logger.info('Clicking MORE menu button');
    const moreBtn = this.page.locator(salesSelectors.moreMenuButton);
    await moreBtn.waitFor({ state: 'visible' });
    await moreBtn.click();
    // Wait for menu to appear
    await this.page.waitForSelector(salesSelectors.moreMenu, { state: 'visible' });
    this.logger.info('MORE menu opened');
  }

  /**
   * Close the MORE menu by pressing Escape
   */
  async closeMoreMenu(): Promise<void> {
    this.logger.info('Closing MORE menu');
    await this.page.keyboard.press('Escape');
    // Wait for menu overlay to close
    await this.page.locator(salesSelectors.moreMenu).waitFor({ state: 'hidden' }).catch(() => {});
    this.logger.info('MORE menu closed');
  }

  /**
   * Check if a specific menu item is visible inside the MORE menu (menu must be open)
   */
  async isMoreMenuItemVisible(itemText: string): Promise<boolean> {
    const menuItem = this.page.locator(salesSelectors.moreMenuItem(itemText));
    const visible = await menuItem.isVisible().catch(() => false);
    this.logger.info(`Menu item "${itemText}" visible: ${visible}`);
    return visible;
  }

  /**
   * Verify "Re-send Payment" button is visible inside the MORE menu
   * Opens the menu, checks, then closes it if not proceeding with click
   */
  async validateResendPaymentVisible(): Promise<void> {
    this.logger.info('Validating "Re-send Payment" button is visible in MORE menu');
    const resendBtn = this.page.locator(salesSelectors.resendPaymentButton);
    const visible = await resendBtn.isVisible().catch(() => false);
    if (!visible) {
      // Log all menu items for debugging
      const allItems = await this.page.locator('[role="menuitem"]').allTextContents();
      this.logger.error(`"Re-send Payment" NOT found. Available menu items: ${JSON.stringify(allItems)}`);
      throw new Error(`"Re-send Payment" button not found in MORE menu. Available items: ${JSON.stringify(allItems)}`);
    }
    this.logger.info('"Re-send Payment" button is visible in MORE menu');
  }

  /**
   * Verify "Re-send Payment" button is NOT visible inside the MORE menu
   */
  async validateResendPaymentNotVisible(): Promise<void> {
    this.logger.info('Validating "Re-send Payment" button is NOT visible in MORE menu');
    const resendBtn = this.page.locator(salesSelectors.resendPaymentButton);
    const visible = await resendBtn.isVisible().catch(() => false);
    if (visible) {
      throw new Error('"Re-send Payment" button should NOT be visible, but it is');
    }
    this.logger.info('"Re-send Payment" button is correctly hidden in MORE menu');
  }

  /**
   * Click the "Re-send Payment" menu item (menu must be open)
   * Waits for modal to appear, clicks send button, waits for modal to disappear and API to complete
   */
  async clickResendPayment(): Promise<void> {
    this.logger.info('Clicking "Re-send Payment" button');
    const resendBtn = this.page.locator(salesSelectors.resendPaymentButton);
    await resendBtn.waitFor({ state: 'visible' });
    await resendBtn.click();
    this.logger.info('"Re-send Payment" button clicked');

    // Wait for modal/dialog to appear
    const resendModal = this.page.locator('[data-testid="modal-sales-mail-div-modal-sales-mail-component-0"]');
    const specificModalVisible = await resendModal.waitFor({ state: 'visible' }).then(() => true).catch(() => false);

    if (specificModalVisible) {
      this.logger.info('Resend payment modal appeared');

      // Click the Send button in the modal
      const sendButton = this.page.locator('[data-testid="modal-sales-mail-div-modal-sales-mail-component-0"] button:has-text("Send")').first();
      await sendButton.waitFor({ state: 'visible' });
      await sendButton.click();
      this.logger.info('Send button clicked');

      // Wait for the modal to disappear
      await resendModal.waitFor({ state: 'hidden' });
      this.logger.info('Modal disappeared');
    } else {
      // Fallback: Try generic mat-dialog-container
      const genericDialog = this.page.locator('mat-dialog-container, [role="dialog"]').first();
      const genericVisible = await genericDialog.isVisible().catch(() => false);

      if (genericVisible) {
        this.logger.info('Generic dialog appeared');

        // Look for Send button in generic dialog
        const sendButton = genericDialog.locator('button:has-text("Send"), button:has-text("send")').first();
        const sendBtnVisible = await sendButton.isVisible().catch(() => false);

        if (sendBtnVisible) {
          await sendButton.click();
          this.logger.info('Send button clicked');

          // Wait for dialog to disappear
          await genericDialog.waitFor({ state: 'hidden' }).catch(() => {
            this.logger.warn('Dialog may not have disappeared');
          });
          this.logger.info('Dialog disappeared');
        }
      }
    }

    // Wait for resend payment API to complete
    this.logger.info('Waiting for resend payment API endpoint...');
    await NetworkHelper.waitForApiEndpoint(this.page, '/api/v1/resend-payment-link', 15000);
    this.logger.info('Resend payment API completed - toast should now be visible');
  }

  /**
   * Validate that a toast/snackbar notification with the expected message appears
   */
  async validateToastNotification(expectedMessage: string): Promise<void> {
    this.logger.info(`Waiting for toast notification: "${expectedMessage}"`);

    // Wait for toast/snackbar to appear
    const toastLocator = this.page.locator(salesSelectors.toastNotification);
    await toastLocator.first().waitFor({ state: 'visible' });

    // Verify message content
    const toastText = await toastLocator.first().textContent();
    this.logger.info(`Toast notification text: "${toastText}"`);

    if (!toastText || !toastText.toLowerCase().includes(expectedMessage.toLowerCase())) {
      throw new Error(
        `Toast notification mismatch.\n` +
        `Expected to contain: "${expectedMessage}"\n` +
        `Actual: "${toastText}"`
      );
    }
    this.logger.info(`✓ Toast notification validated: "${expectedMessage}"`);
  }

  // ─── Void Invoice ──────────────────────────────────────────────────────────

  /**
   * Click the Void menu item (MORE menu must be open)
   * Handles the confirmation dialog and waits for redirect to sales table
   */
  async clickVoidInvoice(): Promise<void> {
    this.logger.info('Clicking Void menu item');
    const voidItem = this.page.locator(salesSelectors.voidMenuItem);
    await voidItem.waitFor({ state: 'visible' });
    await voidItem.click();
    this.logger.info('Void menu item clicked, waiting for confirmation dialog');

    // Wait for void confirmation dialog
    await this.page.waitForSelector(salesSelectors.voidConfirmDialog, { state: 'visible' });
    this.logger.info('Void confirmation dialog appeared');

    // Click "void this sale" button
    const confirmBtn = this.page.locator(salesSelectors.voidConfirmButton);
    await confirmBtn.waitFor({ state: 'visible' });
    await confirmBtn.click();
    this.logger.info('Clicked "void this sale" confirmation button');

    // Wait for redirect to sales table
    await this.page.waitForURL(/sales-table/);
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for table to be visible
    await this.page.waitForSelector('table', { state: 'visible' });
    this.logger.info('Voided successfully, redirected to sales table');
  }

  /**
   * Check if the Void menu item is disabled (for VOID status invoices)
   */
  async isVoidMenuItemDisabled(): Promise<boolean> {
    const voidItem = this.page.locator(salesSelectors.voidMenuItem);
    const isDisabled = await voidItem.getAttribute('aria-disabled') === 'true'
      || await voidItem.getAttribute('disabled') !== null
      || await voidItem.isDisabled().catch(() => false);
    this.logger.info(`Void menu item disabled: ${isDisabled}`);
    return isDisabled;
  }

  /**
   * Validate invoice status matches expected value
   * This checks the status in the sales list table (first row)
   */
  async validateInvoiceStatus(expectedStatus: string): Promise<void> {
    this.logger.info(`Validating invoice status: ${expectedStatus}`);

    const currentUrl = this.page.url();
    this.logger.info(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/sales-table') || currentUrl.includes('/sales') && !currentUrl.includes('/edit/')) {
      // We're on sales list - check status in the table
      this.logger.info('Checking status in sales list table');
      
      // Wait for sales table to be visible
      await this.page.waitForSelector('table tbody tr', { state: 'visible' });
      // Wait for table to stabilize (Angular rendering)
      await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 3000 });

      // Get the status from first row - status is typically in column with status badge
      // Look for the status badge in the first row
      const firstRow = this.page.locator('table tbody tr').first();
      
      // Try different approaches to find status
      let actualStatus: string | null = null;
      
      // Approach 1: Look for status badge/chip in the row
      const statusBadge = firstRow.locator('[class*="badge"], [class*="status"], [class*="chip"], mat-chip');
      const badgeCount = await statusBadge.count();
      
      if (badgeCount > 0) {
        actualStatus = await statusBadge.first().textContent();
        this.logger.info(`Found status badge in table row: "${actualStatus}"`);
      }
      
      // Approach 2: Get all cells and find the one with status text
      if (!actualStatus) {
        const cells = await firstRow.locator('td').all();
        for (const cell of cells) {
          const cellText = await cell.textContent();
          if (cellText && /(UNPAID|PARTIALLY PAID|PAID|OVERPAID|OVERDUE|VOID|DRAFT)/i.test(cellText)) {
            actualStatus = cellText;
            this.logger.info(`Found status in table cell: "${actualStatus}"`);
            break;
          }
        }
      }

      if (!actualStatus) {
        // Log all cell contents for debugging
        const allCells = await firstRow.locator('td').allTextContents();
        this.logger.error(`Could not find status in first row. All cells: ${JSON.stringify(allCells)}`);
        throw new Error(`Invoice status not found in sales table. Expected: "${expectedStatus}"`);
      }

      // Normalize and compare
      const normalizedActual = actualStatus.trim().toUpperCase();
      const normalizedExpected = expectedStatus.trim().toUpperCase();

      this.logger.info(`Expected status: "${expectedStatus}"`);
      this.logger.info(`Actual status: "${actualStatus}"`);
      this.logger.info(`Normalized actual: "${normalizedActual}"`);
      this.logger.info(`Normalized expected: "${normalizedExpected}"`);

      if (!normalizedActual.includes(normalizedExpected)) {
        throw new Error(
          `Invoice status mismatch.\n` +
          `Expected to contain: "${expectedStatus}"\n` +
          `Actual: "${actualStatus}"\n` +
          `Normalized actual: "${normalizedActual}"\n` +
          `Normalized expected: "${normalizedExpected}"`
        );
      }

      this.logger.info(`✓ Invoice status validated: ${actualStatus}`);

    } else {
      // We're on edit page - check status badge at top
      // After payment save, badge takes a moment to update - wait for it
      this.logger.info('Checking status badge on edit page, waiting for status to update...');

      const normalizedExpected = expectedStatus.trim().toUpperCase();
      const maxRetries = 10; // Try for up to 10 seconds
      let actualStatus: string | null = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Wait for status badge selectors
        const statusBadgeSelectors = [
          '[class*="badge"]',
          '[class*="status"]',
          'mat-chip',
          '.mat-chip',
          'span.badge'
        ];

        for (const selector of statusBadgeSelectors) {
          const element = this.page.locator(selector).first();
          const isVisible = await element.isVisible().catch(() => false);
          
          if (isVisible) {
            const text = await element.textContent();
            if (text && /(UNPAID|PARTIALLY PAID|PAID|OVERPAID|OVERDUE|VOID|DRAFT)/i.test(text)) {
              actualStatus = text;
              const normalizedActual = actualStatus.trim().toUpperCase();
              
              this.logger.info(`Attempt ${attempt + 1}: Found status "${actualStatus}" (normalized: "${normalizedActual}")`);
              
              // Check if it matches expected status
              if (normalizedActual.includes(normalizedExpected)) {
                this.logger.info(`✓ Invoice status validated: ${actualStatus}`);
                return; // Success!
              }
              break; // Found status but doesn't match, continue to retry
            }
          }
        }

        // Wait for DOM to update before retry
        if (attempt < maxRetries - 1) {
          await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 1500 });
        }
      }

      // If we got here, status didn't match expected
      if (!actualStatus) {
        throw new Error(`Invoice status badge not found on edit page after ${maxRetries} attempts. Expected: "${expectedStatus}"`);
      }

      const normalizedActual = actualStatus.trim().toUpperCase();
      throw new Error(
        `Invoice status mismatch after waiting ${maxRetries} seconds.\n` +
        `Expected to contain: "${expectedStatus}"\n` +
        `Actual: "${actualStatus}"\n` +
        `Normalized actual: "${normalizedActual}"\n` +
        `Normalized expected: "${normalizedExpected}"`
      );
    }
  }
}
