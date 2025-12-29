/**
 * ROI (Record of Interest) Page Selectors
 * Real selectors from staging.chronicle.rip
 * All selectors use data-testid attributes
 */

export const RoiSelectors = {
  // Dashboard - Cemetery section
  seeAllPlotsButton: '[data-testid="plots-statistic-a-button"]',
  
  // Plots page - Filter
  filterButton: '[data-testid="perfect-scrollbar-button-filter"]',
  vacantFilterOption: '[data-testid="statuses-div-control-button"]',
  reservedFilterOption: '[data-testid="statuses-div-control-button-0"]',
  filterDoneButton: '[data-testid="filter-button-submit-button"]',
  
  // Plots page - List
  sectionToggleButton: (section: string) => `[data-testid="perfect-scrollbar-button-toggle-${section.toLowerCase()}-0"]`,
  
  // Plot detail page
  plotDetailTitle: 'h1', // Plot name like "A B 3 VACANT"
  plotStatusBadge: 'span:has-text("VACANT"), span:has-text("RESERVED")',
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
  
  // ROI Form - Notes
  notesInput: '[data-testid="roi-form-input-add-notes-0"]',
};

export const RoiUrls = {
  plotsListPage: '/plots',
  plotDetailPattern: '/plots/',
  addRoiPattern: '/manage/add/roi',
};

export const PlotStatus = {
  VACANT: 'VACANT',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
};
