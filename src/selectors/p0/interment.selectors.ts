/**
 * Interment Page Selectors
 * Real selectors from staging.chronicle.rip
 * Discovered via MCP Playwright manual exploration
 */

export const IntermentSelectors = {
  // Plot detail page - Buttons
  addIntermentButton: '[data-testid="plot-details-edit-button-add-interment-btn"]',

  // Interment Form - Header
  saveButton: 'button:has-text("save")',
  cancelButton: 'button:has-text("cancel")',

  // Deceased Person section
  firstName: 'input[aria-label="First name"]',
  lastName: 'input[aria-label="Last name"]',
  middleName: 'input[aria-label="Middle name"]',
  title: 'input[aria-label="Title"]',
  genderDropdown: 'mat-select[aria-label="Gender"]',
  dateOfBirth: 'input[aria-label="Date of Birth"]',
  dateOfDeath: 'input[aria-label="Date of Death"]',
  age: 'input[aria-label="Age"]',
  religionDropdown: 'mat-select[aria-label="Religion"]',
  causeOfDeath: 'input[aria-label="Cause of death"]',
  occupation: 'input[aria-label="Occupation"]',
  specialBadgeDropdown: 'mat-select[aria-label="Special Badge"]',

  // Interment Details section
  intermentTypeDropdown: 'mat-select[aria-label="Interment type"]',
  intermentTypeOption: (type: string) => `mat-option:has-text("${type}")`,
  intermentDepth: 'input[aria-label="Interment depth"]',
  intermentDate: 'input[aria-label="Interment Date"]',
  cremationLocationDropdown: 'mat-select[aria-label="Cremation location"]',
  containerTypeDropdown: 'mat-select[aria-label="Container type"]',

  // Right sidebar - Person additions
  addIntermentApplicantButton: 'button:has-text("Interment applicant")',
  addNextOfKinButton: 'button:has-text("Next of kin")',
  addFuneralMinisterButton: 'button:has-text("Funeral minister")',
  addFuneralDirectorButton: 'button:has-text("Funeral director")',

  // Verification - Plot detail page after save
  intermentsTab: '[aria-label="INTERMENTS"]',
  deceasedNameHeading: (name: string) => `h3:has-text("${name}")`,
  intermentTypeLabel: (type: string) => `p:has-text("${type}")`,
  editIntermentButton: 'button:has-text("Edit interment")',

  // Interment types
  intermentTypes: {
    burial: 'Burial',
    cremated: 'Cremated',
    entombment: 'Entombment',
    memorial: 'Memorial',
    unspecified: 'Unspecified'
  },

  // Plot detail page sidebar (used by advance search verification)
  plotSidebarHeading: (plotId: string) => `h3:has-text("${plotId}")`,
  // Use specific testid to avoid strict mode violation with interment Edit button
  editButtonInSidebar: '[data-testid="plot-details-edit-button-edit-plot"]'
};
