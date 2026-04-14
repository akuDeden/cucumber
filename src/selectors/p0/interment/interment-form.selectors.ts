/**
 * Interment Page Selectors
 * Real selectors from staging.chronicle.rip
 * Discovered via MCP Playwright manual exploration
 */

export const IntermentSelectors = {
  // Plot detail page - Buttons
  addIntermentButton: '[data-testid="plot-details-edit-button-add-interment-btn"]',

  // Interment Form - Header
  saveButton: '[data-testid="toolbar-manage-button-toolbar-button-1"]',
  cancelButton: '[data-testid="toolbar-manage-button-toolbar-button"]',

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

  // Right sidebar - Person/Business additions
  addIntermentApplicantButton: 'button:has-text("Interment applicant")',
  addNextOfKinButton: 'button:has-text("Next of kin")',
  addFuneralMinisterButton: 'button:has-text("Funeral minister")',
  addFuneralDirectorButton: 'button:has-text("Funeral director")',

  // Sidebar search input (autocomplete) that appears after clicking role button
  relationSearchInput: [
    '[data-testid="autocomplete-input-input-autocomplete-search-input"]',
    'input[data-testid*="search"]',
    'input[placeholder*="earch"]',
    'input[formcontrolname="search"]',
  ].join(', '),
  autocompleteOption: (text: string) => `mat-option:has-text("${text}")`,

  // Edit Interment page - toolbar more button and menu items
  moreButton: '[data-testid="toolbar-manage-button-more-btn"]',
  deleteIntermentMenuItem: '[data-testid="button-toolbar-button-0"], button.mat-menu-item:has-text("Delete")',
  moveIntermentMenuItem: '[data-testid="button-toolbar-button-1"], button.mat-menu-item:has-text("Move")',

  // Delete confirmation dialog
  confirmDeleteIntermentButton: [
    '[role="dialog"] button:has-text("Delete")',
    '[role="dialog"] button:has-text("Yes")',
    '[role="dialog"] button:has-text("Confirm")',
    'mat-dialog-container button:has-text("Delete")',
  ].join(', '),

  // Move interment dialog / panel
  movePlotSearchInput: [
    'input[formcontrolname="plot"]',
    'input[placeholder*="lot"]',
    '[data-testid="autocomplete-input-input-autocomplete-search-input"]',
  ].join(', '),
  moveConfirmButton: [
    '[role="dialog"] button:has-text("Move")',
    'button[type="submit"]:has-text("Move")',
    'mat-dialog-container button:has-text("Confirm")',
  ].join(', '),

  // Verification - Plot detail page after save
  intermentsTab: '[aria-label="INTERMENTS"]',
  deceasedNameHeading: (name: string) => `[data-testid$="person-full-name"]:has-text("${name}")`,
  intermentTypeLabel: (type: string) => `mat-expansion-panel.mat-expanded p:has-text("${type}")`,
  editIntermentButton: '[data-testid="interment-item-button-edit-interment"]',
  intermentListItem: '[role="tabpanel"] button[class*="interment"]',

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

// ===== Edit Plot form (URL: /manage/edit/plot) =====
// The "Add" button in the Interments section on the edit plot form page
export const PlotEditFormSelectors = {
  addIntermentButton: '[data-testid="plot-edit-button-adding"]',
  addRoiButton: '[data-testid="plot-edit-div-roi"] [data-testid="plus-item-button-plus-button"]',
};
