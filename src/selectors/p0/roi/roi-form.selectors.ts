/**
 * ROI (Record of Interest) Page Selectors
 * Real selectors from staging.chronicle.rip
 * All selectors use data-testid attributes
 */

export const RoiSelectors = {
  // Dashboard - Cemetery section
  seeAllPlotsButton: '[data-testid="plots-statistic-a-button"]',

  // Plots page - Filter
  filterButton: '[data-testid="shared-all-plots-button-filter"]',
  vacantFilterOption: '[data-testid="statuses-div-control-button"]',
  reservedFilterOption: '[data-testid="statuses-div-control-button-0"]',
  filterDoneButton: '[data-testid="filter-button-submit-button"]',

  // Plots page - List
  sectionToggleButton: (section: string) => `[data-testid="shared-all-plots-button-toggle-${section.toLowerCase()}-0"]`,

  // Plot detail page
  plotDetailTitle: 'h1', // Plot name like "A B 3 VACANT"
  plotStatusBadge: '[data-testid="plot-details-edit-span-plot-status"]',
  addRoiButton: '[data-testid="plot-details-edit-button-add-roi-btn"]',
  editButton: 'button:has-text("Edit")',
  addIntermentButton: 'button:has-text("Add interment")',

  // ROI Form - Header
  roiFormTitle: '[data-testid="roi-form-h1-title-0"]',
  cancelButton: '[data-testid="toolbar-manage-button-toolbar-button"]',
  saveButton: '[data-testid="toolbar-manage-button-toolbar-button-2"]',
  saveAndAddIntermentButton: '[data-testid="toolbar-manage-button-save-and-add"]',

  // ROI Form - Main fields
  plotNameDisplay: '[data-testid="roi-form-div-location-details-0"]',
  rightTypeDropdown: 'mat-select[aria-label="Right type"]',
  termOfRightDropdown: 'mat-select[aria-label="Term of right"]',

  // ROI Form - Fee section
  feeInput: '[data-testid="roi-form-input-number-0"]',
  paymentDateInput: '[data-testid="roi-form-input-0"]',
  chargedSwitch: 'mat-slide-toggle',

  // ROI Form - Dates
  applicationDateInput: 'input[placeholder*="Application date"]',
  expiryDateInput: 'input[placeholder*="Expiry Date"]',
  autoAddEventCalendarCheckbox: 'input[type="checkbox"]',

  // ROI Form - Additional fields
  serviceNeedDropdown: 'mat-select[aria-label="Service need"]',
  certificateNumberInput: '[data-testid="roi-form-input-text-0"]',

  // ROI Form - Extra details
  infusionsPurchasedDropdown: 'mat-select[aria-label="Infusions purchased"]',
  infusionsCostInput: '[data-testid="custom-input-input-label"]',
  crystalKeepsakesCostInput: 'input[type="number"]:nth-of-type(2)',
  weekendSurchargeCostInput: 'input[type="number"]:nth-of-type(3)',
  diggingFeeInput: '[data-testid="custom-input-input-label-0"]',

  // ROI Form - Documents
  uploadFileInput: '[data-testid="upload-wrapper-input-file-0"]',
  selectFileButton: '[data-testid="upload-wrapper-button-button-0"]',

  // ROI Form - Roles
  addRoiHolderButton: '[data-testid="roi-form-div-roiholders-0"] [data-testid="plus-item-button-plus-button-0"]',
  addRoiApplicantButton: '[data-testid="roi-form-div-roiapplicant-1"] [data-testid="plus-item-button-plus-button-0"]',

  // ROI Holder Person Dialog
  roiHolderFirstNameInput: '[data-testid="autocomplete-wrapper-input"]',
  roiHolderLastNameInput: '[data-testid="autocomplete-wrapper-input-0"]',
  roiHolderPhoneMobileInput: 'input[placeholder="Phone (mobile)"]',
  roiHolderEmailInput: '[data-testid="form-person-component-input-email"]',
  roiHolderAddButton: 'button:has-text("add")',
  roiHolderCancelButton: 'button:has-text("cancel")',

  // ROI Applicant Person Dialog (same structure as holder)
  roiApplicantFirstNameInput: '[data-testid="autocomplete-wrapper-input"]',
  roiApplicantLastNameInput: '[data-testid="autocomplete-wrapper-input-0"]',
  roiApplicantPhoneMobileInput: 'input[placeholder="Phone (mobile)"]',
  roiApplicantEmailInput: '[data-testid="form-person-component-input-email"]',
  roiApplicantAddButton: 'button:has-text("add")',
  roiApplicantCancelButton: 'button:has-text("cancel")',

  // Activity Notes
  activityNotesInput: '[data-testid="user-log-activity-textarea-add-notes"]',
  activityNotesSendButton: '[data-testid="user-log-activity-div-input-note-container"] mat-icon', // Send icon button
  activityNotesContainer: '[data-testid="user-log-activity-div-input-note-container"]',

  // Activity Notes - Edit
  activityNoteThreeDotsMenu: '[data-testid="user-log-activity-div-button-group"] mat-icon[data-mat-icon-name="more"]', // Three dots menu for each note
  activityNoteEditMenuItem: 'menuitem:has-text("Edit")', // Edit menu item
  activityNoteEditTextarea: 'textarea', // Textarea in edit mode
  activityNoteEditSaveButton: 'mat-icon[svgicon="check-edit"]', // Save/check button in edit mode
  activityNoteEditCancelButton: 'mat-icon[svgicon="close"]', // Cancel/close button in edit mode

  // ROI Holder/Applicant - Remove
  roiHolderCard: '[data-testid="roi-form-div-roi-holder"]', // First ROI holder card
  roiHolderCardByIndex: (index: number) => `[data-testid="roi-form-div-roi-holder${index > 0 ? '-' + index : ''}"]`,
  roiApplicantCard: '[data-testid="roi-form-div-info-card"]', // ROI applicant card
  removeAndReplacePanel: 'mat-expansion-panel-header:has-text("REMOVE & REPLACE")', // REMOVE & REPLACE expansion panel
  removeOnlyButton: 'button:has-text("REMOVE ONLY")', // REMOVE ONLY option
  removeAndReplaceWithPersonButton: 'button:has-text("Remove and replace with another person")', // Replace option

  // Remove Confirmation Dialog
  removeDialogCancelButton: '[data-testid="remove-roi-holder-dialog-button-cancel"]',
  removeDialogConfirmButton: '[data-testid="remove-roi-holder-dialog-button-remove"]',

  // Autocomplete suggestion list (articles in dropdown)
  autocompleteSuggestionList: 'article[role="option"], article[cursor="pointer"], article',

  // Activity log
  activityFilterListbox: '[role="listbox"]',
  activityLogContainer: '[data-testid="user-log-activity-div-chronicle-container"]',
  activityLogEntries: '[data-testid^="user-log-activity-div-chronicle-item"]',
};
