import { Page, expect } from '@playwright/test';
import { PersonSelectors } from '../../selectors/p0/person.selectors.js';
import { Logger } from '../../utils/Logger.js';

export interface PersonData {
  firstName: string;
  lastName: string;
  middleName?: string;
  title?: string;
  gender?: string;
  phoneM?: string;
  phoneH?: string;
  phoneO?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postCode?: string;
  note?: string;
}

export class PersonPage {
  readonly page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('PersonPage');
  }

  /**
   * Navigate to the PERSONS tab from advance table page
   */
  async navigateToPersonTab(): Promise<void> {
    this.logger.info('Navigating to PERSONS tab');
    
    const personTab = this.page.locator(PersonSelectors.personTab);
    await personTab.waitFor({ state: 'visible', timeout: 15000 });
    await personTab.click();
    
    this.logger.info('PERSONS tab clicked successfully');
    await this.page.waitForTimeout(1000); // Wait for tab content to load
  }

  /**
   * Click Add Person button
   */
  async clickAddPerson(): Promise<void> {
    this.logger.info('Clicking Add Person button');
    
    const button = this.page.locator(PersonSelectors.addPersonButton);
    await button.waitFor({ state: 'visible', timeout: 15000 });
    await button.click();
    
    // Wait for navigation to add person form
    await this.page.waitForURL('**/manage/add/person/**', { timeout: 15000 });
    this.logger.info('Navigated to add person form');
  }

  /**
   * Fill the person form with provided data
   */
  async fillPersonForm(data: PersonData): Promise<void> {
    this.logger.info('Filling person form with data');

    // Required fields
    await this.fillField(PersonSelectors.firstNameInput, data.firstName, 'First Name');
    await this.fillField(PersonSelectors.lastNameInput, data.lastName, 'Last Name');

    // Optional fields
    if (data.middleName) {
      await this.fillField(PersonSelectors.middleNameInput, data.middleName, 'Middle Name');
    }
    
    if (data.title) {
      await this.fillField(PersonSelectors.titleInput, data.title, 'Title');
    }

    if (data.gender) {
      await this.selectGender(data.gender);
    }

    if (data.phoneM) {
      await this.fillField(PersonSelectors.phoneMobileInput, data.phoneM, 'Phone Mobile');
    }

    if (data.phoneH) {
      await this.fillField(PersonSelectors.phoneHomeInput, data.phoneH, 'Phone Home');
    }

    if (data.phoneO) {
      await this.fillField(PersonSelectors.phoneOfficeInput, data.phoneO, 'Phone Office');
    }

    if (data.email) {
      await this.fillField(PersonSelectors.emailInput, data.email, 'Email');
    }

    if (data.address) {
      await this.fillField(PersonSelectors.addressInput, data.address, 'Address');
    }

    if (data.city) {
      await this.fillField(PersonSelectors.cityInput, data.city, 'City');
    }

    if (data.state) {
      await this.fillField(PersonSelectors.stateInput, data.state, 'State');
    }

    if (data.country) {
      await this.fillField(PersonSelectors.countryInput, data.country, 'Country');
    }

    if (data.postCode) {
      await this.fillField(PersonSelectors.postCodeInput, data.postCode, 'Post Code');
    }

    if (data.note) {
      await this.fillField(PersonSelectors.notesTextarea, data.note, 'Note');
    }

    this.logger.info('Person form filled successfully');
  }

  /**
   * Helper method to fill a form field
   */
  private async fillField(selector: string, value: string, fieldName: string): Promise<void> {
    this.logger.info(`Filling ${fieldName}: ${value}`);
    const field = this.page.locator(selector);
    await field.waitFor({ state: 'visible', timeout: 10000 });
    
    // Clear field first
    await field.clear();
    await this.page.waitForTimeout(300);
    
    // Fill field
    await field.fill(value);
    await this.page.waitForTimeout(300);
  }

  /**
   * Select gender from dropdown
   */
  private async selectGender(gender: string): Promise<void> {
    this.logger.info(`Selecting gender: ${gender}`);
    
    // Click dropdown to open
    const dropdown = this.page.locator(PersonSelectors.genderDropdown);
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    await dropdown.click();
    
    // Wait for dropdown options to appear
    await this.page.waitForTimeout(500);
    
    // Select option - using exact match with getByRole
    const option = this.page.getByRole('option', { name: gender, exact: true });
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    
    this.logger.info(`Gender ${gender} selected`);
  }

  /**
   * Click the save button
   */
  async clickSave(): Promise<void> {
    this.logger.info('Clicking save button');
    
    const saveButton = this.page.locator(PersonSelectors.saveButton);
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await saveButton.click();
    
    // Wait for navigation back to persons table
    await this.page.waitForURL('**/advance-table?tab=persons', { timeout: 20000 });
    this.logger.info('Person saved successfully, navigated back to persons table');
    
    // Wait for table to load
    await this.page.waitForTimeout(2000);
  }

  /**
   * Get the person name from the first row of the table
   */
  async getFirstRowPersonName(): Promise<string> {
    this.logger.info('Getting person name from first row');
    
    // Wait for table to finish loading (progressbar elements should disappear)
    try {
      await this.page.waitForSelector('[role="grid"] progressbar', { state: 'detached', timeout: 25000 });
      this.logger.info('Table loading complete');
    } catch (error) {
      this.logger.info('No loading indicators found or already loaded');
    }
    
    // Wait for grid with actual data rows (not just header)
    await this.page.waitForFunction(`() => {
      const grid = document.querySelector('[role="grid"]');
      if (!grid) return false;
      const rows = grid.querySelectorAll('[role="row"]');
      // Grid should have at least 2 rows: 1 header + 1 data row
      return rows.length >= 2;
    }`, { timeout: 10000 });
    
    this.logger.info('Data rows are present in grid');
    
    // Use a more robust selector: look for the second row (first data row) within the grid
    const gridLocator = this.page.locator('[role="grid"]');
    const firstDataRow = gridLocator.locator('[role="row"]').nth(1); // 0 = header, 1 = first data row
    await firstDataRow.waitFor({ state: 'visible', timeout: 5000 });
    
    // Get cells from first data row
    const cells = firstDataRow.locator('[role="gridcell"]');
    const firstName = await cells.nth(1).textContent(); // Column 2 (0-indexed)
    const lastName = await cells.nth(3).textContent();  // Column 4 (0-indexed)
    
    const fullName = `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim();
    this.logger.info(`First row person name: ${fullName}`);
    
    return fullName;
  }

  /**
   * Verify person appears in first row
   */
  async verifyPersonInFirstRow(expectedName: string): Promise<void> {
    this.logger.info(`Verifying person "${expectedName}" appears in first row`);
    
    const actualName = await this.getFirstRowPersonName();
    
    expect(actualName).toBe(expectedName);
    this.logger.info(`Person verified successfully in first row: ${actualName}`);
  }
}
