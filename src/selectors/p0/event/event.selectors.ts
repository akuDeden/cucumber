/**
 * Event Page Selectors
 * Based on actual Chronicle map.chronicle.rip UI
 * Discovered via Playwright debugging of /events/{id}/edit page
 */

export const EventSelectors = {
  // ===== Calendar view =====
  calendarToggle: 'mat-button-toggle:has-text("Calendar")',
  calendarEvent: '.fc-event',
  calendarTodayButton: '.fc-today-button',
  calendarToolbarTitle: '.fc-toolbar-title',

  // Event detail dialog (overlay) - opened when clicking event on calendar
  eventDetailDialog: '.cdk-overlay-pane',
  editEventButton: 'button:has-text("EDIT EVENT")',
  deleteEventButton: 'button:has-text("DELETE")',
  closeDetailButton: 'button:has-text("CLOSE")',

  // Add new event button on calendar
  addNewEventButton: 'button:has-text("ADD NEW EVENT")',

  // ===== Event form (Add & Edit) =====
  // URL pattern: /customer-organization/{org}/events/{id}/edit
  // Add event URL pattern: /customer-organization/{org}/events/add
  // Toolbar
  saveButton: 'button:has-text("SAVE"):not(:has-text("Certificate"))',
  saveAndCertificateButton: 'button:has-text("SAVE & CREATE CERTIFICATE")',
  cancelButton: 'button:has-text("CANCEL")',

  // Form fields - inputs
  eventNameInput: 'input[aria-label="Event Name"]',
  dateInput: 'input[aria-label="Date"]',
  startTimeInput: 'input[aria-label="Start time"]',
  endTimeInput: 'input[aria-label="End Time"]',
  paymentAmountInput: 'input[aria-label="Payment Amount"]',
  purchaserInput: 'input[aria-label="Purchaser"]',
  purchaserEmailInput: 'input[aria-label="Purchaser Email"]',
  purchaserPhoneInput: 'input[aria-label="Purchaser Phone"]',
  addressInput: 'input[aria-label="Address"]',
  suburbInput: 'input[aria-label="Suburb"]',
  stateInput: 'input[aria-label="State"]',
  countryInput: 'input[aria-label="Country"]',
  postCodeInput: 'input[aria-label="Post Code"]',

  // Form fields - textareas
  descriptionTextarea: 'textarea[aria-label="Description"]',

  // Form fields - mat-select dropdowns
  eventTypeSelect: 'mat-select[aria-label="Event type"], mat-select',
  subTypeSelect: 'mat-select[aria-label="Sub type"]',
  statusTypeSelect: 'mat-select[aria-label="Status type"]',
  cemeterySelect: 'mat-select[aria-label="Cemetery"]',
  plotSelect: 'mat-select[aria-label="Plot"]',
  relatedIntermentSelect: 'mat-select[aria-label="Related interment"]',
  responsibleSelect: 'mat-select[aria-label="Responsible"]',

  // Mat-select option panel
  matOptionPanel: '.mat-mdc-option, .cdk-overlay-pane mat-option',
  matOptionByText: (text: string) => `mat-option:has-text("${text}")`,

  // Mat label helper
  matLabelFor: (label: string) => `mat-label:has-text("${label}")`,

  // Select value text
  selectValueText: '.mat-select-value-text',

  // Event form heading
  editEventHeading: 'text=Edit event',
  addEventHeading: 'text=Add event',

  // Paid checkbox/toggle
  paidToggle: 'input[aria-label="Paid"]',
  postalAddressDifferentCheckbox: 'input[aria-label="Postal Address Different"]',

  // ===== Delete confirmation dialog =====
  deleteConfirmDialog: '.cdk-overlay-pane .mat-mdc-dialog-actions',
  deleteConfirmButton: 'button:has-text("DELETE"):not(:has-text("EVENT"))',
  deleteCancelButton: 'button:has-text("CANCEL")',
  confirmDeleteButton: 'button:has-text("confirm"), button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")',

  // ===== Calendar event by text =====
  calendarEventByText: (text: string) => `.fc-event:has-text("${text}"), .fc-daygrid-event:has-text("${text}")`,

  // ===== Date picker =====
  datePickerToggle: 'mat-datepicker-toggle',
  datePickerInput: 'input[aria-label="Date"]',
};
