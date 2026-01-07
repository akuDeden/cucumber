import { Page, expect } from '@playwright/test';
import { IntermentSelectors } from '../../selectors/p0/interment.selectors.js';
import { Logger } from '../../utils/Logger.js';

export interface IntermentData {
  firstName: string;
  lastName: string;
  middleName?: string;
  title?: string;
  gender?: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  age?: string;
  religion?: string;
  causeOfDeath?: string;
  occupation?: string;
  specialBadge?: string;
  intermentType: string;
  intermentDepth?: string;
  intermentDate?: string;
  cremationLocation?: string;
  containerType?: string;
}

export class IntermentPage {
  readonly page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('IntermentPage');
  }

  /**
   * Click Add Interment button from plot detail page
   */
  async clickAddIntermentButton(): Promise<void> {
    this.logger.info('Clicking Add Interment button');
    
    // Wait for button to be visible and clickable
    const button = this.page.locator(IntermentSelectors.addIntermentButton);
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(1000); // Small wait for page to stabilize
    
    this.logger.info('Add Interment button found, clicking...');
    await button.click();
    
    // Wait for navigation - try multiple patterns
    try {
      await this.page.waitForURL('**/manage/add/interment', { timeout: 15000 });
      this.logger.info('✓ Navigated to Add Interment form');
    } catch (e) {
      // Log current URL if navigation fails
      const currentUrl = this.page.url();
      this.logger.info(`Current URL after click: ${currentUrl}`);
      
      // Check if we're on any manage page
      if (currentUrl.includes('/manage/')) {
        this.logger.info('On a manage page, proceeding...');
      } else {
        throw new Error(`Failed to navigate to Add Interment form. Current URL: ${currentUrl}`);
      }
    }
    
    // Wait for form to be visible
    await this.page.waitForTimeout(3000); // Wait for form sections to load
    this.logger.success('Add Interment form loaded');
  }

  /**
   * Fill interment form with deceased person and interment details
   * @param data - Interment data object
   */
  async fillIntermentForm(data: IntermentData): Promise<void> {
    this.logger.info('Filling interment form');

    // Wait for form fields to be visible (production needs more time)
    await this.page.waitForTimeout(3000);
    
    // Fill Deceased Person section - required fields
    this.logger.info(`Filling first name: ${data.firstName}`);
    const firstNameField = this.page.getByLabel('First name').first();
    await firstNameField.waitFor({ state: 'visible', timeout: 10000 });
    await firstNameField.click(); // Click to focus
    await firstNameField.fill(data.firstName);
    await this.page.waitForTimeout(500);

    this.logger.info(`Filling last name: ${data.lastName}`);
    const lastNameField = this.page.getByLabel('Last name').first();
    await lastNameField.waitFor({ state: 'visible', timeout: 10000 });
    await lastNameField.click();
    await lastNameField.fill(data.lastName);
    await this.page.waitForTimeout(500);

    // Fill optional fields if provided
    if (data.middleName) {
      this.logger.info(`Filling middle name: ${data.middleName}`);
      await this.page.getByLabel('Middle name').first().fill(data.middleName);
    }

    if (data.title) {
      this.logger.info(`Filling title: ${data.title}`);
      await this.page.getByLabel('Title').first().fill(data.title);
    }

    if (data.dateOfBirth) {
      this.logger.info(`Filling date of birth: ${data.dateOfBirth}`);
      await this.page.getByLabel('Date of Birth').first().fill(data.dateOfBirth);
    }

    if (data.dateOfDeath) {
      this.logger.info(`Filling date of death: ${data.dateOfDeath}`);
      await this.page.getByLabel('Date of Death').first().fill(data.dateOfDeath);
    }

    if (data.age) {
      this.logger.info(`Filling age: ${data.age}`);
      await this.page.getByLabel('Age').first().fill(data.age);
    }

    if (data.causeOfDeath) {
      this.logger.info(`Filling cause of death: ${data.causeOfDeath}`);
      await this.page.getByLabel('Cause of death').first().fill(data.causeOfDeath);
    }

    if (data.occupation) {
      this.logger.info(`Filling occupation: ${data.occupation}`);
      await this.page.getByLabel('Occupation').first().fill(data.occupation);
    }

    // Scroll to Interment Details section
    await this.page.evaluate('window.scrollTo(0, 400)');
    await this.page.waitForTimeout(500);

    // Fill Interment Details section - required field
    this.logger.info(`Selecting interment type: ${data.intermentType}`);
    await this.selectIntermentType(data.intermentType);

    // Fill optional interment details
    if (data.intermentDepth) {
      this.logger.info(`Filling interment depth: ${data.intermentDepth}`);
      await this.page.getByLabel('Interment depth').first().fill(data.intermentDepth);
    }

    if (data.intermentDate) {
      this.logger.info(`Filling interment date: ${data.intermentDate}`);
      await this.page.getByLabel('Interment Date').first().fill(data.intermentDate);
    }

    this.logger.success('Interment form filled');
  }

  /**
   * Select interment type from dropdown
   * @param type - Interment type (Burial, Cremated, Entombment, Memorial, Unspecified)
   */
  async selectIntermentType(type: string): Promise<void> {
    this.logger.info(`Selecting interment type: ${type}`);
    
    // Click dropdown using getByLabel
    await this.page.getByLabel('Interment type').click();
    await this.page.waitForTimeout(500); // Wait for dropdown to open
    
    // Select option
    await this.page.getByRole('option', { name: type }).click();
    await this.page.waitForTimeout(500);
    
    this.logger.success(`Interment type ${type} selected`);
  }

  /**
   * Save the interment and wait for redirect
   */
  async saveInterment(): Promise<void> {
    this.logger.info('Saving interment');
    
    // Click save button
    await this.page.click(IntermentSelectors.saveButton);
    
    // Wait for redirect back to plot detail page (longer timeout for production)
    await this.page.waitForURL('**/plots/**', { timeout: 30000 });
    await this.page.waitForTimeout(3000); // Wait for page to fully load
    
    this.logger.success('Interment saved and redirected to plot detail');
  }

  /**
   * Click INTERMENTS tab on plot detail page
   */
  async clickIntermentsTab(): Promise<void> {
    this.logger.info('Clicking INTERMENTS tab');
    
    // Wait for tab to be visible first
    const intermentsTab = this.page.getByRole('tab', { name: /INTERMENTS/i });
    await intermentsTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);
    
    // Click the tab
    await intermentsTab.click();
    this.logger.info('INTERMENTS tab clicked, waiting for content to load...');
    
    // Wait for tab to be selected
    await this.page.waitForTimeout(2000);
    
    // Verify tab is selected
    const isSelected = await intermentsTab.getAttribute('aria-selected');
    if (isSelected === 'true') {
      this.logger.success('INTERMENTS tab selected successfully');
    } else {
      this.logger.info('Retrying tab click...');
      await intermentsTab.click();
      await this.page.waitForTimeout(2000);
    }
    
    // Wait for content to stabilize
    await this.page.waitForTimeout(3000);
    this.logger.success('INTERMENTS tab clicked');
  }

  /**
   * Verify deceased person appears in INTERMENTS tab
   * @param fullName - Full name of deceased (e.g., "John Doe")
   */
  async verifyDeceasedInTab(fullName: string): Promise<void> {
    this.logger.info(`Verifying deceased "${fullName}" appears in INTERMENTS tab`);
    
    // Check if we're already on INTERMENTS tab by looking for the tab
    const intermentsTab = this.page.getByRole('tab', { name: /INTERMENTS/i });
    const isSelected = await intermentsTab.getAttribute('aria-selected');
    
    // If not already selected, click it
    if (isSelected !== 'true') {
      this.logger.info('Clicking INTERMENTS tab');
      await this.clickIntermentsTab();
    } else {
      this.logger.info('Already on INTERMENTS tab');
      await this.page.waitForTimeout(2000); // Wait for content to stabilize
    }
    
    // Wait for page to load (longer for production)
    await this.page.waitForTimeout(3000);
    
    // Verify deceased name appears as heading
    const deceasedHeading = this.page.locator(IntermentSelectors.deceasedNameHeading(fullName));
    await expect(deceasedHeading).toBeVisible({ timeout: 20000 });
    
    this.logger.success(`Deceased "${fullName}" found in INTERMENTS tab`);
  }

  /**
   * Verify interment type label
   * @param intermentType - Expected interment type (e.g., "Burial")
   */
  async verifyIntermentType(intermentType: string): Promise<void> {
    this.logger.info(`Verifying interment type: ${intermentType}`);
    
    const typeLabel = this.page.locator(IntermentSelectors.intermentTypeLabel(intermentType));
    await expect(typeLabel).toBeVisible({ timeout: 5000 });
    
    this.logger.success(`Interment type ${intermentType} verified`);
  }

  /**
   * Add interment applicant person
   * This will open the person form in the right sidebar
   */
  async addIntermentApplicant(): Promise<void> {
    this.logger.info('Adding interment applicant');
    await this.page.click(IntermentSelectors.addIntermentApplicantButton);
    await this.page.waitForTimeout(1000);
    this.logger.success('Interment applicant form opened');
  }

  /**
   * Add next of kin person
   * This will open the person form in the right sidebar
   */
  async addNextOfKin(): Promise<void> {
    this.logger.info('Adding next of kin');
    await this.page.click(IntermentSelectors.addNextOfKinButton);
    await this.page.waitForTimeout(1000);
    this.logger.success('Next of kin form opened');
  }

  /**
   * Click INTERMENTS tab on plot detail page (for edit flow)
   */
  async clickIntermentTab(): Promise<void> {
    this.logger.info('Clicking INTERMENTS tab');
    
    // Wait for tab to be visible first
    const intermentsTab = this.page.getByRole('tab', { name: /INTERMENTS/i });
    await intermentsTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(500);
    
    // Click the tab
    await intermentsTab.click();
    this.logger.info('INTERMENTS tab clicked, waiting for content to load...');
    
    // Wait for tab to be selected
    await this.page.waitForTimeout(2000);
    
    // Verify tab is selected
    const isSelected = await intermentsTab.getAttribute('aria-selected');
    if (isSelected === 'true') {
      this.logger.success('INTERMENTS tab selected successfully');
    } else {
      this.logger.info('Retrying tab click...');
      await intermentsTab.click();
      await this.page.waitForTimeout(2000);
    }
    
    // Wait for content to stabilize
    await this.page.waitForTimeout(3000);
    this.logger.success('INTERMENTS tab opened');
  }

  /**
   * Click Edit Interment button from INTERMENTS tab
   */
  async clickEditIntermentButton(): Promise<void> {
    this.logger.info('Clicking Edit Interment button');
    
    // Wait for button to be visible and enabled
    const editButton = this.page.getByTestId('interment-item-button-edit-interment');
    await editButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.page.waitForTimeout(1000); // Wait for animations
    
    this.logger.info('Edit button found, clicking...');
    await editButton.click();
    
    // Wait for edit form to load
    try {
      await this.page.waitForURL('**/manage/edit/interment/**', { timeout: 15000 });
      this.logger.info('✓ Navigated to Edit Interment form');
    } catch (e) {
      const currentUrl = this.page.url();
      this.logger.info(`Current URL after click: ${currentUrl}`);
      if (!currentUrl.includes('/manage/edit/')) {
        throw new Error(`Failed to navigate to Edit form. Current URL: ${currentUrl}`);
      }
    }
    
    await this.page.waitForTimeout(3000); // Wait for form to fully load
    this.logger.success('Edit Interment form loaded');
  }

  /**
   * Update interment form with new data (for edit flow)
   * @param data - Interment data object with fields to update
   */
  async updateIntermentForm(data: Partial<IntermentData>): Promise<void> {
    this.logger.info('Updating interment form');

    // Click "Deceased person" tab to access the form fields
    await this.page.getByRole('button', { name: 'Deceased person' }).click();
    await this.page.waitForTimeout(1000);

    // Update first name if provided
    if (data.firstName) {
      this.logger.info(`Updating first name to: ${data.firstName}`);
      const firstNameField = this.page.getByLabel('First name').first();
      await firstNameField.click();
      await firstNameField.clear();
      await firstNameField.fill(data.firstName);
      await this.page.waitForTimeout(500);
    }

    // Update last name if provided
    if (data.lastName) {
      this.logger.info(`Updating last name to: ${data.lastName}`);
      const lastNameField = this.page.getByLabel('Last name').first();
      await lastNameField.click();
      await lastNameField.clear();
      await lastNameField.fill(data.lastName);
      await this.page.waitForTimeout(500);
    }

    // Clear middle name if both firstName and lastName are provided (full name replacement)
    if (data.firstName && data.lastName) {
      this.logger.info('Clearing middle name for clean full name');
      const middleNameField = this.page.getByLabel('Middle name').first();
      await middleNameField.click();
      await middleNameField.clear();
      await this.page.waitForTimeout(500);
    } else if (data.middleName !== undefined) {
      // Only update middle name if explicitly provided
      this.logger.info(`Updating middle name to: ${data.middleName}`);
      const middleNameField = this.page.getByLabel('Middle name').first();
      await middleNameField.click();
      await middleNameField.clear();
      if (data.middleName) {
        await middleNameField.fill(data.middleName);
      }
    }

    // Click "Interment details" tab if interment type needs to be updated
    if (data.intermentType) {
      await this.page.getByRole('button', { name: 'Interment details' }).click();
      await this.page.waitForTimeout(1000);
      
      this.logger.info(`Updating interment type to: ${data.intermentType}`);
      await this.selectIntermentType(data.intermentType);
    }

    this.logger.success('Interment form updated');
  }
}
