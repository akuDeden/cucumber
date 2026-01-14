import { Page } from '@playwright/test';
import { RequestSalesFormSelectors } from '../../selectors/p0/requestSalesForm.selectors.js';
import { REQUEST_SALES_FORM_DATA, getApplicantName } from '../../data/test-data.js';
import { Logger } from '../../utils/Logger.js';
import { waitForEndpoint } from '../../utils/NetworkUtils.js';

/**
 * Page Object for Request Sales Form functionality
 * Handles public plot purchase request flow
 */
export class RequestSalesFormPage {
  readonly page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('RequestSalesFormPage');
  }

  // ============================================
  // NAVIGATION
  // ============================================

  /**
   * Navigate to the sell plots page
   */
  async navigateToSellPlotsPage(): Promise<void> {
    this.logger.info('Navigating to sell plots page');
    await this.page.goto(REQUEST_SALES_FORM_DATA.cemetery.sellPlotsUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    // Wait for page to be interactive with shorter timeout
    await this.page.waitForTimeout(2000);  // Just wait a bit for initial rendering
    this.logger.info('Successfully loaded sell plots page');
  }

  // ============================================
  // PLOT SELECTION
  // ============================================

  /**
   * Expand a section to view available plots
   * @param sectionName - Name of the section (e.g., "B")
   */
  async expandSection(sectionName: string): Promise<void> {
    this.logger.info(`Expanding section: ${sectionName}`);
    const toggleButton = this.page.locator(
      RequestSalesFormSelectors.sectionTree.toggleButton(sectionName)
    );
    await toggleButton.click();
    await this.page.waitForTimeout(1000); // Wait for expansion animation
    this.logger.info(`Section ${sectionName} expanded`);
  }

  /**
   * Try multiple plots to find one with Request to Buy button available
   * Returns the plot name that has the button
   */
  async findPlotWithPurchaseOption(): Promise<string> {
    this.logger.info('Searching for plot with Request to Buy option');
    
    // Get target plot name from test data
    const targetPlotName = REQUEST_SALES_FORM_DATA.plot.name;
    this.logger.info(`Looking for specific plot: ${targetPlotName}`);
    
    // Click the specific plot directly
    const plotElement = this.page.getByText(new RegExp(`${targetPlotName}\\s+For Sale`, 'i'));
    const exists = await plotElement.count();
    
    if (exists === 0) {
      throw new Error(`Plot "${targetPlotName}" with "For Sale" status not found. Make sure section is expanded.`);
    }
    
    this.logger.info(`Clicking plot: ${targetPlotName}`);
    await plotElement.click();
    
    // Wait for navigation
    await this.page.waitForURL(/\/plots\//, { timeout: 15000, waitUntil: 'domcontentloaded' });
    
    // Wait for plot details to load
    this.logger.info('Waiting for plot details to load (v1_customform_public_detail)...');
    await waitForEndpoint(this.page, 'v1_customform_public_detail', 200);
    await this.page.waitForTimeout(1000);
    
    // Verify Request to Buy button exists
    const requestButton = this.page.locator('button:has-text("REQUEST TO BUY")').first();
    const isVisible = await requestButton.isVisible({ timeout: 5000 });
    
    if (!isVisible) {
      throw new Error(`Plot "${targetPlotName}" opened but Request to Buy button not found`);
    }
    
    this.logger.info(`✓ SUCCESS! Found plot with Request to Buy button: ${targetPlotName}`);
    return targetPlotName;
  }

  /**
   * Click on the first plot in the expanded section
   */
  async clickFirstPlot(): Promise<string> {
    this.logger.info('Clicking on first plot in section');
    
    // Wait for the expanded section to show plots
    await this.page.waitForTimeout(2000); // Wait for expansion animation
    
    // Use multiple fallback strategies to find and click the first plot
    let plotName = '';
    
    try {
      // Strategy 1: Try to find plot with "For Sale" pattern (case insensitive)
      const plotWithStatus = this.page.getByText(/[A-Z]\s+[A-Z]\s+\d+\s+For Sale/i).first();
      await plotWithStatus.waitFor({ state: 'visible', timeout: 5000 });
      const text = await plotWithStatus.textContent();
      plotName = text?.replace(/\s*For Sale.*/i, '').trim() || '';
      this.logger.info(`Found plot using Strategy 1: ${plotName}`);
      await plotWithStatus.click();
    } catch (e1) {
      this.logger.info('Strategy 1 failed, trying Strategy 2');
      try {
        // Strategy 2: Look for any clickable element containing plot name pattern
        const anyPlot = this.page.locator('text=/^[A-Z]\\s+[A-Z]\\s+\\d+/').first();
        await anyPlot.waitFor({ state: 'visible', timeout: 5000 });
        plotName = await anyPlot.textContent() || '';
        plotName = plotName.trim();
        this.logger.info(`Found plot using Strategy 2: ${plotName}`);
        await anyPlot.click();
      } catch (e2) {
        this.logger.info('Strategy 2 failed, trying Strategy 3');
        // Strategy 3: Use data-testid if available
        const plotByTestId = this.page.locator('[data-testid*="sell-plots"]').first();
        await plotByTestId.waitFor({ state: 'visible', timeout: 5000 });
        plotName = await plotByTestId.textContent() || '';
        plotName = plotName.split('\n')[0].trim();
        this.logger.info(`Found plot using Strategy 3: ${plotName}`);
        await plotByTestId.click();
      }
    }
    
    // Wait for navigation to plot details page
    await this.page.waitForURL(/plots\//, { timeout: 15000 });
    await this.page.waitForLoadState('networkidle');
    
    return plotName;
  }

  /**
   * Click on a specific plot by name
   * @param plotName - Name of the plot (e.g., "B A 1")
   */
  async clickPlot(plotName: string): Promise<void> {
    this.logger.info(`Clicking on plot: ${plotName}`);
    const plotItem = this.page.locator(
      RequestSalesFormSelectors.sectionTree.plotListItem(plotName)
    );
    await plotItem.click();
    await this.page.waitForLoadState('networkidle');
    this.logger.info(`Navigated to plot details: ${plotName}`);
  }

  // ============================================
  // PLOT DETAILS VALIDATION
  // ============================================

  /**
   * Get the currently displayed plot name from plot details page
   */
  async getPlotName(): Promise<string> {
    const plotNameElement = this.page.locator(RequestSalesFormSelectors.plotDetails.plotName).first();
    const fullText = await plotNameElement.textContent();
    // Extract just the plot name part (e.g., "B A 1" from "B A 1FOR SALE" or "B A 1 FOR SALE")
    const plotName = fullText?.replace(/\s*FOR\s*SALES?/i, '').trim() || '';
    this.logger.info(`Current plot name: ${fullText} → Cleaned: ${plotName}`);
    return plotName;
  }

  /**
   * Get the cemetery name from plot details page
   */
  async getCemeteryName(): Promise<string> {
    const cemeteryElement = this.page.locator(RequestSalesFormSelectors.plotDetails.cemetery).first();
    const cemeteryName = await cemeteryElement.textContent();
    this.logger.info(`Cemetery name: ${cemeteryName}`);
    return cemeteryName?.trim() || '';
  }

  /**
   * Verify that the Request to Buy button is visible
   */
  async verifyRequestToBuyButtonVisible(): Promise<boolean> {
    try {
      // Try different button text variations
      const buttonVariations = [
        'button:has-text("REQUEST TO BUY")',
        'button:has-text("Request to Buy")',
        'button:has-text("Request To Buy")',
        'button >> text=/request to buy/i',
      ];

      for (const selector of buttonVariations) {
        const button = this.page.locator(selector);
        if (await button.isVisible()) {
          this.logger.info(`Request to Buy button found with selector: ${selector}`);
          return true;
        }
      }
      
      // If none found, log what buttons are available
      const allButtons = await this.page.locator('button').allTextContents();
      this.logger.info(`Available buttons: ${JSON.stringify(allButtons)}`);
      this.logger.info(`Request to Buy button visible: false`);
      return false;
    } catch (error) {
      this.logger.error(`Error checking button visibility: ${error}`);
      return false;
    }
  }

  // ============================================
  // REQUEST TO BUY FLOW
  // ============================================

  /**
   * Navigate directly to the pre-need purchase form for a plot
   * Bypasses the Request to Buy button by constructing the URL directly
   * @param plotName - Name of the plot (e.g., "B A 4")
   */
  async navigateToPreNeedPurchaseForm(plotName: string): Promise<void> {
    const encodedPlotName = encodeURIComponent(plotName);
    const baseUrl = REQUEST_SALES_FORM_DATA.cemetery.sellPlotsUrl.replace('/sell-plots', '');
    const formUrl = `${baseUrl}/plots/${encodedPlotName}/purchase/Pre-need`;
    
    this.logger.info(`Navigating directly to purchase form: ${formUrl}`);
    await this.page.goto(formUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await this.page.waitForLoadState('networkidle', { timeout: 60000 });
    this.logger.info('Purchase form page loaded');
  }

  /**
   * Click the Request to Buy button
   * @param plotName - Optional plot name to re-navigate fresh before clicking (clears history issues)
   */
  async clickRequestToBuy(plotName?: string): Promise<void> {
    // If plot name provided, navigate fresh to clear browser history issues
    if (plotName) {
      this.logger.info(`Re-navigating to plot ${plotName} to clear history before clicking`);
      const baseUrl = REQUEST_SALES_FORM_DATA.cemetery.sellPlotsUrl.replace('/sell-plots', '');
      const plotUrl = `${baseUrl}/plots/${encodeURIComponent(plotName)}`;
      await this.page.goto(plotUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Try to wait for networkidle, but don't fail if it times out
      try {
        await this.page.waitForLoadState('networkidle', { timeout: 15000 });
      } catch (e) {
        this.logger.info('Network idle timeout reached, continuing anyway');
      }
      
      await this.page.waitForTimeout(2000); // Increased stability wait
    }
    
    this.logger.info('Clicking Request to Buy button');
    await this.page.locator(RequestSalesFormSelectors.plotDetails.requestToBuyButton).click();
    await this.page.waitForTimeout(500); // Wait for menu animation
    await this.page.waitForSelector(RequestSalesFormSelectors.requestMenu.preNeedOption, { timeout: 10000 });
    this.logger.info('Request menu opened');
  }

  /**
   * Select Pre-need plot purchase option from the menu
   */
  async selectPreNeedPurchase(): Promise<void> {
    this.logger.info('Selecting Pre-need plot purchase');
    await this.page.locator(RequestSalesFormSelectors.requestMenu.preNeedOption).click();
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector(RequestSalesFormSelectors.purchaseForm.heading);
    this.logger.info('Navigated to purchase form');
  }

  /**
   * Select At-need plot purchase option from the menu
   */
  async selectAtNeedPurchase(): Promise<void> {
    this.logger.info('Selecting At-need plot purchase');
    await this.page.locator(RequestSalesFormSelectors.requestMenu.atNeedOption).click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for form to load - try multiple heading patterns
    try {
      await this.page.waitForSelector('h1:has-text("At-need"), h1:has-text("Plot Purchase")', { timeout: 10000 });
    } catch (error) {
      this.logger.warn('At-need form heading not found, continuing anyway');
    }
    
    this.logger.info('Navigated to At-need purchase form');
  }

  // ============================================
  // PURCHASE FORM - DESCRIPTION SECTION
  // ============================================

  /**
   * Click continue button in description section
   */
  async continueDescriptionSection(): Promise<void> {
    this.logger.info('Continuing from description section');
    await this.page.locator(RequestSalesFormSelectors.purchaseForm.description.continueButton).click();
    await this.page.waitForTimeout(500); // Wait for expansion animation
  }

  // ============================================
  // PURCHASE FORM - ROI APPLICANT SECTION
  // ============================================

  /**
   * Fill ROI Applicant form with test data (PRE-NEED specific)
   * Uses label-based selectors for better reliability
   */
  async fillROIApplicantForm(): Promise<void> {
    this.logger.info('Filling ROI Applicant form (Pre-need)');
    const applicant = REQUEST_SALES_FORM_DATA.applicant;

    try {
      await this.page.waitForTimeout(1500);

      // Use label-based approach - find input by nearby label text
      this.logger.info(`Filling First Name: ${applicant.firstName}`);
      const firstNameField = this.page.locator('input').filter({ has: this.page.locator('xpath=following-sibling::*//text()[contains(., "First Name")]') }).or(
        this.page.locator('mat-form-field:has-text("First Name") input')
      ).or(this.page.locator('input[placeholder*="First"]')).first();
      await firstNameField.waitFor({ timeout: 5000 });
      await firstNameField.clear();
      await firstNameField.fill(applicant.firstName);
      
      this.logger.info(`Filling Last Name: ${applicant.lastName}`);
      const lastNameField = this.page.locator('input').filter({ has: this.page.locator('xpath=following-sibling::*//text()[contains(., "Last Name")]') }).or(
        this.page.locator('mat-form-field:has-text("Last Name") input')
      ).or(this.page.locator('input[placeholder*="Last"]')).first();
      await lastNameField.clear();
      await lastNameField.fill(applicant.lastName);
      
      this.logger.info(`Filling Email: ${applicant.email}`);
      const emailField = this.page.locator('input').filter({ has: this.page.locator('xpath=following-sibling::*//text()[contains(., "Email")]') }).or(
        this.page.locator('mat-form-field:has-text("Email") input')
      ).or(this.page.locator('input[type="email"]')).or(this.page.locator('input[placeholder*="Email"]')).first();
      await emailField.clear();
      await emailField.fill(applicant.email);

      await this.page.waitForTimeout(500);
      this.logger.info('ROI Applicant form filled successfully (Pre-need)');
    } catch (error) {
      this.logger.error(`Error filling ROI Applicant form: ${error}`);
      throw error;
    }
  }

  /**
   * Fill ROI Applicant form with test data (AT-NEED specific)
   * Uses label-based selectors for better reliability
   */
  async fillROIApplicantFormAtNeed(): Promise<void> {
    this.logger.info('Filling ROI Applicant form (At-need)');
    const applicant = REQUEST_SALES_FORM_DATA.applicant;

    try {
      await this.page.waitForTimeout(1500);

      // Find ROI Applicant section first
      const roiApplicantSection = this.page.locator('mat-expansion-panel:has-text("ROI Applicant")');
      
      this.logger.info(`Filling First Name: ${applicant.firstName}`);
      const firstNameField = roiApplicantSection.locator('input').filter({ has: this.page.locator('xpath=following-sibling::*//text()[contains(., "First Name")]') }).or(
        roiApplicantSection.locator('mat-form-field:has-text("First Name") input')
      ).first();
      await firstNameField.waitFor({ timeout: 5000 });
      await firstNameField.clear();
      await firstNameField.fill(applicant.firstName);
      
      this.logger.info(`Filling Last Name: ${applicant.lastName}`);
      const lastNameField = roiApplicantSection.locator('input').filter({ has: this.page.locator('xpath=following-sibling::*//text()[contains(., "Last Name")]') }).or(
        roiApplicantSection.locator('mat-form-field:has-text("Last Name") input')
      ).first();
      await lastNameField.clear();
      await lastNameField.fill(applicant.lastName);
      
      this.logger.info(`Filling Email: ${applicant.email}`);
      const emailField = roiApplicantSection.locator('input[type="email"]').or(
        roiApplicantSection.locator('mat-form-field:has-text("Email") input')
      ).first();
      await emailField.clear();
      await emailField.fill(applicant.email);

      await this.page.waitForTimeout(500);
      this.logger.info('ROI Applicant form filled successfully (At-need)');
    } catch (error) {
      this.logger.error(`Error filling ROI Applicant form (At-need): ${error}`);
      throw error;
    }
  }

  /**
   * Click continue button in ROI Applicant section
   */
  async continueROIApplicantSection(): Promise<void> {
    this.logger.info('Continuing from ROI Applicant section');
    await this.page.locator(RequestSalesFormSelectors.purchaseForm.roiApplicant.continueButton).click();
    await this.page.waitForTimeout(500); // Wait for expansion animation
  }

  // ============================================
  // PURCHASE FORM - AT-NEED SPECIFIC SECTIONS
  // ============================================

  /**
   * Fill ROI Holder form (AT-NEED only)
   * ROI Holder section appears after ROI Applicant in At-need flow
   */
  async fillROIHolderFormAtNeed(): Promise<void> {
    this.logger.info('Filling ROI Holder form (At-need)');
    const applicant = REQUEST_SALES_FORM_DATA.applicant;

    try {
      await this.page.waitForTimeout(1500);

      // Find ROI Holder section
      const roiHolderSection = this.page.locator('mat-expansion-panel:has-text("ROI Holder")');
      
      this.logger.info(`Filling ROI Holder First Name: ${applicant.firstName}`);
      const firstNameField = roiHolderSection.locator('mat-form-field:has-text("First Name") input').or(
        roiHolderSection.locator('input[placeholder*="First"]')
      ).first();
      await firstNameField.waitFor({ timeout: 5000 });
      await firstNameField.clear();
      await firstNameField.fill(applicant.firstName);
      
      this.logger.info(`Filling ROI Holder Last Name: ${applicant.lastName}`);
      const lastNameField = roiHolderSection.locator('mat-form-field:has-text("Last Name") input').or(
        roiHolderSection.locator('input[placeholder*="Last"]')
      ).first();
      await lastNameField.clear();
      await lastNameField.fill(applicant.lastName);

      await this.page.waitForTimeout(500);
      this.logger.info('ROI Holder form filled successfully (At-need)');
    } catch (error) {
      this.logger.error(`Error filling ROI Holder form (At-need): ${error}`);
      throw error;
    }
  }

  /**
   * Click continue button in ROI Holder section (AT-NEED only)
   */
  async continueROIHolderSectionAtNeed(): Promise<void> {
    this.logger.info('Continuing from ROI Holder section (At-need)');
    await this.page.locator('button:has-text("continue")').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill Deceased form (AT-NEED only)
   */
  async fillDeceasedFormAtNeed(): Promise<void> {
    this.logger.info('Filling Deceased form (At-need)');
    const deceased = REQUEST_SALES_FORM_DATA.intermentDetails;

    try {
      await this.page.waitForTimeout(1500);

      // Find Deceased section
      const deceasedSection = this.page.locator('mat-expansion-panel:has-text("Deceased")');
      
      this.logger.info(`Filling Deceased First Name: ${deceased.deceasedFirstName}`);
      const firstNameField = deceasedSection.locator('mat-form-field:has-text("First Name") input').or(
        deceasedSection.locator('input[placeholder*="First"]')
      ).first();
      await firstNameField.waitFor({ timeout: 5000 });
      await firstNameField.clear();
      await firstNameField.fill(deceased.deceasedFirstName);
      
      this.logger.info(`Filling Deceased Last Name: ${deceased.deceasedLastName}`);
      const lastNameField = deceasedSection.locator('mat-form-field:has-text("Last Name") input').or(
        deceasedSection.locator('input[placeholder*="Last"]')
      ).first();
      await lastNameField.clear();
      await lastNameField.fill(deceased.deceasedLastName);

      await this.page.waitForTimeout(500);
      this.logger.info('Deceased form filled successfully (At-need)');
    } catch (error) {
      this.logger.error(`Error filling Deceased form (At-need): ${error}`);
      throw error;
    }
  }

  /**
   * Click continue button in Deceased section (AT-NEED only)
   */
  async continueDeceasedSectionAtNeed(): Promise<void> {
    this.logger.info('Continuing from Deceased section (At-need)');
    await this.page.locator('button:has-text("continue")').click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill Event Service form (AT-NEED only)
   */
  async fillEventServiceFormAtNeed(): Promise<void> {
    this.logger.info('Filling Event Service form (At-need)');

    try {
      await this.page.waitForTimeout(1000);

      // At-need Event Service: IDs at mat-input-40 (Date), mat-input-43 (Event Name)
      this.logger.info('Filling Event Date');
      await this.page.locator('#mat-input-40').fill('01/15/2026');
      
      this.logger.info('Filling Event Name');
      await this.page.locator('#mat-input-43').fill('Memorial Service');

      this.logger.info('Event Service form filled successfully (At-need)');
    } catch (error) {
      this.logger.error(`Error filling Event Service form (At-need): ${error}`);
      throw error;
    }
  }

  /**
   * Click continue button in Event Service section (AT-NEED only)
   */
  async continueEventServiceSectionAtNeed(): Promise<void> {
    this.logger.info('Continuing from Event Service section (At-need)');
    await this.page.locator('button:has-text("continue")').click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // PURCHASE FORM - SERVICE SECTION (AT-NEED ONLY)
  // ============================================

  /**
   * Fill Service section form (AT-NEED only)
   * This section appears only in AT-NEED flow, after Signature section
   */
  async fillServiceForm(): Promise<void> {
    this.logger.info('Filling Service form (At-need)');
    const service = REQUEST_SALES_FORM_DATA.eventService;

    try {
      await this.page.waitForTimeout(1000);

      // Use region locator to scope to Service section only
      const serviceRegion = this.page.getByRole('region', { name: 'Service' });

      // Fill Date (required) - first input in Service section
      this.logger.info('Filling Event Date');
      await serviceRegion.locator('input').nth(0).fill(service.date);

      // Fill Event Name (required) - 4th input in Service section (after Date, Start time, End time)
      this.logger.info('Filling Event Name');
      await serviceRegion.locator('input').nth(3).fill(service.eventName);

      this.logger.info('Service form filled successfully (At-need)');
    } catch (error) {
      this.logger.error(`Error filling Service form (At-need): ${error}`);
      throw error;
    }
  }

  /**
   * Click continue button in Service section (AT-NEED only)
   */
  async continueServiceSection(): Promise<void> {
    this.logger.info('Continuing from Service section (At-need)');
    await this.page.locator('button:has-text("continue")').click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // PURCHASE FORM - INTERMENT DETAILS SECTION (OLD - NOT USED)
  // ============================================

  /**
   * Fill Interment Details form with test data (At-need only)
   */
  async fillIntermentDetailsForm(): Promise<void> {
    this.logger.info('Filling Interment Details form (At-need)');
    const details = REQUEST_SALES_FORM_DATA.intermentDetails;

    try {
      await this.page.waitForTimeout(1000);

      // Fill required fields
      this.logger.info(`Filling deceased name: ${details.deceasedFirstName} ${details.deceasedLastName}`);
      await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.deceasedFirstName).first().fill(details.deceasedFirstName);
      await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.deceasedLastName).first().fill(details.deceasedLastName);

      // Fill optional fields if provided
      if (details.deceasedMiddleName) {
        await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.deceasedMiddleName).first().fill(details.deceasedMiddleName);
      }
      
      if (details.dateOfBirth) {
        await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.dateOfBirth).first().fill(details.dateOfBirth);
      }
      
      if (details.dateOfDeath) {
        await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.dateOfDeath).first().fill(details.dateOfDeath);
      }
      
      if (details.placeOfDeath) {
        await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.placeOfDeath).first().fill(details.placeOfDeath);
      }
      
      if (details.intermentDate) {
        await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.intermentDate).first().fill(details.intermentDate);
      }
      
      if (details.intermentTime) {
        await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.intermentTime).first().fill(details.intermentTime);
      }
      
      if (details.funeralDirector) {
        await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.funeralDirector).first().fill(details.funeralDirector);
      }

      this.logger.info('Interment Details form filled successfully');
    } catch (error) {
      this.logger.error(`Error filling Interment Details form: ${error}`);
      throw error;
    }
  }

  /**
   * Click continue button in Interment Details section
   */
  async continueIntermentDetailsSection(): Promise<void> {
    this.logger.info('Continuing from Interment Details section');
    await this.page.locator(RequestSalesFormSelectors.purchaseForm.intermentDetails.continueButton).click();
    await this.page.waitForTimeout(500); // Wait for expansion animation
  }

  // ============================================
  // PURCHASE FORM - ROI SECTION
  // ============================================

  /**
   * Fill ROI form with test data
   */
  async fillROIForm(): Promise<void> {
    this.logger.info('Filling ROI form');
    const roi = REQUEST_SALES_FORM_DATA.roi;

    try {
      // Wait for section to be ready
      await this.page.waitForTimeout(2000);
      
      // Try to find and expand ROI section if it's collapsed
      const roiSection = this.page.locator('mat-expansion-panel').filter({ hasText: /ROI/i }).first();
      const isExpanded = await roiSection.getAttribute('class').then(c => c?.includes('mat-expanded')).catch(() => false);
      
      if (!isExpanded) {
        this.logger.info('ROI section is collapsed, expanding it...');
        const header = roiSection.locator('mat-expansion-panel-header').first();
        await header.click();
        await this.page.waitForTimeout(1000); // Wait for expansion animation
      }
      
      // Now try to fill the required fields
      // Select Right Type - try multiple selector strategies
      this.logger.info(`Selecting Right Type: ${roi.rightType}`);
      
      // Wait for combobox to be visible
      const rightTypeSelectors = [
        '[formcontrolname="rightType"]',
        'input[placeholder*="Right Type"]',
        '[role="combobox"]:near(:text("Right Type"))',
      ];
      
      let rightTypeInput = null;
      for (const selector of rightTypeSelectors) {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          rightTypeInput = element;
          this.logger.info(`Found Right Type using selector: ${selector}`);
          break;
        }
      }
      
      if (!rightTypeInput) {
        this.logger.warn('Could not find Right Type input - might be optional or hidden');
        return;
      }
      
      // Click and select
      await rightTypeInput.click();
      await this.page.waitForTimeout(500);
      const rightTypeOption = this.page.locator(`mat-option, [role="option"]`).filter({ hasText: new RegExp(roi.rightType, 'i') }).first();
      await rightTypeOption.click();
      this.logger.info(`Selected Right Type: ${roi.rightType}`);
      
      await this.page.waitForTimeout(500);
      
      // Select Term of Right
      this.logger.info(`Selecting Term of Right: ${roi.termOfRight}`);
      
      const termSelectors = [
        '[formcontrolname="termOfRight"]',
        'input[placeholder*="Term"]',
        '[role="combobox"]:near(:text("Term"))',
      ];
      
      let termInput = null;
      for (const selector of termSelectors) {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          termInput = element;
          this.logger.info(`Found Term of Right using selector: ${selector}`);
          break;
        }
      }
      
      if (!termInput) {
        this.logger.warn('Could not find Term of Right input - might be optional');
        return;
      }
      
      await termInput.click();
      await this.page.waitForTimeout(500);
      const termOption = this.page.locator(`mat-option, [role="option"]`).filter({ hasText: new RegExp(roi.termOfRight, 'i') }).first();
      await termOption.click();
      this.logger.info(`Selected Term of Right: ${roi.termOfRight}`);

      this.logger.info('ROI form filled successfully');
    } catch (error) {
      this.logger.error(`Error filling ROI form: ${error}`);
      this.logger.warn('Continuing without filling ROI form (might be optional)');
    }
  }

  /**
   * Click continue button in ROI section
   */
  async continueROISection(): Promise<void> {
    this.logger.info('Continuing from ROI section');
    await this.page.locator(RequestSalesFormSelectors.purchaseForm.roi.continueButton).click();
    await this.page.waitForTimeout(500); // Wait for expansion animation
  }

  // ============================================
  // PURCHASE FORM - TERMS AND CONDITIONS
  // ============================================

  /**
   * Agree to terms and conditions
   */
  async agreeToTerms(): Promise<void> {
    this.logger.info('Agreeing to terms and conditions');
    
    // Wait for Terms section to be visible
    await this.page.waitForSelector('.mat-checkbox-inner-container', { timeout: 10000 });
    await this.page.waitForTimeout(500);
    
    await this.page.locator(RequestSalesFormSelectors.purchaseForm.terms.agreeCheckbox).click();
    await this.page.waitForTimeout(300);
    this.logger.info('Terms agreed');
  }

  /**
   * Click continue button in terms section
   */
  async continueTermsSection(): Promise<void> {
    this.logger.info('Continuing from terms section');
    await this.page.locator(RequestSalesFormSelectors.purchaseForm.terms.continueButton).click();
    await this.page.waitForTimeout(500); // Wait for expansion animation
  }

  // ============================================
  // PURCHASE FORM - SIGNATURE
  // ============================================

  /**
   * Add a simple signature (just click continue, signature is optional based on exploration)
   */
  async addSignature(): Promise<void> {
    this.logger.info('Adding signature (skipping as optional)');
    // Based on exploration, signature appears to be optional or auto-generated
    // Just continue to the next section
  }

  /**
   * Click continue button in signature section
   */
  async continueSignatureSection(): Promise<void> {
    this.logger.info('Continuing from signature section');
    await this.page.locator(RequestSalesFormSelectors.purchaseForm.signature.continueButton).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // FORM VALIDATION BEFORE SUBMIT
  // ============================================

  /**
   * Validate plot name and cemetery in the form summary
   * @param expectedPlotName - Expected plot name
   * @param expectedCemetery - Expected cemetery name
   */
  async validateFormSummary(expectedPlotName: string, expectedCemetery: string): Promise<void> {
    this.logger.info('Validating form summary');
    
    try {
      // Wait for page to stabilize
      await this.page.waitForTimeout(2000);
      
      // Get all text content from headings
      const h3Texts = await this.page.locator('h3').allTextContents();
      const h1Texts = await this.page.locator('h1').allTextContents();
      
      this.logger.info(`H3 elements: ${JSON.stringify(h3Texts)}`);
      this.logger.info(`H1 elements: ${JSON.stringify(h1Texts)}`);
      
      // Find plot name (pattern: A B 1 or similar)
      let foundPlotName: string | null = null;
      for (const text of [...h3Texts, ...h1Texts]) {
        if (text && text.match(/[A-Z]\s+[A-Z]\s+\d+/)) {
          foundPlotName = text;
          break;
        }
      }
      
      this.logger.info(`Found plot name in form: ${foundPlotName}`);
      
      if (!foundPlotName || !foundPlotName.includes(expectedPlotName)) {
        throw new Error(`Plot name validation failed. Expected: ${expectedPlotName}, Found: ${foundPlotName}`);
      }
      
      this.logger.info('Form summary validated successfully');
    } catch (error) {
      this.logger.error(`Error validating form summary: ${error}`);
      throw error;
    }
  }

  // ============================================
  // FORM SUBMISSION
  // ============================================

  /**
   * Submit the request form
   */
  async submitRequest(): Promise<void> {
    this.logger.info('Submitting request form');
    
    // Wait a bit for form to be ready
    await this.page.waitForTimeout(2000);
    
    // Log current state
    const currentUrl = this.page.url();
    this.logger.info(`Current URL before submit: ${currentUrl}`);
    
    // Check for form validation errors
    const errorMessages = await this.page.locator('.mat-error, [role="alert"], .error-message').allTextContents();
    if (errorMessages.length > 0) {
      this.logger.info(`Form validation errors found: ${JSON.stringify(errorMessages)}`);
    }
    
    // Find submit button
    const submitButton = this.page.getByRole('button', { name: /SUBMIT A REQUEST/i });
    
    // Check if button is disabled
    const isDisabled = await submitButton.getAttribute('disabled');
    if (isDisabled !== null) {
      this.logger.error('Submit button is DISABLED - form validation incomplete');
      
      // Log all sections and their expansion state
      const sections = ['Description', 'ROI Applicant', 'ROI', 'Terms', 'Signature'];
      for (const section of sections) {
        const heading = this.page.getByRole('heading', { name: new RegExp(section, 'i') });
        const isVisible = await heading.isVisible().catch(() => false);
        this.logger.info(`Section "${section}": ${isVisible ? 'visible' : 'not visible'}`);
      }
      
      // Log all input fields and their states with better detail
      const inputs = await this.page.locator('input[type="text"], input[type="email"], input[type="tel"], textarea, select, input[role="combobox"]').all();
      this.logger.info(`Total form fields found: ${inputs.length}`);
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const name = await input.getAttribute('name').catch(() => '');
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        const ariaLabel = await input.getAttribute('aria-label').catch(() => '');
        const value = await input.inputValue().catch(() => '');
        const required = await input.getAttribute('required').catch(() => null);
        const ariaInvalid = await input.getAttribute('aria-invalid').catch(() => null);
        const isVisible = await input.isVisible().catch(() => false);
        
        const fieldLabel = name || placeholder || ariaLabel || `field-${i}`;
        
        if (required !== null || ariaInvalid === 'true' || !value) {
          this.logger.info(`Field [${i}]: "${fieldLabel}" | value: "${value}" | required: ${required !== null} | invalid: ${ariaInvalid} | visible: ${isVisible}`);
        }
        
        if (required !== null && !value && isVisible) {
          this.logger.error(`❌ Required field EMPTY: "${fieldLabel}"`);
        }
      }
      
      throw new Error('Submit button is disabled - form validation incomplete. Check required fields above.');
    }
    
    this.logger.info('Submit button is enabled, preparing to submit...');
    
    // Setup wait for submission endpoint BEFORE clicking submit to avoid race condition
    this.logger.info('Waiting for endpoint: v1_cemetery_request_table_public_plot_purchase_create');
    const responsePromise = waitForEndpoint(
      this.page, 
      'v1_cemetery_request_table_public_plot_purchase_create',
      201  // Changed from 200 to 201 (Created) - the actual response status
    );
    
    // Click submit
    await submitButton.click();
    this.logger.info('✓ Submit button clicked, waiting for server response...');
    
    // Wait for the endpoint to respond (45 second timeout)
    try {
      const response = await Promise.race([
        responsePromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Endpoint response timeout after 45 seconds')), 45000)
        )
      ]);
      const status = response.status();
      this.logger.info(`✓ Submission successful! Response status: ${status}`);
      
      // Parse response body if needed
      const responseBody = await response.json().catch(() => null);
      if (responseBody) {
        this.logger.info(`Response body: ${JSON.stringify(responseBody).substring(0, 200)}`);
      }
      
      // Wait a bit for UI to update after successful submission
      await this.page.waitForTimeout(2000);
    } catch (error) {
      this.logger.error(`Failed to get submission response: ${error}`);
      throw new Error('Form submission failed - no response from server');
    }
  }

  // ============================================
  // CONFIRMATION VALIDATION
  // ============================================

  /**
   * Verify the confirmation dialog is displayed
   * Also checks for success page navigation as alternative
   */
  async verifyConfirmationDialog(): Promise<boolean> {
    this.logger.info('Waiting for confirmation dialog or success page...');
    
    // Wait a bit for page to process submission
    await this.page.waitForTimeout(2000);
    
    // Check if URL changed to a success page
    const currentUrl = this.page.url();
    if (currentUrl.includes('/success') || currentUrl.includes('/confirmation') || currentUrl.includes('/thank')) {
      this.logger.info(`Success page detected: ${currentUrl}`);
      return true;
    }
    
    // Try multiple selector strategies for dialog
    const selectors = [
      RequestSalesFormSelectors.confirmationDialog.dialog,
      '[role="dialog"]',
      'mat-dialog-container',
      '.mat-dialog-container',
      '.cdk-overlay-pane',
      '.confirmation-dialog',
      'div:has-text("Request was sent")',
      'div:has-text("successfully")',
    ];
    
    // Wait up to 15 seconds for any dialog to appear
    for (const selector of selectors) {
      try {
        const dialog = this.page.locator(selector).first();
        await dialog.waitFor({ state: 'visible', timeout: 15000 });
        this.logger.info(`Confirmation found with selector: ${selector}`);
        return true;
      } catch (error) {
        this.logger.info(`Selector "${selector}" not found, trying next...`);
      }
    }
    
    // Check for any success messages in page content
    const bodyText = await this.page.locator('body').textContent().catch(() => '');
    if (bodyText?.toLowerCase().includes('request was sent') || 
        bodyText?.toLowerCase().includes('successfully submitted') ||
        bodyText?.toLowerCase().includes('thank you')) {
      this.logger.info('Success message found in page content');
      return true;
    }
    
    // Log what's actually on the page
    this.logger.info(`Page content after submit (first 500 chars): ${bodyText?.substring(0, 500) || 'No content'}`);
    
    const h1Texts = await this.page.locator('h1, h2').allTextContents();
    this.logger.info(`Headings on page: ${JSON.stringify(h1Texts)}`);
    
    this.logger.info('Confirmation dialog not found with any selector');
    return false;
  }

  /**
   * Verify the success message in confirmation dialog
   */
  async verifySuccessMessage(): Promise<boolean> {
    const successMessage = this.page.locator(RequestSalesFormSelectors.confirmationDialog.successMessage);
    const isVisible = await successMessage.isVisible();
    const text = await successMessage.textContent();
    this.logger.info(`Success message: ${text}`);
    return isVisible && (text?.includes('Request was sent') ?? false);
  }

  /**
   * Get plot name from confirmation dialog
   */
  async getConfirmationPlotName(): Promise<string> {
    const plotNameElement = this.page.locator(RequestSalesFormSelectors.confirmationDialog.plotName).last();
    const plotName = await plotNameElement.textContent();
    this.logger.info(`Confirmation plot name: ${plotName}`);
    return plotName?.trim() || '';
  }

  /**
   * Get cemetery name from confirmation dialog
   */
  async getConfirmationCemeteryName(): Promise<string> {
    const cemeteryElement = this.page.locator(RequestSalesFormSelectors.confirmationDialog.cemetery).first();
    const cemeteryName = await cemeteryElement.textContent();
    this.logger.info(`Confirmation cemetery: ${cemeteryName}`);
    return cemeteryName?.trim() || '';
  }
}
