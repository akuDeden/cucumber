import { Page, expect } from '@playwright/test';
import { PersonSelectors } from '../../selectors/p0/person.selectors.js';
import { Logger } from '../../utils/Logger.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';

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
    
    // Wait for person API to load data - try with more flexible pattern
    try {
      await NetworkHelper.waitForApiEndpoint(this.page, '/person', 30000);
    } catch (error) {
      this.logger.warn('Could not detect person API, waiting with timeout instead');
      await this.page.waitForTimeout(2000);
    }
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
   * Click the save button (auto-detects add vs edit based on URL)
   */
  async clickSave(): Promise<void> {
    const url = this.page.url();
    
    // Check if we're on edit page or add page
    if (url.includes('/manage/edit/person')) {
      this.logger.info('Detected edit context, using edit save button');
      await this.clickSaveEdit();
    } else if (url.includes('/manage/add/person')) {
      this.logger.info('Detected add context, using add save button');
      await this.clickSaveAdd();
    } else {
      this.logger.warn(`Unknown context URL: ${url}, defaulting to add save button`);
      await this.clickSaveAdd();
    }
  }

  /**
   * Click the save button (for adding new person)
   */
  async clickSaveAdd(): Promise<void> {
    this.logger.info('Clicking save button (add person)');
    
    const saveButton = this.page.locator(PersonSelectors.saveAddButton);
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Validate button text is "Save" before clicking
    const buttonText = await saveButton.textContent();
    this.logger.info(`Button text: "${buttonText?.trim()}"`);
    
    if (!buttonText || !buttonText.toLowerCase().includes('save')) {
      this.logger.error(`Button text is not "Save", found: "${buttonText}". Aborting click.`);
      throw new Error(`Expected Save button but found: "${buttonText}"`);
    }
    
    await saveButton.click();
    
    // Wait for navigation back to persons table
    await this.page.waitForURL('**/advance-table?tab=persons', { timeout: 20000 });
    this.logger.info('Person saved successfully, navigated back to persons table');
    
    // Wait for person API to reload data after save
    try {
      await NetworkHelper.waitForApiEndpoint(this.page, '/person', 30000);
    } catch (error) {
      this.logger.warn('Could not detect person API, waiting with timeout instead');
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Click the save button (for editing existing person)
   */
  async clickSaveEdit(): Promise<void> {
    this.logger.info('Clicking save button (edit person)');
    
    // Check for validation errors before saving
    const hasErrors = await this.page.evaluate(() => {
      const errorElements = document.querySelectorAll('.mat-error, .error, [class*="error"]');
      const visibleErrors = Array.from(errorElements).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });
      return visibleErrors.map(el => el.textContent?.trim()).filter(Boolean);
    });
    
    if (hasErrors.length > 0) {
      this.logger.warn(`Form has validation errors: ${JSON.stringify(hasErrors)}`);
    } else {
      this.logger.info('No visible validation errors found');
    }
    
    const saveButton = this.page.locator(PersonSelectors.saveEditButton);
    await saveButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Validate button text is "Save" before clicking
    const buttonText = await saveButton.textContent();
    this.logger.info(`Button text: "${buttonText?.trim()}"`);
    
    if (!buttonText || !buttonText.toLowerCase().includes('save')) {
      this.logger.error(`Button text is not "Save", found: "${buttonText}". Aborting click.`);
      throw new Error(`Expected Save button but found: "${buttonText}"`);
    }
    
    // Check if save button is disabled
    const isDisabled = await saveButton.isDisabled();
    if (isDisabled) {
      this.logger.error('Save button is disabled! Cannot save.');
      throw new Error('Save button is disabled');
    }
    
    // Listen for console errors
    const consoleMessages: string[] = [];
    const consoleListener = (msg: any) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    };
    this.page.on('console', consoleListener);
    
    // Set up response listener for save API call
    let apiCalled = false;
    const responsePromise = this.page.waitForResponse(
      response => {
        const url = response.url();
        const method = response.request().method();
        const isPersonApi = url.includes('/person/') && (method === 'PUT' || method === 'PATCH');
        if (isPersonApi) {
          apiCalled = true;
        }
        return isPersonApi;
      },
      { timeout: 15000 }
    ).catch(() => null);
    
    await saveButton.click();
    this.logger.info('Save button clicked');
    
    // Wait a bit to see if API call is made
    await this.page.waitForTimeout(2000);
    
    // Remove console listener
    this.page.off('console', consoleListener);
    
    if (consoleMessages.length > 0) {
      this.logger.warn(`Console errors after save click: ${consoleMessages.join(', ')}`);
    }
    
    // Wait for save API response
    const response = await responsePromise;
    if (response) {
      const status = response.status();
      this.logger.info(`Save API response status: ${status}`);
      
      if (status >= 200 && status < 300) {
        this.logger.info('Person save API call successful');
        const body = await response.json().catch(() => ({}));
        this.logger.info(`Response body: ${JSON.stringify(body).substring(0, 200)}`);
      } else {
        this.logger.warn(`Save API returned non-success status: ${status}`);
        const body = await response.text();
        this.logger.warn(`Response body: ${body.substring(0, 200)}`);
      }
    } else if (!apiCalled) {
      this.logger.warn('No save API call was made - form might think there are no changes');
    }
    
    // Wait for navigation back to persons table
    await this.page.waitForURL('**/advance-table?tab=persons', { timeout: 20000 });
    this.logger.info('Person saved successfully, navigated back to persons table');
    
    // Wait for person API to reload data after save
    try {
      await NetworkHelper.waitForApiEndpoint(this.page, '/person', 30000);
    } catch (error) {
      this.logger.warn('Could not detect person API, waiting with timeout instead');
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Get the person name from the first row of the table
   */
  async getFirstRowPersonName(): Promise<string> {
    this.logger.info('Getting person name from first row');
    
    // Wait for person API to ensure data is loaded
    try {
      await NetworkHelper.waitForApiEndpoint(this.page, '/person', 30000);
    } catch (error) {
      this.logger.warn('Could not detect person API, waiting with timeout instead');
      await this.page.waitForTimeout(2000);
    }
    
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
    
    // Debug: Check what rows are actually visible
    const rowInfo = await this.page.evaluate(() => {
      const grid = document.querySelector('[role="grid"]');
      if (!grid) return { totalRows: 0, visibleRows: 0, firstDataRowHTML: '' };
      const rows = Array.from(grid.querySelectorAll('[role="row"]'));
      const visibleRows = rows.filter((row) => {
        const style = window.getComputedStyle(row);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      return {
        totalRows: rows.length,
        visibleRows: visibleRows.length,
        firstDataRowHTML: rows.length > 1 ? rows[1].outerHTML.substring(0, 500) : 'No data row'
      };
    });
    this.logger.info(`Grid rows - Total: ${rowInfo.totalRows}, Visible: ${rowInfo.visibleRows}`);
    
    // Use a more robust selector: look for the second row (first data row) within the grid
    const gridLocator = this.page.locator('[role="grid"]');
    const firstDataRow = gridLocator.locator('[role="row"]').nth(1); // 0 = header, 1 = first data row
    
    try {
      await firstDataRow.waitFor({ state: 'visible', timeout: 5000 });
      
      // Scroll into view to ensure virtual scrolling loads the content
      await firstDataRow.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(1000); // Wait for content to load
      
    } catch (error) {
      this.logger.error('First data row not visible');
      this.logger.info(`First row HTML: ${rowInfo.firstDataRowHTML || 'Not found'}`);
      throw error;
    }
    
    // Get cells from first data row
    const cells = firstDataRow.locator('[role="gridcell"]');
    
    // Debug: Log all cell contents and row text
    const cellCount = await cells.count();
    const rowText = await firstDataRow.innerText();
    this.logger.info(`Number of cells in first row: ${cellCount}`);
    this.logger.info(`Full row text: "${rowText}"`);
    
    for (let i = 0; i < Math.min(cellCount, 10); i++) { // Only first 10 cells for brevity
      const cellText = await cells.nth(i).innerText();
      this.logger.info(`Cell ${i} innerText: "${cellText?.trim()}"`);
    }
    
    const firstName = await cells.nth(1).innerText(); // Column 2 (0-indexed)
    const lastName = await cells.nth(3).innerText();  // Column 4 (0-indexed)
    
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

  /**
   * Click filter button to open filter dialog
   */
  async clickFilterButton(): Promise<void> {
    this.logger.info('Clicking filter button');
    
    const filterButton = this.page.locator(PersonSelectors.filterButton);
    await filterButton.waitFor({ state: 'visible', timeout: 10000 });
    await filterButton.click();
    
    this.logger.info('Filter dialog opened');
    await this.page.waitForTimeout(500); // Wait for filter dialog to open
  }

  /**
   * Fill filter form with first name and last name
   */
  async fillFilterForm(firstName: string, lastName: string): Promise<void> {
    this.logger.info(`Filling filter form with: ${firstName} ${lastName}`);
    
    // Fill first name
    const firstNameInput = this.page.locator(PersonSelectors.filterFirstNameInput);
    await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await firstNameInput.fill(firstName);
    
    // Fill last name
    const lastNameInput = this.page.locator(PersonSelectors.filterLastNameInput);
    await lastNameInput.fill(lastName);
    
    this.logger.info('Filter form filled');
  }

  /**
   * Apply filter
   */
  async applyFilter(): Promise<void> {
    this.logger.info('Applying filter');
    
    const applyButton = this.page.locator(PersonSelectors.filterApplyButton);
    await applyButton.waitFor({ state: 'visible', timeout: 5000 });
    await applyButton.click();
    
    this.logger.info('Filter applied, waiting for table to reload');
    
    // Wait for person API to reload data with filter
    try {
      await NetworkHelper.waitForApiEndpoint(this.page, '/person', 30000);
    } catch (error) {
      this.logger.warn('Could not detect person API, waiting with timeout instead');
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Click first row to open person details
   */
  async clickFirstRow(): Promise<void> {
    this.logger.info('Clicking first row to open person details');
    
    // Wait for grid with actual data rows
    await this.page.waitForFunction(`() => {
      const grid = document.querySelector('[role="grid"]');
      if (!grid) return false;
      const rows = grid.querySelectorAll('[role="row"]');
      return rows.length >= 2;
    }`, { timeout: 10000 });
    
    const gridLocator = this.page.locator('[role="grid"]');
    const firstDataRow = gridLocator.locator('[role="row"]').nth(1);
    
    // Try double click to open edit page
    await firstDataRow.dblclick();
    
    this.logger.info('First row double-clicked, waiting for edit page');
    
    // Wait for navigation to edit page
    try {
      await this.page.waitForURL('**/manage/edit/person/**', { timeout: 10000 });
      this.logger.info('Successfully navigated to person edit page');
    } catch (error) {
      this.logger.warn('Did not navigate to edit page, might need different approach');
      // If double click doesn't work, try single click and wait
      await firstDataRow.click();
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Click edit button in person details sidebar
   */
  async clickEditButton(): Promise<void> {
    this.logger.info('Clicking edit button');
    
    const editButton = this.page.locator(PersonSelectors.editButton);
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();
    
    this.logger.info('Edit button clicked, navigating to edit form');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Edit person's last name only (for edit scenario)
   */
  async editPersonLastName(newLastName: string): Promise<void> {
    this.logger.info(`Editing person last name to: ${newLastName}`);
    
    // First, verify we're on the edit page
    const url = this.page.url();
    this.logger.info(`Current URL: ${url}`);
    
    if (!url.includes('/manage/edit/person')) {
      throw new Error('Not on person edit page');
    }
    
    const lastNameInput = this.page.locator(PersonSelectors.lastNameInput);
    await lastNameInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Check the current value
    const currentValue = await lastNameInput.inputValue();
    this.logger.info(`Current last name value: "${currentValue}"`);
    
    // Click to focus
    await lastNameInput.click();
    await this.page.waitForTimeout(200);
    
    // Clear field completely using multiple methods
    await lastNameInput.clear();
    await this.page.waitForTimeout(300);
    
    // Verify field is empty
    let fieldValue = await lastNameInput.inputValue();
    if (fieldValue) {
      this.logger.info('Field not empty after clear, trying select all + delete');
      await lastNameInput.click({ clickCount: 3 }); // Triple click to select all
      await this.page.waitForTimeout(200);
      await this.page.keyboard.press('Backspace');
      await this.page.waitForTimeout(300);
    }
    
    // Type the new value
    await lastNameInput.type(newLastName, { delay: 50 });
    await this.page.waitForTimeout(300);
    
    // Blur to trigger validation
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(500);
    
    // Verify the value was actually set
    const actualValue = await lastNameInput.inputValue();
    this.logger.info(`Last name field value after edit: "${actualValue}"`);
    
    if (actualValue !== newLastName) {
      throw new Error(`Failed to set last name. Expected "${newLastName}" but got "${actualValue}"`);
    }
    
    this.logger.info(`Last name updated successfully to: ${newLastName}`);
  }

  /**
   * Click delete button
   */
  async clickDelete(): Promise<void> {
    this.logger.info('Clicking delete button');
    const deleteButton = this.page.locator(PersonSelectors.deleteButton);
    await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await deleteButton.click();
    await this.page.waitForTimeout(1000);
    this.logger.info('Delete button clicked, waiting for confirmation dialog');
  }

  /**
   * Confirm delete in dialog
   */
  async confirmDelete(): Promise<void> {
    this.logger.info('Confirming delete in dialog');
    
    // Wait for and click confirm delete button in dialog
    const confirmButton = this.page.locator(PersonSelectors.confirmDeleteButton).last();
    await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // Wait for delete API call
    const deletePromise = this.page.waitForResponse(
      response => response.url().includes('/customer-organization/person') && 
                  response.request().method() === 'DELETE',
      { timeout: 15000 }
    );
    
    await confirmButton.click();
    this.logger.info('Confirm delete button clicked');
    
    try {
      const deleteResponse = await deletePromise;
      const status = deleteResponse.status();
      this.logger.info(`Delete API response status: ${status}`);
      
      if (status === 200 || status === 204) {
        this.logger.info('Person deleted successfully');
      } else {
        this.logger.warn(`Delete API returned non-success status: ${status}`);
      }
    } catch (error) {
      this.logger.warn('Delete API call timeout or error');
    }
    
    // Wait for navigation back to persons table
    await this.page.waitForURL('**/advance-table?tab=persons', { timeout: 20000 });
    this.logger.info('Navigated back to persons table after deletion');
    
    // Wait for person API to reload data after deletion
    try {
      await NetworkHelper.waitForApiEndpoint(this.page, '/person', 30000);
    } catch (error) {
      this.logger.warn('Could not detect person API, waiting with timeout instead');
      await this.page.waitForTimeout(2000);
    }
  }

  /**
   * Verify person is NOT in the table by checking the person name
   */
  async verifyPersonNotInList(expectedName: string): Promise<void> {
    this.logger.info(`Verifying person "${expectedName}" is NOT in the list`);
    
    // Clear any active filters first by reloading the page
    // This ensures we're checking the full list, not a filtered subset
    await this.page.reload({ waitUntil: 'networkidle' });
    this.logger.info('Page reloaded to clear filters');
    
    await this.page.waitForTimeout(2000);
    
    // Wait for table to finish loading
    try {
      await this.page.waitForSelector('[role="grid"] progressbar', { state: 'detached', timeout: 15000 });
      this.logger.info('Table loading complete');
    } catch (error) {
      this.logger.info('No loading indicators found or already loaded');
    }
    
    await this.page.waitForTimeout(1000);
    
    // Get all person names from the table
    const allNames = await this.page.evaluate(() => {
      const grid = document.querySelector('[role="grid"]');
      if (!grid) return [];
      
      const rows = Array.from(grid.querySelectorAll('[role="row"]'));
      // Skip header row (first row)
      const dataRows = rows.slice(1);
      
      return dataRows.map((row) => {
        const cells = Array.from(row.querySelectorAll('[role="gridcell"]'));
        // Assuming first name is in column 2, last name is in column 4 (index 1 and 3)
        const firstName = cells[1]?.textContent?.trim() || '';
        const lastName = cells[3]?.textContent?.trim() || '';
        return `${firstName} ${lastName}`.trim();
      }).filter(name => name && name !== '--' && name !== '  ');
    });
    
    this.logger.info(`Found ${allNames.length} persons in the table`);
    this.logger.info(`Names: ${allNames.join(', ')}`);
    
    // Check if the deleted person name is in the list
    const personFound = allNames.some(name => name === expectedName);
    
    if (personFound) {
      throw new Error(`Person "${expectedName}" is still in the list after deletion!`);
    }
    
    this.logger.info(`✓ Person "${expectedName}" is NOT in the list (deleted successfully)`);
  }
}
