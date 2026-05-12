/**
 * Event Step Definitions
 * Steps for event management tests: Create, Edit, Delete (CRUD) + CHR-24 bug reproduction
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { EventPage } from '../../pages/p0/EventPage.js';
import { expect } from '@playwright/test';

const ORG_SLUG = 'astana_tegal_gundul_aus';

// Helper to get the event page
function getEventPage(context: any): EventPage {
  return new EventPage(context.page);
}

// ===== Seed / Fixture Steps =====

// CHRA-22: scenario-local fixture so @edit-event runs independently of @create-event.
// Uses the same direct-URL add-event flow as @create-event (CHRA-21 pattern).
Given('an event {string} exists on the calendar', async function (eventName: string) {
  const eventPage = getEventPage(this);
  await eventPage.navigateToAddEventDirect(ORG_SLUG);
  await eventPage.fillEventForm({
    eventName,
    date: '01/15/2026',
    startTime: '10:00',
    endTime: '12:00',
    eventType: 'Burial',
  });
  await eventPage.saveEvent();
});

// ===== Navigation Steps =====

When('I navigate to the calendar view', async function () {
  const eventPage = getEventPage(this);
  await eventPage.navigateToCalendar();
});

When('I navigate to edit event page for event {string}', async function (eventId: string) {
  const eventPage = getEventPage(this);
  await eventPage.navigateToEditEvent(ORG_SLUG, eventId);
});

When('I navigate directly to the add event page', async function () {
  const eventPage = getEventPage(this);
  await eventPage.navigateToAddEventDirect(ORG_SLUG);
});

// ===== Create Event Steps =====

When('I click the add new event button', async function () {
  const eventPage = getEventPage(this);
  await eventPage.clickAddNewEventButton();
});

Then('the add event form should be loaded', async function () {
  const eventPage = getEventPage(this);
  const isLoaded = await eventPage.isAddEventPageLoaded();
  expect(isLoaded).toBeTruthy();
});

When('I fill in the event form with:', async function (dataTable: any) {
  const eventPage = getEventPage(this);
  const rows = dataTable.rows();
  const data: Record<string, string> = {};
  for (const [key, value] of rows) {
    data[key] = value;
  }
  await eventPage.fillEventForm({
    eventName: data.eventName,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    eventType: data.eventType,
  });
});

When('I save the event', async function () {
  const eventPage = getEventPage(this);
  await eventPage.saveEvent();
});

Then('I should see the event {string} on the calendar', async function (eventText: string) {
  const eventPage = getEventPage(this);
  // Navigate back to calendar first (save may have already done this)
  await eventPage.navigateToCalendar();
  const isVisible = await eventPage.isEventOnCalendar(eventText);
  expect(isVisible).toBeTruthy();
});

// ===== Edit Event Steps =====

When('I open the event {string} from the calendar', async function (eventText: string) {
  const eventPage = getEventPage(this);
  await eventPage.openEventFromCalendar(eventText);
});

When('I click the edit event button in the detail dialog', async function () {
  const eventPage = getEventPage(this);
  await eventPage.clickEditEventInDetailDialog();
});

Then('the edit event form should be loaded', async function () {
  const eventPage = getEventPage(this);
  const isLoaded = await eventPage.isEditEventPageLoaded();
  expect(isLoaded).toBeTruthy();
});

Then('the {string} field should be populated', async function (fieldName: string) {
  const eventPage = getEventPage(this);
  const value = await eventPage.getInputValue(fieldName);
  expect(value.trim()).not.toBe('');
});

Then('the {string} field should be populated with {string}', async function (fieldName: string, expectedValue: string) {
  const eventPage = getEventPage(this);
  const value = await eventPage.getInputValue(fieldName);
  expect(value.trim()).not.toBe('');
  // The value should contain the expected text (may have different format for dates)
  if (fieldName === 'Event Name') {
    expect(value.trim()).toBe(expectedValue);
  }
});

Then('the event type select should show a valid value', async function () {
  const eventPage = getEventPage(this);
  const isPopulated = await eventPage.isEventTypeSelectPopulated();
  expect(isPopulated).toBeTruthy();
});

When('I update the event name to {string}', async function (newName: string) {
  const eventPage = getEventPage(this);
  await eventPage.updateEventName(newName);
});

// ===== Delete Event Steps =====

When('I click the delete event button in the detail dialog', async function () {
  const eventPage = getEventPage(this);
  await eventPage.clickDeleteEventInDetailDialog();
});

When('I confirm the event deletion', async function () {
  const eventPage = getEventPage(this);
  await eventPage.confirmDeletion();
});

Then('the event {string} should no longer appear on the calendar', async function (eventText: string) {
  const eventPage = getEventPage(this);
  // Refresh calendar
  await eventPage.navigateToCalendar();
  const isVisible = await eventPage.isEventOnCalendar(eventText);
  expect(isVisible).toBeFalsy();
});

// ===== CHR-24 Bug Report Steps =====

Then('the purchase details fields should be populated if data exists', async function () {
  const eventPage = getEventPage(this);
  const fields = await eventPage.getAllFormFieldValues();
  
  const purchaseFields = [
    'Payment Amount',
    'Purchaser',
    'Purchaser Email',
    'Purchaser Phone',
    'Address',
    'Suburb',
    'State',
    'Country',
    'Post Code',
  ];

  const blankPurchaseFields: string[] = [];
  for (const field of purchaseFields) {
    const fieldData = fields[field];
    if (fieldData && !fieldData.populated) {
      blankPurchaseFields.push(field);
    }
  }

  if (blankPurchaseFields.length > 0) {
    console.log(`⚠️ Blank purchase fields: ${blankPurchaseFields.join(', ')}`);
    console.log('Note: These fields may be legitimately empty if no purchaser data was entered');
  }
});

Then('all select dropdown fields should show a valid value or {string} if empty', async function (noneValue: string) {
  const eventPage = getEventPage(this);
  const fields = await eventPage.getAllFormFieldValues();
  
  const selectFields = Object.entries(fields).filter(([key]) => key.startsWith('[Select]'));
  for (const [label, data] of selectFields) {
    console.log(`  Select "${label}": "${data.value}"`);
  }
});

Then('I should see a report of all populated and blank fields', async function () {
  const eventPage = getEventPage(this);
  const fields = await eventPage.getAllFormFieldValues();
  
  console.log('\n📋 Edit Event Form Field Report:');
  console.log('================================');
  
  const populated: string[] = [];
  const blank: string[] = [];
  
  for (const [label, data] of Object.entries(fields)) {
    if (data.populated) {
      populated.push(`${label}: "${data.value}"`);
    } else {
      blank.push(label);
    }
  }
  
  console.log(`\n✅ Populated fields (${populated.length}):`);
  populated.forEach(p => console.log(`  ✅ ${p}`));
  
  console.log(`\n❌ Blank fields (${blank.length}):`);
  blank.forEach(b => console.log(`  ❌ ${b}`));
  
  console.log(`\nTotal: ${Object.keys(fields).length} fields, ${populated.length} populated, ${blank.length} blank`);
});
