/**
 * Business Selectors
 * Discovered from staging-aus.chronicle.rip via Playwright CLI manual exploration
 */

export const BusinessSelectors = {
  // ===== Advance Table - Business tab =====
  // Tabs: PLOTS(0), INTERMENTS(1), ROIS(2), PERSONS(3), BUSINESS(4)
  businessTab: '[data-testid="content-wrapper-a-4"]',
  // Add button reuses the same testid across all tabs
  addBusinessButton: '[data-testid="content-wrapper-button-add-plot"]',

  // Table rows — business table uses grid rows
  tableRow: 'div[role="grid"] div[role="row"]',
  tableRowFallback: 'mat-row',

  // ===== Add / Edit Business form =====
  // Fields identified from the "Add business" / "Edit business" page UI
  cemeterySelect: 'mat-select[formcontrolname="cemetery"], mat-select[aria-label*="Cemetery"]',
  businessNameInput: 'input[formcontrolname="business_name"], input[placeholder*="usiness name"]',
  businessNumberInput: 'input[formcontrolname="business_number"], input[formcontrolname="abn"]',
  businessTypeSelect: 'mat-select[formcontrolname="business_type"]',

  // Contact details
  firstNameInput: 'input[formcontrolname="first_name"]',
  lastNameInput: 'input[formcontrolname="last_name"]',
  phoneMobileInput: 'input[formcontrolname="mobile"]',
  phoneHomeInput: 'input[formcontrolname="home"]',
  phoneOfficeInput: 'input[formcontrolname="business"]',
  emailInput: 'input[formcontrolname="email"]',

  // Business address
  addressInput: 'input[formcontrolname="street"], input[formcontrolname="address"]',

  // ===== Toolbar buttons (top-right on add/edit page) =====
  saveButton: 'button:has-text("SAVE")',
  cancelButton: 'button:has-text("CANCEL")',
  deleteButton: 'button:has-text("DELETE")',

  // ===== Delete confirmation dialog =====
  confirmDeleteButton: '[role="dialog"] button:has-text("Delete"), [role="dialog"] button:has-text("Yes"), [role="dialog"] button:has-text("Confirm")',
};

export const BusinessUrls = {
  advanceTable: '/customer-organization/advance-table',
  addBusinessPattern: '/manage/add/business/',
  editBusinessPattern: '/manage/edit/business',
};
