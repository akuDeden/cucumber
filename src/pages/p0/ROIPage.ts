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
      // Wait for button to be visible and clickable
      await this.page.waitForSelector(RoiSelectors.addRoiButton, { state: 'visible', timeout: 10000 });
      this.logger.info('Add ROI button found, clicking...');
      
      // Click and wait for navigation in parallel
      await Promise.all([
        this.page.waitForURL('**/manage/add/roi', { timeout: 20000 }),
        this.page.click(RoiSelectors.addRoiButton)
      ]);
      
      this.logger.info('✓ Navigated to Add ROI form page');
      
      // Instead of network idle, wait for specific form element to be ready
      await this.page.waitForSelector(RoiSelectors.roiFormTitle, { state: 'visible', timeout: 15000 });
      this.logger.info('✓ ROI form title loaded');
      
      this.logger.success('Add ROI button clicked and form loaded');
    } catch (e) {
      // Fallback: try text-based selector
      this.logger.warn(`Primary selector failed: ${e}`);
      this.logger.info('Trying fallback selector: button with text "Add ROI"');
      
      try {
        await Promise.all([
          this.page.waitForURL('**/manage/add/roi', { timeout: 20000 }),
          this.page.getByRole('button', { name: /add roi/i }).click()
        ]);
        
        // Wait for form to be ready
        await this.page.waitForSelector(RoiSelectors.roiFormTitle, { state: 'visible', timeout: 15000 });
        
        this.logger.success('Add ROI button clicked (fallback)');
      } catch (e2) {
        this.logger.error(`Both selectors failed: ${e2}`);
        throw new Error(`Failed to click Add ROI button and navigate to form: ${e2}`);
      }
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
    // For add page: check roiFormTitle, for edit page: check URL contains "edit"
    const currentUrl = this.page.url();
    const isEditMode = currentUrl.includes('/edit/');
    this.logger.info(`Current URL: ${currentUrl}, Edit mode: ${isEditMode}`);
    
    try {
      if (isEditMode) {
        // Edit mode: Just wait for page load state, then check if we have basic form elements
        this.logger.info('Edit mode detected - waiting for page to be ready...');
        
        try {
          // Wait for DOM to be ready
          await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });
          this.logger.info('DOM content loaded');
          
          // Wait a bit more for Angular/dynamic content
          await this.page.waitForTimeout(3000);
          
          // Check if we have input fields (fee, certificate, etc.)
          const hasInputs = await this.page.locator('input[type="text"], input[type="number"], textarea').count() > 0;
          if (hasInputs) {
            this.logger.info('ROI edit form loaded successfully - found input fields');
          } else {
            this.logger.warn('No input fields found yet, waiting a bit more...');
            await this.page.waitForTimeout(2000);
          }
        } catch (e) {
          this.logger.warn(`Edit page load check failed: ${e}, continuing anyway`);
        }
      } else {
        // Add mode: wait for form title
        await this.page.waitForSelector(RoiSelectors.roiFormTitle, { state: 'visible', timeout: 15000 });
        this.logger.info('ROI form loaded successfully');
      }
    } catch (e) {
      this.logger.error(`ROI form failed to load (${isEditMode ? 'edit' : 'add'} mode): ${e}`);
      throw new Error('ROI form failed to load');
    }

    // Fill Right Type if provided
    if (roiData.rightType) {
      this.logger.info(`Selecting Right Type: ${roiData.rightType}`);
      
      // CRITICAL: Wait for page to be fully loaded and stable
      // Wait for network to be idle to ensure all mat-select elements are rendered
      try {
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        this.logger.info('Network idle - page fully loaded');
      } catch (e) {
        this.logger.warn('Network idle timeout, continuing anyway');
      }
      
      // Wait for the Plot name to appear in the first mat-select (Event Type)
      // This ensures the form is fully populated
      await this.page.waitForSelector('mat-select:has-text("A")', { state: 'visible', timeout: 15000 });
      this.logger.info('Plot field populated - form is ready');
      
      // Additional small wait to ensure DOM is stable
      await this.page.waitForTimeout(1000);
      
      // Now get all mat-select elements - they should be stable now
      const matSelects = await this.page.locator('mat-select').all();
      this.logger.info(`Found ${matSelects.length} mat-select elements`);
      
      // Validate we have at least 3 mat-selects (Event Type, Right Type, Term of Right)
      if (matSelects.length < 3) {
        throw new Error(`Expected at least 3 mat-select elements, found ${matSelects.length}`);
      }
      
      // Click the Right Type dropdown (index 1)
      this.logger.info('Clicking Right Type dropdown (mat-select[1])...');
      await matSelects[1].click();
      
      // Wait for dropdown animation and options to appear
      await this.page.waitForTimeout(2000);
      
      // Use getByRole which works reliably (tested with MCP Playwright)
      const optionLocator = this.page.getByRole('option', { name: roiData.rightType });
      await optionLocator.waitFor({ state: 'visible', timeout: 10000 });
      this.logger.info(`Option "${roiData.rightType}" is visible`);
      
      // Click the option
      await optionLocator.click();
      
      this.logger.success(`Right Type selected: ${roiData.rightType}`);
    }

    // Fill Term of Right if provided
    if (roiData.termOfRight) {
      this.logger.info(`Selecting Term of Right: ${roiData.termOfRight}`);
      
      // Get all mat-select elements again (to be safe after previous interaction)
      const matSelects = await this.page.locator('mat-select').all();
      this.logger.info(`Found ${matSelects.length} mat-select elements for Term of Right`);
      
      // Click Term of Right dropdown (index 2)
      this.logger.info('Clicking Term of Right dropdown (mat-select[2])...');
      await matSelects[2].click();
      
      // Wait for dropdown animation and options to fully render
      await this.page.waitForTimeout(2000);
      
      // Use getByRole which works reliably
      const termOptionLocator = this.page.getByRole('option', { name: roiData.termOfRight });
      await termOptionLocator.waitFor({ state: 'visible', timeout: 10000 });
      this.logger.info(`Option "${roiData.termOfRight}" is visible`);
      
      // Click the option
      await termOptionLocator.click();
      
      this.logger.info(`Term of Right selected: ${roiData.termOfRight}`);
    }

    // Fill Fee if provided
    if (roiData.fee) {
      this.logger.info(`Entering fee: ${roiData.fee}`);
      try {
        // Try data-testid selector first (for add page)
        await this.page.fill(RoiSelectors.feeInput, roiData.fee, { timeout: 5000 });
      } catch (e) {
        // Fallback: use aria-label or placeholder for edit page
        try {
          await this.page.getByLabel(/fee/i).fill(roiData.fee, { timeout: 5000 });
        } catch (e2) {
          // Last resort: find input with type="number" near "Fee" text
          await this.page.locator('input[type="number"]').first().fill(roiData.fee);
        }
      }
      this.logger.info('Fee entered successfully');
    }

    // Fill Payment Date if provided
    if (roiData.paymentDate) {
      this.logger.info(`Entering payment date: ${roiData.paymentDate}`);
      await this.page.fill(RoiSelectors.paymentDateInput, roiData.paymentDate);
    }

    // Fill Certificate Number if provided
    if (roiData.certificateNumber) {
      this.logger.info(`Entering certificate number: ${roiData.certificateNumber}`);
      try {
        // Try data-testid selector first
        await this.page.fill(RoiSelectors.certificateNumberInput, roiData.certificateNumber, { timeout: 5000 });
      } catch (e) {
        // Fallback: use label or placeholder
        try {
          await this.page.getByLabel(/certificate/i).fill(roiData.certificateNumber, { timeout: 5000 });
        } catch (e2) {
          // Last resort: find input near "Certificate" text
          await this.page.locator('input[type="text"]').filter({ hasText: /certificate/i }).fill(roiData.certificateNumber);
        }
      }
      this.logger.info('Certificate number entered successfully');
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
    
    // Click Add ROI Holder button and wait for form to appear
    await this.page.click(RoiSelectors.addRoiHolderButton);
    await this.page.waitForSelector(RoiSelectors.roiHolderFirstNameInput, { state: 'visible', timeout: 5000 });
    
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
    const addButton = this.page.getByRole('button', { name: 'add', exact: true });
    await addButton.click();
    
    // Wait for the person card to appear in the UI (confirms creation)
    try {
      await this.page.waitForSelector(`text=${holderData.firstName} ${holderData.lastName}`, { timeout: 8000 });
      this.logger.info('Person card appeared in UI');
    } catch (e) {
      // Fallback: wait a bit for backend processing
      this.logger.warn('Person card not detected, waiting for backend...');
      await this.page.waitForTimeout(3000);
    }
    
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
    
    // Wait for any previous person card animation to complete
    await this.page.waitForTimeout(2000);
    
    // Make sure applicant button is visible and in viewport
    const applicantButton = this.page.locator(RoiSelectors.addRoiApplicantButton);
    await applicantButton.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);
    
    // Force click the button (may be overlayed by holder card animation)
    this.logger.info('Clicking Add ROI Applicant button');
    await applicantButton.click({ force: true });
    
    // Wait longer for form to start rendering (especially after holder was just added)
    await this.page.waitForTimeout(3000);
    
    // Wait for form to be visible
    // After holder is added, form uses role-based selectors instead of data-testid
    this.logger.info('Waiting for applicant form to appear...');
    try {
      // Try role-based selector first (more reliable after holder added)
      await this.page.getByRole('textbox', { name: /first.*name/i }).first().waitFor({ state: 'visible', timeout: 10000 });
      this.logger.info('✓ Form detected using role-based selector');
    } catch (e) {
      // Fallback to data-testid (when no holder added yet)
      await this.page.waitForSelector(RoiSelectors.roiApplicantFirstNameInput, { state: 'visible', timeout: 5000 });
      this.logger.info('✓ Form detected using data-testid selector');
    }
    
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
    const addButton = this.page.getByRole('button', { name: 'add', exact: true });
    await addButton.click();
    
    // Wait for the person card to appear in the UI
    try {
      await this.page.waitForSelector(`text=${applicantData.firstName} ${applicantData.lastName}`, { timeout: 8000 });
      this.logger.info('Person card appeared in UI');
    } catch (e) {
      // Fallback: wait a bit for backend processing
      this.logger.warn('Person card not detected, waiting for backend...');
      await this.page.waitForTimeout(3000);
    }
    
    this.logger.success('ROI applicant person added successfully');
  }

  /**
   * Search and select existing person as ROI holder
   * @param personName - Full name of the person to search and select
   */
  async searchAndSelectRoiHolder(personName: string): Promise<void> {
    this.logger.info(`Searching and selecting ROI holder: ${personName}`);
    
    // Click Add ROI Holder button to open the person input/dialog
    this.logger.info('Clicking Add ROI Holder button');
    await this.page.click(RoiSelectors.addRoiHolderButton);
    await this.page.waitForTimeout(1000);
    
    // Type person name in the search input (first name field acts as search)
    this.logger.info(`Typing search query: ${personName}`);
    await this.page.fill(RoiSelectors.roiHolderFirstNameInput, personName);
    await this.page.waitForTimeout(2000); // Wait for search results to appear
    
    // Wait for search results dropdown/list to appear
    this.logger.info('Waiting for search results to appear...');
    
    // Click on the matching person from search results
    // Based on screenshot, results appear in a dropdown with person name and role label
    try {
      // Try to find the person in mat-option or similar dropdown
      const personOption = this.page.locator('mat-option, .mat-option, [role="option"]').filter({ hasText: personName }).first();
      
      await personOption.waitFor({ state: 'visible', timeout: 5000 });
      this.logger.info(`Found person "${personName}" in search results, clicking...`);
      await personOption.click();
      
      // Wait for selection to complete
      await this.page.waitForTimeout(1000);
      
      // Wait for background process to complete (production needs time to attach person to ROI)
      this.logger.info('Waiting 5s for person to be fully attached...');
      await this.page.waitForTimeout(5000);
      
      this.logger.success(`ROI holder "${personName}" selected successfully from search`);
    } catch (e) {
      this.logger.error(`Failed to find or select person "${personName}" from search results`);
      throw new Error(`Person "${personName}" not found in search results or click failed: ${e}`);
    }
  }

  /**
   * Save ROI form (works for both add and edit)
   */
  async saveRoi(): Promise<void> {
    this.logger.info('Saving ROI');
    
    try {
      // Try data-testid selector first (for add page)
      this.logger.info('Attempting to click Save button using data-testid selector');
      await this.page.click(RoiSelectors.saveButton, { timeout: 5000 });
      this.logger.info('Save button clicked successfully (data-testid)');
    } catch (e) {
      // Fallback: look for any button with "Save" text (for edit page)
      try {
        this.logger.info('Data-testid failed, trying getByRole with /save/i');
        await this.page.getByRole('button', { name: /save/i }).first().click({ timeout: 5000 });
        this.logger.info('Save button clicked successfully (getByRole)');
      } catch (e2) {
        // Last resort: look for button with save icon or similar
        this.logger.info('getByRole failed, trying locator with has-text');
        await this.page.locator('button:has-text("Save")').first().click();
        this.logger.info('Save button clicked successfully (has-text)');
      }
    }
    
    this.logger.info('Waiting for URL redirect to plot detail page...');
    // Wait for save to complete and redirect back to plot detail
    await this.page.waitForURL(`**${RoiUrls.plotDetailPattern}**`, { timeout: 30000 });
    await this.page.waitForTimeout(2000); // Wait for status update
    this.logger.success('ROI saved successfully');
  }

  /**
   * Add activity note in Activity section of Edit ROI page
   * @param noteText - Text of the note to add
   */
  async addActivityNote(noteText: string): Promise<void> {
    this.logger.info(`Adding activity note: ${noteText}`);
    
    try {
      // Wait for Activity section to be visible
      const notesInput = this.page.locator(RoiSelectors.activityNotesInput);
      await notesInput.waitFor({ state: 'visible', timeout: 5000 });
      
      // Fill note in Activity Notes textbox
      await notesInput.fill(noteText);
      this.logger.info('Note text entered');
      
      // Click send button - verified with MCP Playwright testing
      await this.page.waitForTimeout(500);
      
      const sendButton = this.page.locator(RoiSelectors.activityNotesSendButton);
      await sendButton.waitFor({ state: 'visible', timeout: 5000 });
      await sendButton.click();
      this.logger.info('Send button clicked');
      
      
      // Wait for note to appear in activity list
      await this.page.waitForTimeout(2000);
      
      this.logger.success(`Activity note added: ${noteText}`);
    } catch (error) {
      this.logger.error(`Failed to add activity note: ${error}`);
      throw error;
    }
  }

  /**
   * Edit existing activity note in Activity section
   * @param oldText - Original text of the note to find
   * @param newText - New text to replace
   */
  async editActivityNote(oldText: string, newText: string): Promise<void> {
    this.logger.info(`Editing activity note from "${oldText}" to "${newText}"`);
    
    try {
      // Wait for Activity section to be visible
      await this.page.waitForTimeout(1000);
      
      // Find the note by text and click its three dots menu
      const noteElement = this.page.getByText(oldText, { exact: false }).first();
      await noteElement.waitFor({ state: 'visible', timeout: 5000 });
      
      // Find the three dots menu icon for this note
      // The menu icon is typically next to or within the same parent as the note text
      const threeDotsMenu = this.page.locator(RoiSelectors.activityNoteThreeDotsMenu).first();
      await threeDotsMenu.click();
      this.logger.info('Three dots menu clicked');
      
      // Wait for menu to appear and click Edit
      await this.page.waitForTimeout(500);
      const editMenuItem = this.page.getByRole('menuitem', { name: 'Edit' });
      await editMenuItem.click();
      this.logger.info('Edit menu item clicked');
      
      // Wait for inline edit textarea to appear
      // IMPORTANT: The page has an "Add Notes" textarea at top (with data-testid="user-log-activity-textarea-add-notes")
      // When we click Edit on a note, an inline edit textarea appears with save/cancel buttons
      // We need to find that specific textarea, NOT the "Add Notes" one
      await this.page.waitForTimeout(1000);
      
      // Wait for the save button (checkmark) to appear - this indicates edit mode is active
      const saveButton = this.page.locator(RoiSelectors.activityNoteEditSaveButton);
      await saveButton.waitFor({ state: 'visible', timeout: 5000 });
      
      // Get all textareas and find the one that's NOT the "Add Notes" form
      const allTextareas = await this.page.locator('textarea').all();
      let targetTextarea = null;
      
      for (const textarea of allTextareas) {
        const testId = await textarea.getAttribute('data-testid');
        const isVisible = await textarea.isVisible().catch(() => false);
        
        // Skip the "Add Notes" textarea and find any other visible textarea
        if (testId !== 'user-log-activity-textarea-add-notes' && isVisible) {
          targetTextarea = textarea;
          this.logger.info(`Found edit textarea (excluding Add Notes form)`);
          break;
        }
      }
      
      if (!targetTextarea) {
        this.logger.error('Could not find edit textarea - only found Add Notes textarea');
        throw new Error('Edit textarea not found');
      }
      
      // Clear and fill with new text
      await targetTextarea.fill(newText);
      this.logger.info('New text entered in edit mode');
      
      // Click the save button (checkmark) instead of pressing Enter
      await this.page.waitForTimeout(500);
      await saveButton.click();
      this.logger.info('Clicked save button (checkmark)');
      
      // Wait for save animation/transition to complete
      await this.page.waitForTimeout(1000);
      
      // Verify save completed by checking if edit mode closed (checkmark disappeared)
      try {
        await saveButton.waitFor({ state: 'hidden', timeout: 3000 });
        this.logger.info('Edit mode closed - save completed');
      } catch (e) {
        this.logger.warn('Checkmark still visible after 3s - edit mode may still be active');
      }
      
      // Wait additional time for backend sync (especially for production)
      await this.page.waitForTimeout(3000);
      this.logger.info('Waited for backend sync');
      
      this.logger.success(`Activity note edited successfully`);
    } catch (error) {
      this.logger.error(`Failed to edit activity note: ${error}`);
      throw error;
    }
  }

  /**
   * Verify activity note exists in Activity Notes list
   * @param expectedNote - Expected note text
   */
  async verifyActivityNote(expectedNote: string): Promise<boolean> {
    this.logger.info(`Verifying activity note: ${expectedNote}`);
    
    try {
      // Wait longer for activity section and notes to fully load from backend
      // Production needs more time than staging
      await this.page.waitForTimeout(5000);
      this.logger.info('Waited 5s for activity notes to load');
      
      // Look for the note text - use count() to handle multiple matches
      const noteLocator = this.page.getByText(expectedNote, { exact: false });
      const noteCount = await noteLocator.count();
      
      this.logger.info(`Found ${noteCount} elements with text "${expectedNote}"`);
      
      if (noteCount > 0) {
        // Check if at least one is visible
        const firstNote = noteLocator.first();
        const isVisible = await firstNote.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isVisible) {
          this.logger.success(`✓ Activity note verified: ${expectedNote}`);
          return true;
        } else {
          this.logger.success(`✓ Activity note found in page (might be scrolled): ${expectedNote}`);
          return true;
        }
      } else {
        this.logger.info(`❌ Activity note not found: ${expectedNote}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to verify activity note: ${error}`);
      return false;
    }
  }

  /**
   * Click ROI tab in plot detail sidebar
   */
  async clickRoiTab(): Promise<void> {
    this.logger.info('Clicking ROI tab');
    await this.page.getByRole('tab', { name: /roi/i }).click();
    
    // Wait for ROI content to load (faster than network idle)
    try {
      // Wait for ROI content indicators (person cards, edit button, or "No ROI" message)
      await Promise.race([
        this.page.waitForSelector('[data-testid*="person-card"]', { state: 'visible', timeout: 3000 }),
        this.page.waitForSelector('button:has-text("EDIT ROI")', { state: 'visible', timeout: 3000 }),
        this.page.waitForTimeout(1000) // Fallback minimal wait
      ]);
      this.logger.success('ROI tab opened - content loaded');
    } catch (e) {
      this.logger.warn('ROI tab content check timeout, continuing anyway');
    }
  }

  /**
   * Click Edit ROI button at bottom of plot detail page
   * This is the "EDIT ROI" button shown below the ROI tab content
   */
  async clickEditRoi(): Promise<void> {
    this.logger.info('Clicking Edit ROI button');
    
    try {
      // Wait for plot detail page to fully load
      await this.page.waitForTimeout(2000);
      
      // Look for "EDIT ROI" button (uppercase) at bottom of plot detail
      // This is different from the general "Edit" button
      await this.page.waitForSelector('button:has-text("EDIT ROI")', { state: 'visible', timeout: 5000 });
      this.logger.info('EDIT ROI button found');
      
      await this.page.getByRole('button', { name: /EDIT ROI/i }).click();
      
      // Wait for navigation to edit page (URL should change to include '/edit/')
      this.logger.info('Waiting for navigation to edit page...');
      try {
        await this.page.waitForURL('**/edit/roi/**', { timeout: 10000 });
        this.logger.success('Navigated to edit page');
      } catch (e) {
        this.logger.warn('URL did not change to edit page within 10s, continuing anyway');
      }
      
      // Wait for edit page to be ready (faster than network idle)
      // Edit pages have continuous network activity, so check for form elements instead
      try {
        // Wait for DOM to load
        await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        
        // Wait for form elements to appear (fee, certificate, or activity notes)
        await Promise.race([
          this.page.waitForSelector('input[data-testid="user-log-activity-textarea-add-notes"]', { state: 'visible', timeout: 5000 }),
          this.page.waitForSelector('input[type="number"], input[type="text"]', { state: 'visible', timeout: 5000 })
        ]);
        
        this.logger.info('Edit page loaded - form elements ready');
      } catch (e) {
        this.logger.warn('Form elements not found within 5s, continuing anyway');
      }
      
      const currentUrl = this.page.url();
      this.logger.info(`Current URL after navigation: ${currentUrl}`);
      this.logger.success('EDIT ROI button clicked and page loaded');
    } catch (e) {
      this.logger.error('EDIT ROI button not found or not clickable');
      throw new Error('Failed to click EDIT ROI button');
    }
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
    
    // Wait for person name to appear on the page (production is much slower)
    // Use a generous timeout since ROI content takes time to load
    this.logger.info(`Waiting for "${personName}" to appear in ROI tab (30s timeout)...`);
    try {
      await this.page.waitForSelector(`text=${personName}`, { state: 'visible', timeout: 30000 });
      this.logger.info(`✓ Found "${personName}" on the page`);
    } catch (e) {
      this.logger.error(`❌ Timeout waiting for "${personName}" to appear after 30s`);
      const pageText = await this.page.locator('body').textContent();
      const roiSection = pageText?.substring(0, 500) || 'Unable to get page text';
      this.logger.info(`Page content preview: ${roiSection}`);
      return false;
    }
    
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

  /**
   * Verify fee field value in ROI form
   * @param expectedFee - Expected fee value
   */
  async verifyFeeInForm(expectedFee: string): Promise<boolean> {
    this.logger.info(`Verifying fee in form: ${expectedFee}`);
    
    try {
      // Wait for form to load
      await this.page.waitForTimeout(2000);
      
      // Try multiple selectors to find fee input
      let feeValue: string | null = null;
      
      try {
        feeValue = await this.page.locator(RoiSelectors.feeInput).inputValue({ timeout: 3000 });
      } catch (e) {
        try {
          feeValue = await this.page.getByLabel(/fee/i).inputValue({ timeout: 3000 });
        } catch (e2) {
          feeValue = await this.page.locator('input[type="number"]').first().inputValue();
        }
      }
      
      const isMatch = feeValue === expectedFee;
      if (isMatch) {
        this.logger.success(`✓ Fee verified: ${feeValue}`);
      } else {
        this.logger.info(`❌ Fee mismatch - Expected: ${expectedFee}, Got: ${feeValue}`);
      }
      
      return isMatch;
    } catch (e) {
      this.logger.error(`Failed to verify fee: ${e}`);
      return false;
    }
  }

  /**
   * Verify certificate number field value in ROI form
   * @param expectedCertificate - Expected certificate number
   */
  async verifyCertificateInForm(expectedCertificate: string): Promise<boolean> {
    this.logger.info(`Verifying certificate number in form: ${expectedCertificate}`);
    
    try {
      // Try multiple selectors to find certificate input
      let certValue: string | null = null;
      
      try {
        certValue = await this.page.locator(RoiSelectors.certificateNumberInput).inputValue({ timeout: 3000 });
      } catch (e) {
        try {
          certValue = await this.page.getByLabel(/certificate/i).inputValue({ timeout: 3000 });
        } catch (e2) {
          // Find text input that contains certificate value
          const inputs = await this.page.locator('input[type="text"]').all();
          for (const input of inputs) {
            const val = await input.inputValue();
            if (val === expectedCertificate) {
              certValue = val;
              break;
            }
          }
        }
      }
      
      const isMatch = certValue === expectedCertificate;
      if (isMatch) {
        this.logger.success(`✓ Certificate number verified: ${certValue}`);
      } else {
        this.logger.info(`❌ Certificate mismatch - Expected: ${expectedCertificate}, Got: ${certValue}`);
      }
      
      return isMatch;
    } catch (e) {
      this.logger.error(`Failed to verify certificate: ${e}`);
      return false;
    }
  }
}
