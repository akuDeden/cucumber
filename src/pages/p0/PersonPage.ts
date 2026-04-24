import { Page, expect } from '@playwright/test';
import { PersonSelectors } from '../../selectors/p0/person/index.js';
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
    
    // Set up listener BEFORE clicking the tab
    const personApiPromise = this.page.waitForResponse(
      (response) => response.url().includes('/person') && response.status() === 200,
      {}
    ).catch(() => null);
    
    const personTab = this.page.locator(PersonSelectors.personTab);
    await personTab.waitFor({ state: 'visible' });
    await personTab.click();
    
    this.logger.info('PERSONS tab clicked successfully');
    
    // Wait for person API to load data
    try {
      await personApiPromise;
      this.logger.info('Person API response received');
      // Wait for data to render
      await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 2000 });
    } catch (error) {
      this.logger.warn('Could not detect person API, waiting for stabilization instead');
      await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });
    }
  }

  /**
   * Click Add Person button
   */
  async clickAddPerson(): Promise<void> {
    this.logger.info('Clicking Add Person button');
    
    const button = this.page.locator(PersonSelectors.addPersonButton);
    await button.waitFor({ state: 'visible' });
    await button.click();
    
    // Wait for navigation to add person form
    await this.page.waitForURL('**/manage/add/person/**');
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
    await field.waitFor({ state: 'visible' });
    
    // Clear field first
    await field.clear();
    
    // Fill field
    await field.fill(value);
  }

  /**
   * Select gender from dropdown
   */
  private async selectGender(gender: string): Promise<void> {
    this.logger.info(`Selecting gender: ${gender}`);
    
    // Click dropdown to open
    const dropdown = this.page.locator(PersonSelectors.genderDropdown);
    await dropdown.waitFor({ state: 'visible' });
    await dropdown.click();
    
    // Wait for dropdown options to appear
    const option = this.page.getByRole('option', { name: gender, exact: true });
    await option.waitFor({ state: 'visible' });
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
    await saveButton.waitFor({ state: 'visible' });
    
    // Validate button text is "Save" before clicking
    const buttonText = await saveButton.textContent();
    this.logger.info(`Button text: "${buttonText?.trim()}"`);
    
    if (!buttonText || !buttonText.toLowerCase().includes('save')) {
      this.logger.error(`Button text is not "Save", found: "${buttonText}". Aborting click.`);
      throw new Error(`Expected Save button but found: "${buttonText}"`);
    }
    
    // Set up listener BEFORE clicking - this is the key fix!
    const personApiPromise = this.page.waitForResponse(
      (response) => response.url().includes('/person') && response.status() === 200,
      {}
    ).catch(() => null);
    
    await saveButton.click();
    
    // Wait for navigation back to persons table
    await this.page.waitForURL('**/advance-table?tab=persons');
    this.logger.info('Person saved successfully, navigated back to persons table');
    
    // Wait for person API to reload data after save
    try {
      await personApiPromise;
      this.logger.info('Person API response received after save');
      // Wait for data to render
      await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 2000 });
    } catch (error) {
      this.logger.warn('Could not detect person API, waiting for stabilization instead');
      await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });
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
    await saveButton.waitFor({ state: 'visible' });
    
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
    // Actual endpoint: PUT/PATCH /api/v1/cemetery/{cemId}/person/{personId}/ or /api/v1/adv_table/persons/{id}/
    let apiCalled = false;
    const responsePromise = this.page.waitForResponse(
      response => {
        const url = response.url();
        const method = response.request().method();
        const isPersonApi = (url.includes('/person/') || url.includes('/persons/')) && 
                            (method === 'PUT' || method === 'PATCH') &&
                            url.includes('/api/');
        if (isPersonApi) {
          apiCalled = true;
        }
        return isPersonApi;
      },
      {}
    ).catch(() => null);
    
    await saveButton.click();
    this.logger.info('Save button clicked');
    
    // Wait for save API response
    const response = await responsePromise;
    
    // Remove console listener
    this.page.off('console', consoleListener);
    
    if (consoleMessages.length > 0) {
      this.logger.warn(`Console errors after save click: ${consoleMessages.join(', ')}`);
    }
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
    await this.page.waitForURL('**/advance-table?tab=persons');
    this.logger.info('Person saved successfully, navigated back to persons table');
    
    // Wait for table data to reload after save
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 3000 });
  }

  /**
   * Get the person name from the first row of the table
   */
  async getFirstRowPersonName(): Promise<string> {
    this.logger.info('Getting person name from first row');

    // Wait for table to finish loading (progressbar elements should disappear)
    try {
      await this.page.waitForSelector('[role="table"] progressbar', { state: 'detached' });
      this.logger.info('Table loading complete');
    } catch (error) {
      this.logger.info('No loading indicators found or already loaded');
    }

    // Wait for table with actual data rows (not just header)
    await this.page.waitForFunction(`() => {
      const table = document.querySelector('[role="table"]');
      if (!table) return false;
      const rows = table.querySelectorAll('[role="row"]');
      // Table should have at least 2 rows: 1 header + 1 data row
      return rows.length >= 2;
    }`);

    this.logger.info('Data rows are present in table');

    // Use evaluate to directly get the first row data (more reliable than locator.waitFor)
    const personData = await this.page.evaluate(() => {
      const table = document.querySelector('[role="table"]');
      if (!table) {
        return { error: 'Table not found', firstName: '', lastName: '', totalRows: 0 };
      }

      const rows = Array.from(table.querySelectorAll('[role="row"]'));
      if (rows.length < 2) {
        return { error: 'Less than 2 rows', firstName: '', lastName: '', totalRows: rows.length };
      }

      // Get first data row (index 1, index 0 is header)
      const firstDataRow = rows[1];
      const cells = Array.from(firstDataRow.querySelectorAll('[role="cell"]'));

      // Column 1 = First Name, Column 3 = Last Name
      const firstName = cells.length > 1 ? cells[1].textContent?.trim() : '';
      const lastName = cells.length > 3 ? cells[3].textContent?.trim() : '';

      return { firstName, lastName, totalRows: rows.length, error: null };
    });

    if (personData.error) {
      this.logger.error(`Failed to extract person data: ${personData.error}, totalRows: ${personData.totalRows}`);
      throw new Error(`Failed to extract person data from first row: ${personData.error}`);
    }

    this.logger.info(`Table rows - Total: ${personData.totalRows}`);
    this.logger.info(`First row person - First Name: "${personData.firstName}", Last Name: "${personData.lastName}"`);

    const fullName = `${personData.firstName || ''} ${personData.lastName || ''}`.trim();

    if (!fullName) {
      throw new Error('First row does not contain person name data');
    }

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
    await filterButton.waitFor({ state: 'visible' });
    await filterButton.click();
    
    this.logger.info('Filter dialog opened');
    // Wait for filter dialog to fully render
    await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' }).catch(() => {});
  }

  /**
   * Fill filter form with first name and last name
   */
  async fillFilterForm(firstName: string, lastName: string): Promise<void> {
    this.logger.info(`Filling filter form with: ${firstName} ${lastName}`);
    
    // Fill first name
    const firstNameInput = this.page.locator(PersonSelectors.filterFirstNameInput);
    await firstNameInput.waitFor({ state: 'visible' });
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
    await applyButton.waitFor({ state: 'visible' });

    // Set up listener BEFORE clicking apply
    const personApiPromise = this.page.waitForResponse(
      (response) => response.url().includes('/person') && response.status() === 200,
      {}
    ).catch(() => null);

    await applyButton.click();

    this.logger.info('Filter applied, waiting for table to reload');

    // Wait for person API to reload data with filter
    try {
      await personApiPromise;
      this.logger.info('Person API response received after filter');
    } catch (error) {
      this.logger.warn('Could not detect person API, waiting for stabilization instead');
    }

    // Wait for the filter dialog to close
    try {
      await this.page.waitForFunction(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog && dialog.getBoundingClientRect().width > 0) {
          return false;
        }
        return true;
      });
      this.logger.info('Filter dialog closed');
    } catch (error) {
      this.logger.info('Could not verify dialog closed, continuing anyway');
    }
  }

  /**
   * Click first row to open person details
   */
  async clickFirstRow(): Promise<void> {
    this.logger.info('Clicking first row to open person details');

    // Wait for table with actual data rows
    await this.page.waitForFunction(`() => {
      const table = document.querySelector('[role="table"]');
      if (!table) return false;
      const rows = table.querySelectorAll('[role="row"]');
      return rows.length >= 2;
    }`);

    const tableLocator = this.page.locator('[role="table"]');
    const firstDataRow = tableLocator.locator('[role="row"]').nth(1);

    // Try double click to open edit page
    await firstDataRow.dblclick();

    this.logger.info('First row double-clicked, waiting for edit page');

    // Wait for navigation to edit page
    try {
      await this.page.waitForURL('**/manage/edit/person/**');
      this.logger.info('Successfully navigated to person edit page');
    } catch (error) {
      this.logger.warn('Did not navigate to edit page, might need different approach');
      await firstDataRow.click();
      await this.page.waitForURL('**/manage/edit/person/**').catch(() => {});
    }

    // Wait for the edit form to be fully loaded (Chronicle polls continuously)
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 2000 });
  }

  /**
   * Click edit button in person details sidebar
   */
  async clickEditButton(): Promise<void> {
    this.logger.info('Clicking edit button');
    
    const editButton = this.page.locator(PersonSelectors.editButton);
    await editButton.waitFor({ state: 'visible' });
    await editButton.click();
    
    this.logger.info('Edit button clicked, navigating to edit form');
    await this.page.waitForURL('**/manage/edit/person/**');
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
    await lastNameInput.waitFor({ state: 'visible' });
    
    // Check the current value
    const currentValue = await lastNameInput.inputValue();
    this.logger.info(`Current last name value: "${currentValue}"`);
    
    // Click to focus
    await lastNameInput.click();
    
    // Clear field completely using multiple methods
    await lastNameInput.clear();
    
    // Verify field is empty
    let fieldValue = await lastNameInput.inputValue();
    if (fieldValue) {
      this.logger.info('Field not empty after clear, trying select all + delete');
      await lastNameInput.click({ clickCount: 3 }); // Triple click to select all
      await this.page.keyboard.press('Backspace');
    }
    
    // Type the new value
    await lastNameInput.pressSequentially(newLastName, { delay: 50 });
    
    // Blur to trigger validation
    await this.page.keyboard.press('Tab');
    
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

    // Wait for page to be stable before clicking delete (Chronicle polls continuously)
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);

    const deleteButton = this.page.locator(PersonSelectors.deleteButton);
    await deleteButton.waitFor({ state: 'visible' });
    await deleteButton.click();

    // Wait for the delete confirmation dialog to appear
    const dialog = this.page.locator(PersonSelectors.deleteDialog);
    await dialog.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for the confirm button inside the dialog to be ready
    const confirmButton = this.page.locator(PersonSelectors.confirmDeleteButton);
    await confirmButton.waitFor({ state: 'visible' });
    this.logger.info('Delete button clicked, confirmation dialog visible');
  }

  /**
   * Confirm delete in dialog
   */
  async confirmDelete(): Promise<void> {
    this.logger.info('Confirming delete in dialog');
    
    // Wait for the confirm delete button inside the dialog
    const confirmButton = this.page.locator(PersonSelectors.confirmDeleteButton);
    await confirmButton.waitFor({ state: 'visible' });
    
    // Set up delete API listener BEFORE clicking confirm
    // Actual endpoint: DELETE /api/v1/cemetery/{cemId}/person/{personId}/
    const deletePromise = this.page.waitForResponse(
      response => response.url().includes('/person/') && 
                  response.request().method() === 'DELETE',
      {}
    ).catch(() => null);
    
    await confirmButton.click();
    this.logger.info('Confirm delete button clicked');
    
    // Wait for delete API response
    if (deletePromise) {
      try {
        const deleteResponse = await deletePromise;
        if (deleteResponse) {
          const status = deleteResponse.status();
          this.logger.info(`Delete API response status: ${status}`);
          
          if (status === 200 || status === 204) {
            this.logger.info('Person deleted successfully');
          } else {
            this.logger.warn(`Delete API returned non-success status: ${status}`);
          }
        }
      } catch (error) {
        this.logger.warn('Delete API call timeout or error');
      }
    }
    
    // Wait for navigation back to persons table
    await this.page.waitForURL('**/advance-table?tab=persons', { timeout: 30000 });
    this.logger.info('Navigated back to persons table after deletion');
    
    // Wait for the table data to load after deletion
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 3000 });
  }

  /**
   * Search for a person by name using the filter and verify they appear in the first row
   * This is more robust than assuming the newly created person is in the first row
   * @param firstName - First name to search for
   * @param lastName - Last name to search for
   * @returns The full name found in the first row
   */
  async searchAndVerifyPersonInFirstRow(firstName: string, lastName: string): Promise<string> {
    this.logger.info(`Searching for person: ${firstName} ${lastName}`);

    // Wait for page to be fully loaded
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 2000 });

    // Open filter dialog
    await this.clickFilterButton();

    // Fill filter form
    await this.fillFilterForm(firstName, lastName);

    // Apply filter
    await this.applyFilter();

    // Wait for table to reload with filtered results
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 3000 });

    // Wait for table to finish loading
    try {
      await this.page.waitForSelector('[role="table"] progressbar', { state: 'detached' });
      this.logger.info('Table loading complete after filter');
    } catch (error) {
      this.logger.info('No loading indicators found or already loaded');
    }

    // Wait for table to be present
    await this.page.waitForSelector('[role="table"]', { state: 'attached' })
      .catch(() => {
        this.logger.error('Table element not found in DOM after filter');
        throw new Error('Table element not found in DOM after filter applied. The filter may have returned no results or the page structure has changed.');
      });

    this.logger.info('Table element found in DOM');

    // Check table has data rows using evaluate
    const hasData = await this.page.evaluate(() => {
      const table = document.querySelector('[role="table"]');
      if (!table) return { found: false, rows: 0 };
      const rows = table.querySelectorAll('[role="row"]');
      return { found: true, rows: rows.length };
    });

    this.logger.info(`Table state: found=${hasData.found}, rows=${hasData.rows}`);

    if (hasData.rows < 2) {
      // Not enough rows - might be "no results" or still loading
      this.logger.warn(`Table has only ${hasData.rows} rows, waiting longer...`);
      await NetworkHelper.waitForStabilization(this.page, { minWait: 1000, maxWait: 5000 });

      // Check again
      const retryData = await this.page.evaluate(() => {
        const table = document.querySelector('[role="table"]');
        if (!table) return { found: false, rows: 0 };
        const rows = table.querySelectorAll('[role="row"]');
        return { found: true, rows: rows.length };
      });

      if (retryData.rows < 2) {
        // Check for "no results" message
        const noResults = await this.page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          return bodyText.toLowerCase().includes('no results') ||
                 bodyText.toLowerCase().includes('no data') ||
                 bodyText.toLowerCase().includes('not found');
        });

        throw new Error(`Table has insufficient rows (${retryData.rows}). No results message: ${noResults}. Filter may not have found the person "${firstName} ${lastName}"`);
      }
    }

    // Get the first row data and verify
    const firstRowPerson = await this.page.evaluate(() => {
      const table = document.querySelector('[role="table"]');
      if (!table) {
        return { error: 'Table not found', firstName: '', lastName: '', totalRows: 0 };
      }

      const rows = Array.from(table.querySelectorAll('[role="row"]'));
      if (rows.length < 2) {
        return { error: 'Less than 2 rows', firstName: '', lastName: '', totalRows: rows.length };
      }

      const firstDataRow = rows[1];
      const cells = Array.from(firstDataRow.querySelectorAll('[role="cell"]'));

      // First Name is in column 2 (index 1), Last Name is in column 4 (index 3)
      const firstName = cells.length > 1 ? cells[1].textContent?.trim() : '';
      const lastName = cells.length > 3 ? cells[3].textContent?.trim() : '';

      return { firstName, lastName, totalRows: rows.length, error: null };
    });

    if (firstRowPerson.error) {
      this.logger.error(`Failed to extract person data: ${firstRowPerson.error}`);
      throw new Error(`Failed to extract person data from first row after filter: ${firstRowPerson.error}`);
    }

    const actualFirstName = firstRowPerson.firstName || '';
    const actualLastName = firstRowPerson.lastName || '';
    const fullName = `${actualFirstName} ${actualLastName}`.trim();

    this.logger.info(`First row after filter - First Name: "${actualFirstName}", Last Name: "${actualLastName}"`);

    // Verify the first name matches (case-insensitive)
    if (actualFirstName.toLowerCase() !== firstName.toLowerCase()) {
      throw new Error(`Expected first name "${firstName}" but found "${actualFirstName}" in first row after filter`);
    }

    this.logger.success(`✓ Person verified in first row after filter: ${fullName}`);
    return fullName;
  }

  /**
   * Verify person is NOT in the table by checking the person name
   */
  async verifyPersonNotInList(expectedName: string): Promise<void> {
    this.logger.info(`Verifying person "${expectedName}" is NOT in the list`);

    // Split full name to use filter — more reliable than scanning visible rows
    // (pagination means not all persons are visible; filter proves the record is gone)
    const parts = expectedName.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

    await this.clickFilterButton();
    await this.fillFilterForm(firstName, lastName);
    await this.applyFilter();
    await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 3000 });

    // Table should have only the header row (0 data rows) if person was deleted
    const tableState = await this.page.evaluate(() => {
      const table = document.querySelector('[role="table"]');
      if (!table) return { rows: 0 };
      return { rows: table.querySelectorAll('[role="row"]').length };
    });

    this.logger.info(`Table rows after filter for "${expectedName}": ${tableState.rows}`);

    if (tableState.rows >= 2) {
      const foundRow = await this.page.evaluate(() => {
        const table = document.querySelector('[role="table"]');
        if (!table) return '';
        const rows = Array.from(table.querySelectorAll('[role="row"]'));
        if (rows.length < 2) return '';
        const cells = Array.from(rows[1].querySelectorAll('[role="cell"]'));
        const fn = cells[1]?.textContent?.trim() || '';
        const ln = cells[3]?.textContent?.trim() || '';
        return `${fn} ${ln}`.trim();
      });
      throw new Error(`Person "${expectedName}" is still in the list after deletion! Found: "${foundRow}"`);
    }

    this.logger.info(`✓ Person "${expectedName}" is NOT in the list (deleted successfully)`);
  }

  /**
   * Clear the filter by reloading the page
   * Use this to reset the table to show all records
   */
  async clearFilter(): Promise<void> {
    this.logger.info('Clearing filter by reloading page');
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
    await this.page.waitForFunction(() => {
      const table = document.querySelector('[role="table"]');
      if (!table) return false;
      return table.querySelectorAll('[role="row"]').length >= 2;
    }, { timeout: 10000 }).catch(() => {});

    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 2000 });
    this.logger.success('Filter cleared');
  }
}
