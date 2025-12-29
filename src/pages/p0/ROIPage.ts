import { Page } from '@playwright/test';
import { RoiSelectors, RoiUrls } from '../../selectors/p0/roi.selectors.js';
import { Logger } from '../../utils/Logger.js';

export class ROIPage {
  readonly page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('ROIPage');
  }

  /**
   * Click Add ROI button on plot detail page
   */
  async clickAddRoi(): Promise<void> {
    this.logger.info('Clicking Add ROI button');
    
    try {
      // Wait for button to be visible first
      await this.page.waitForSelector(RoiSelectors.addRoiButton, { state: 'visible', timeout: 5000 });
      this.logger.info('Add ROI button found, clicking...');
      await this.page.click(RoiSelectors.addRoiButton);
      // Give time for page to load
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      this.logger.info(`Current URL after click: ${currentUrl}`);
      this.logger.success('Add ROI button clicked');
    } catch (e) {
      // Fallback: try text-based selector
      this.logger.info('Trying fallback selector: button with text "Add ROI"');
      await this.page.getByRole('button', { name: /add roi/i }).click();
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      this.logger.info(`Current URL after click (fallback): ${currentUrl}`);
      this.logger.success('Add ROI button clicked (fallback)');
    }
  }

  /**
   * Fill ROI form with provided data
   * @param roiData - Object containing ROI form data
   */
  async fillRoiForm(roiData: {
    rightType?: string;
    termOfRight?: string;
    fee?: string;
    paymentDate?: string;
    certificateNumber?: string;
    notes?: string;
  }): Promise<void> {
    this.logger.info('Filling ROI form');
    
    // Wait for ROI form to be fully loaded
    try {
      await this.page.waitForSelector(RoiSelectors.roiFormTitle, { state: 'visible', timeout: 10000 });
      this.logger.info('ROI form loaded successfully');
    } catch (e) {
      this.logger.error('ROI form title not found - form may not have loaded');
      throw new Error('ROI form failed to load');
    }
    
    // Additional wait for form elements to initialize
    await this.page.waitForTimeout(2000);

    // Fill Right Type if provided
    if (roiData.rightType) {
      this.logger.info(`Selecting Right Type: ${roiData.rightType}`);
      // Right Type is the second mat-select (index 1, after Event Type)
      const matSelects = await this.page.locator('mat-select').all();
      await matSelects[1].click();
      await this.page.waitForTimeout(1000);
      
      // Click the option (Cremation, Burial, Both, or Unassigned)
      await this.page.getByRole('option', { name: roiData.rightType, exact: true }).click();
      await this.page.waitForTimeout(500);
      this.logger.info(`Right Type selected: ${roiData.rightType}`);
    }

    // Fill Term of Right if provided
    if (roiData.termOfRight) {
      this.logger.info(`Selecting Term of Right: ${roiData.termOfRight}`);
      // Term of Right is the third mat-select (index 2)
      const matSelects = await this.page.locator('mat-select').all();
      await matSelects[2].click();
      await this.page.waitForTimeout(1000);
      
      // Click the option (25 Years, 50 Years, Perpetual)
      await this.page.getByRole('option', { name: roiData.termOfRight, exact: true }).click();
      await this.page.waitForTimeout(500);
      this.logger.info(`Term of Right selected: ${roiData.termOfRight}`);
    }

    // Fill Fee if provided
    if (roiData.fee) {
      this.logger.info(`Entering fee: ${roiData.fee}`);
      await this.page.fill(RoiSelectors.feeInput, roiData.fee);
    }

    // Fill Payment Date if provided
    if (roiData.paymentDate) {
      this.logger.info(`Entering payment date: ${roiData.paymentDate}`);
      await this.page.fill(RoiSelectors.paymentDateInput, roiData.paymentDate);
    }

    // Fill Certificate Number if provided
    if (roiData.certificateNumber) {
      this.logger.info(`Entering certificate number: ${roiData.certificateNumber}`);
      await this.page.fill(RoiSelectors.certificateNumberInput, roiData.certificateNumber);
    }

    // Fill Notes if provided
    if (roiData.notes) {
      this.logger.info(`Entering notes: ${roiData.notes}`);
      await this.page.fill(RoiSelectors.notesInput, roiData.notes);
    }

    this.logger.success('ROI form filled successfully');
  }

  /**
   * Add ROI holder person
   * @param holderData - Object containing ROI holder data (firstName, lastName, phone, email)
   */
  async addRoiHolderPerson(holderData: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  }): Promise<void> {
    this.logger.info('Adding ROI holder person');
    
    // Click Add ROI Holder button
    await this.page.click(RoiSelectors.addRoiHolderButton);
    await this.page.waitForTimeout(1000);
    
    // Fill first name (required)
    this.logger.info(`Entering ROI holder first name: ${holderData.firstName}`);
    await this.page.fill(RoiSelectors.roiHolderFirstNameInput, holderData.firstName);
    
    // Fill last name (required)
    this.logger.info(`Entering ROI holder last name: ${holderData.lastName}`);
    await this.page.fill(RoiSelectors.roiHolderLastNameInput, holderData.lastName);
    
    // Fill phone if provided
    if (holderData.phone) {
      this.logger.info(`Entering ROI holder phone: ${holderData.phone}`);
      await this.page.getByRole('textbox', { name: 'Phone (mobile)' }).fill(holderData.phone);
    }
    
    // Fill email if provided
    if (holderData.email) {
      this.logger.info(`Entering ROI holder email: ${holderData.email}`);
      await this.page.fill(RoiSelectors.roiHolderEmailInput, holderData.email);
    }
    
    // Click Add button to save ROI holder
    this.logger.info('Clicking Add button to save ROI holder');
    await this.page.getByRole('button', { name: 'add', exact: true }).click();
    await this.page.waitForTimeout(1000);
    
    this.logger.success('ROI holder person added successfully');
  }

  /**
   * Add ROI applicant person
   * @param applicantData - Object containing ROI applicant data (firstName, lastName, phone, email)
   */
  async addRoiApplicantPerson(applicantData: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  }): Promise<void> {
    this.logger.info('Adding ROI applicant person');
    
    // Wait a bit for any alert to auto-dismiss or UI to settle after holder save
    await this.page.waitForTimeout(1500);
    
    // Click ROI Applicant button with force (may be partially obscured after holder save)
    this.logger.info('Clicking Add ROI Applicant button');
    await this.page.click(RoiSelectors.addRoiApplicantButton, { force: true });
    
    // Wait for first name field to be ready (works for both dialog and inline form)
    await this.page.waitForTimeout(1500);
    
    // After holder is saved, dialog ALWAYS opens with role-based fields
    // Try role selector first (for dialog after holder saved), fallback to data-testid (for standalone)
    const firstNameRole = await this.page.getByRole('textbox', { name: 'First name' }).count();
    
    if (firstNameRole > 0) {
      // Dialog opened - use role-based selectors
      this.logger.info(`Entering ROI applicant first name: ${applicantData.firstName}`);
      await this.page.getByRole('textbox', { name: 'First name' }).fill(applicantData.firstName);
      
      this.logger.info(`Entering ROI applicant last name: ${applicantData.lastName}`);
      await this.page.getByRole('textbox', { name: 'Last name' }).fill(applicantData.lastName);
      
      if (applicantData.phone) {
        this.logger.info(`Entering ROI applicant phone: ${applicantData.phone}`);
        await this.page.getByRole('textbox', { name: 'Phone (mobile)' }).fill(applicantData.phone);
      }
      
      if (applicantData.email) {
        this.logger.info(`Entering ROI applicant email: ${applicantData.email}`);
        await this.page.getByRole('textbox', { name: 'E-mail' }).fill(applicantData.email);
      }
    } else {
      // Inline form - use data-testid selectors
      this.logger.info(`Entering ROI applicant first name: ${applicantData.firstName}`);
      await this.page.fill(RoiSelectors.roiApplicantFirstNameInput, applicantData.firstName);
      
      this.logger.info(`Entering ROI applicant last name: ${applicantData.lastName}`);
      await this.page.fill(RoiSelectors.roiApplicantLastNameInput, applicantData.lastName);
      
      if (applicantData.phone) {
        this.logger.info(`Entering ROI applicant phone: ${applicantData.phone}`);
        await this.page.getByRole('textbox', { name: 'Phone (mobile)' }).fill(applicantData.phone);
      }
      
      if (applicantData.email) {
        this.logger.info(`Entering ROI applicant email: ${applicantData.email}`);
        await this.page.fill(RoiSelectors.roiApplicantEmailInput, applicantData.email);
      }
    }
    
    // Click Add button to save ROI applicant
    this.logger.info('Clicking Add button to save ROI applicant');
    await this.page.getByRole('button', { name: 'add', exact: true }).click();
    await this.page.waitForTimeout(1000);
    
    this.logger.success('ROI applicant person added successfully');
  }

  /**
   * Save ROI form
   */
  async saveRoi(): Promise<void> {
    this.logger.info('Saving ROI');
    await this.page.click(RoiSelectors.saveButton);
    // Wait for save to complete and redirect back to plot detail
    await this.page.waitForURL(`**${RoiUrls.plotDetailPattern}**`, { timeout: 30000 });
    await this.page.waitForTimeout(2000); // Wait for status update
    this.logger.success('ROI saved successfully');
  }

  /**
   * Click ROI tab in plot detail sidebar
   */
  async clickRoiTab(): Promise<void> {
    this.logger.info('Clicking ROI tab');
    await this.page.getByRole('tab', { name: /roi/i }).click();
    await this.page.waitForTimeout(1000);
    this.logger.success('ROI tab opened');
  }

  /**
   * Verify ROI person name appears in ROI tab
   * @param personName - Full name of person (e.g., 'John Doe')
   * @param personType - Type of person: 'holder' or 'applicant'
   */
  async verifyRoiPerson(personName: string, personType: 'holder' | 'applicant'): Promise<boolean> {
    this.logger.info(`Verifying ROI ${personType}: ${personName}`);
    
    // Make sure we're on ROI tab
    await this.clickRoiTab();
    
    const typeLabel = personType === 'holder' ? 'ROI HOLDER' : 'ROI APPLICANT';
    
    // Find all person cards that contain the person name
    const personCards = await this.page.locator(`text=${personName}`).locator('..').all();
    
    if (personCards.length === 0) {
      this.logger.info(`❌ ROI ${personType} not found: "${personName}" - No elements with this name found on page`);
      
      // Get all visible text to help debug
      const pageText = await this.page.locator('body').textContent();
      const roiSection = pageText?.substring(0, 500) || 'Unable to get page text';
      this.logger.info(`Page content preview: ${roiSection}`);
      
      return false;
    }
    
    this.logger.info(`✓ Found ${personCards.length} element(s) with name "${personName}"`);
    
    // Check each card to find one that has the correct type label
    for (let i = 0; i < personCards.length; i++) {
      const card = personCards[i];
      const cardText = await card.textContent();
      this.logger.info(`Checking card ${i + 1}/${personCards.length}: "${cardText?.trim()}"`);
      
      if (cardText && cardText.includes(typeLabel)) {
        this.logger.success(`✓ ROI ${personType} verified: "${personName}" with label "${typeLabel}"`);
        return true;
      }
    }
    
    this.logger.info(`❌ Person name "${personName}" found but label "${typeLabel}" not found in any card`);
    this.logger.info(`Expected label: "${typeLabel}" but none of the ${personCards.length} card(s) contain it`);
    
    return false;
  }

  /**
   * Verify both holder and applicant in ROI tab
   * @param holderName - Full name of holder
   * @param applicantName - Full name of applicant
   */
  async verifyRoiHolderAndApplicant(holderName: string, applicantName: string): Promise<boolean> {
    this.logger.info(`Verifying ROI holder and applicant: ${holderName}, ${applicantName}`);
    
    const holderValid = await this.verifyRoiPerson(holderName, 'holder');
    const applicantValid = await this.verifyRoiPerson(applicantName, 'applicant');
    
    if (holderValid && applicantValid) {
      this.logger.success('Both ROI holder and applicant verified');
      return true;
    } else {
      this.logger.info(`Verification failed - Holder: ${holderValid}, Applicant: ${applicantValid}`);
      return false;
    }
  }
}
