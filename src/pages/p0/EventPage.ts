/**
 * Event Page Object
 * Handles event-related page interactions: calendar, event detail, add/edit/delete event forms
 * Full CRUD: Create → Edit → Delete lifecycle
 */

import { Page, Locator, expect } from '@playwright/test';
import { EventSelectors } from '../../selectors/p0/event/index.js';
import { getCustomerOrgBaseUrl } from '../../data/test-data.js';

export class EventPage {
  constructor(private page: Page) {}

  // ===== Navigation =====

  /**
   * Navigate directly to the edit event page by event ID
   */
  async navigateToEditEvent(orgSlug: string, eventId: string | number) {
    const url = `${getCustomerOrgBaseUrl()}/customer-organization/${orgSlug}/events/${eventId}/edit`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(5000);
  }

  /**
   * Navigate to calendar view by clicking the Calendar toggle
   */
  async navigateToCalendar() {
    const calBtn = this.page.locator(EventSelectors.calendarToggle).first();
    await calBtn.waitFor({ state: 'visible', timeout: 10000 });
    await calBtn.click();
    // Wait for calendar to render - look for calendar toolbar
    await this.page.waitForSelector(EventSelectors.calendarToolbarTitle, { state: 'visible', timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(3000);
  }

  /**
   * Navigate to add event form via calendar
   */
  async navigateToAddEvent() {
    await this.navigateToCalendar();
    const addBtn = this.page.locator(EventSelectors.addNewEventButton).first();
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.click();
    // Wait for add event form to load
    await this.page.waitForTimeout(5000);
  }

  // ===== Form Field Readers =====

  /**
   * Get the value of a specific input field by aria-label
   */
  async getInputValue(ariaLabel: string): Promise<string> {
    const input = this.page.locator(`input[aria-label="${ariaLabel}"]`).first();
    return input.inputValue().catch(() => '');
  }

  /**
   * Get all form field values from the edit event form
   * Returns a map of label -> { value, type, populated }
   */
  async getAllFormFieldValues(): Promise<Record<string, { value: string; type: string; populated: boolean }>> {
    const fields: Record<string, { value: string; type: string; populated: boolean }> = {};

    // Read input fields
    const inputs = await this.page.locator('input[aria-label]:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"])').all();
    for (const input of inputs) {
      const label = await input.getAttribute('aria-label').catch(() => '');
      const value = await input.inputValue().catch(() => '');
      if (label) {
        fields[label] = {
          value,
          type: 'input',
          populated: !!value && value.trim() !== '' && value.trim() !== 'on',
        };
      }
    }

    // Read textareas
    const textareas = await this.page.locator('textarea[aria-label]').all();
    for (const ta of textareas) {
      const label = await ta.getAttribute('aria-label').catch(() => '');
      const value = await ta.inputValue().catch(() => '');
      if (label) {
        fields[label] = {
          value,
          type: 'textarea',
          populated: !!value && value.trim() !== '',
        };
      }
    }

    // Read mat-select dropdowns
    const selects = await this.page.locator('mat-select').all();
    for (const sel of selects) {
      const parent = sel.locator('..');
      const matLabel = await parent.locator('mat-label').textContent().catch(() => '');
      const valueText = await sel.locator(EventSelectors.selectValueText).textContent().catch(() => '');
      if (matLabel) {
        const label = matLabel.trim();
        fields[`[Select] ${label}`] = {
          value: valueText?.trim() || '',
          type: 'select',
          populated: !!valueText && valueText.trim() !== '' && valueText.trim() !== 'none',
        };
      }
    }

    return fields;
  }

  // ===== Form Fill Methods =====

  /**
   * Fill a specific input field by aria-label
   */
  async fillInput(ariaLabel: string, value: string) {
    const input = this.page.locator(`input[aria-label="${ariaLabel}"]`).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click();
    await input.fill(value);
  }

  /**
   * Select a value from a mat-select dropdown
   */
  async selectDropdown(ariaLabel: string, value: string) {
    const select = this.page.locator(`mat-select[aria-label="${ariaLabel}"]`).first();
    if (!(await select.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Fallback: try first mat-select if no aria-label match
      const firstSelect = this.page.locator('mat-select').first();
      await firstSelect.click();
    } else {
      await select.click();
    }
    // Wait for dropdown panel to appear
    await this.page.waitForSelector('.cdk-overlay-pane mat-option', { state: 'visible', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(500);

    // Click the option with matching text
    const option = this.page.locator(`mat-option:has-text("${value}")`).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill the event creation form with provided data
   */
  async fillEventForm(data: { eventName: string; date: string; startTime: string; endTime: string; eventType: string }) {
    // Fill event name
    await this.fillInput('Event Name', data.eventName);

    // Fill date
    await this.fillInput('Date', data.date);

    // Fill start time
    await this.fillInput('Start time', data.startTime);

    // Fill end time
    await this.fillInput('End Time', data.endTime);

    // Select event type
    await this.selectDropdown('Event type', data.eventType);
  }

  /**
   * Update the event name field
   */
  async updateEventName(newName: string) {
    const input = this.page.locator(EventSelectors.eventNameInput).first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click();
    await input.clear();
    await input.fill(newName);
  }

  // ===== Save / Submit =====

  /**
   * Click the SAVE button on the event form
   */
  async saveEvent() {
    const saveBtn = this.page.locator(EventSelectors.saveButton).first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveBtn.click();
    // Wait for navigation back to calendar or success indication
    await this.page.waitForTimeout(5000);
  }

  // ===== Calendar Interaction =====

  /**
   * Click "ADD NEW EVENT" button on the calendar
   */
  async clickAddNewEventButton() {
    const addBtn = this.page.locator(EventSelectors.addNewEventButton).first();
    await addBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addBtn.click();
    await this.page.waitForTimeout(5000);
  }

  /**
   * Open an event from the calendar by its name
   */
  async openEventFromCalendar(eventText: string) {
    const eventLocator = this.page.locator(`.fc-event:has-text("${eventText}"), .fc-daygrid-event:has-text("${eventText}")`).first();
    await eventLocator.waitFor({ state: 'visible', timeout: 15000 });
    await eventLocator.click();
    // Wait for detail dialog to appear
    await this.page.waitForSelector('.cdk-overlay-pane', { state: 'visible', timeout: 10000 });
    await this.page.waitForTimeout(2000);
  }

  /**
   * In the event detail dialog, click the EDIT EVENT button
   */
  async clickEditEventInDetailDialog() {
    const dialog = this.page.locator('.cdk-overlay-pane').last();
    const editBtn = dialog.locator(EventSelectors.editEventButton).first();
    await editBtn.waitFor({ state: 'visible', timeout: 10000 });
    await editBtn.click();
    // Wait for edit form to load
    await this.page.waitForTimeout(5000);
  }

  /**
   * In the event detail dialog, click the DELETE button
   */
  async clickDeleteEventInDetailDialog() {
    const dialog = this.page.locator('.cdk-overlay-pane').last();
    const deleteBtn = dialog.locator(EventSelectors.deleteEventButton).first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 10000 });
    await deleteBtn.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Confirm the deletion in the confirmation dialog
   */
  async confirmDeletion() {
    // Look for a confirm/yes/delete button in the confirmation dialog
    const confirmBtn = this.page.locator('.cdk-overlay-pane').last().locator('button:has-text("Delete"), button:has-text("DELETE"), button:has-text("Confirm"), button:has-text("Yes")').first();
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click();
    } else {
      // Fallback: click the last visible button that says Delete/Confirm
      const buttons = this.page.locator('.cdk-overlay-pane button');
      const count = await buttons.count();
      for (let i = count - 1; i >= 0; i--) {
        const btn = buttons.nth(i);
        const text = await btn.textContent().catch(() => '');
        if (text && /delete|confirm|yes|ok/i.test(text)) {
          await btn.click();
          break;
        }
      }
    }
    await this.page.waitForTimeout(3000);
  }

  // ===== Verification =====

  /**
   * Check if the edit event page has loaded correctly
   */
  async isEditEventPageLoaded(): Promise<boolean> {
    const heading = this.page.locator(EventSelectors.editEventHeading);
    return heading.isVisible({ timeout: 10000 }).catch(() => false);
  }

  /**
   * Check if the add event page has loaded correctly
   */
  async isAddEventPageLoaded(): Promise<boolean> {
    const heading = this.page.locator(EventSelectors.addEventHeading);
    return heading.isVisible({ timeout: 10000 }).catch(() => false);
  }

  /**
   * Check if a specific event exists on the calendar
   */
  async isEventOnCalendar(eventText: string): Promise<boolean> {
    const eventLocator = this.page.locator(`.fc-event:has-text("${eventText}"), .fc-daygrid-event:has-text("${eventText}")`).first();
    return eventLocator.isVisible({ timeout: 10000 }).catch(() => false);
  }

  /**
   * Check if the event type select shows a valid (non-empty, non-none) value
   */
  async isEventTypeSelectPopulated(): Promise<boolean> {
    // Find the first mat-select (event type)
    const selects = await this.page.locator('mat-select').all();
    if (selects.length === 0) return false;
    const valueText = await selects[0].locator(EventSelectors.selectValueText).textContent().catch(() => '');
    return !!valueText && valueText.trim() !== '' && valueText.trim() !== 'none';
  }

  /**
   * Get count of blank (unpopulated) fields
   */
  async getBlankFieldCount(): Promise<number> {
    const fields = await this.getAllFormFieldValues();
    return Object.values(fields).filter(f => !f.populated).length;
  }

  /**
   * Get list of blank field labels
   */
  async getBlankFieldLabels(): Promise<string[]> {
    const fields = await this.getAllFormFieldValues();
    return Object.entries(fields)
      .filter(([_, f]) => !f.populated)
      .map(([label]) => label);
  }

  /**
   * Get populated field labels
   */
  async getPopulatedFieldLabels(): Promise<string[]> {
    const fields = await this.getAllFormFieldValues();
    return Object.entries(fields)
      .filter(([_, f]) => f.populated)
      .map(([label]) => label);
  }
}
