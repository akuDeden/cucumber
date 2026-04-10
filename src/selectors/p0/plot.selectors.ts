/**
 * Plot Selectors
 * Real selectors from staging-aus.chronicle.rip
 * Discovered via Playwright CLI manual exploration
 */

export const PlotSelectors = {
  // ===== Tables / Advance Table page =====
  // URL: /customer-organization/advance-table?tab=plots
  tablesNavButton: '[data-testid="side-menu-span-label-menu-sidebar-0"]:has-text("Tables")',
  addPlotButton: '[data-testid="content-wrapper-button-add-plot"]',
  bulkAddMenuButton: '[data-testid="content-wrapper-button-bulk-add-menu"]',
  plotsTab: '[data-testid="content-wrapper-a"]:has-text("PLOTS")',
  plotIdCell: '[data-testid="content-wrapper-div-plot-id-0"]',
  filterButton: '[data-testid="content-wrapper-button-action"]',

  // ===== Add Plot form =====
  // URL: /customer-organization/advance-table/manage/add/plot/{formId}
  addPlotBanner: '[data-testid="plot-add-div-info-banner"]',
  // Cemetery select: use aria-label
  cemeterySelect: 'mat-select[aria-label="Cemeteries Lists"]',
  cemeteryOption: (name: string) => `mat-option:has-text("${name}")`,

  // Position fields
  sectionInput: '[data-testid="plot-add-input-type-your-section-name"]',
  rowInput: '[data-testid="plot-add-input"]',
  numberInput: '[data-testid="plot-add-input-number"]',

  // Detail fields - use label-based approach since some testids are shared
  statusSelect: 'mat-label:has-text("Status") + mat-select, mat-form-field:has(mat-label:has-text("Status")) mat-select',
  plotTypeSelect: 'mat-label:has-text("Plot type") + mat-select, mat-form-field:has(mat-label:has-text("Plot type")) mat-select',
  directionSelect: 'mat-label:has-text("Direction") + mat-select, mat-form-field:has(mat-label:has-text("Direction")) mat-select',

  // Capacity inputs
  burialsInput: '[data-testid="plot-add-input-number-0"]',

  // Photo
  selectPhotoButton: '[data-testid="upload-wrapper-button"]',

  // Notes
  addNotesInput: '[data-testid="plot-add-input-add-notes"]',

  // Form toolbar buttons
  cancelButton: '[data-testid="toolbar-manage-button-toolbar-button"]',
  saveButton: '[data-testid="toolbar-manage-button-toolbar-button-1"]',

  // Total capacity display
  totalCapacity: '[data-testid="plot-add-div-total-capacity"]',

  // ===== Edit Plot form =====
  // URL: /customer-organization/{cemetery_slug}/{plot_uuid}/manage/edit/plot
  editPlotButton: '[data-testid="plot-details-edit-button-edit-plot"]',

  // Edit form fields
  editStatusSelect: 'mat-form-field:has(mat-label:has-text("Status")) mat-select',
  editPlotTypeSelect: 'mat-form-field:has(mat-label:has-text("Plott type")) mat-select, mat-form-field:has(mat-label:has-text("Plot type")) mat-select',
  editBurialCapacityInput: '[data-testid="plot-edit-input-burial-capacity"]',
  editEntombmentCapacityInput: '[data-testid="plot-edit-input-entombment-capacity"]',
  editCremationCapacityInput: '[data-testid="plot-edit-input-cremation-capacity"]',
  editTotalCapacityInput: '[data-testid="plot-edit-input-total-capacity"]',
  editPriceInput: '[data-testid="plot-edit-input-number"]',
  editHeadstoneInput: '[data-testid="plot-edit-textarea-headstone-inscription"]',
  editNotesInput: '[data-testid="user-log-activity-textarea-add-notes"]',
  editSaveButton: '[data-testid="toolbar-manage-button-toolbar-button-1"]',
  editCancelButton: '[data-testid="toolbar-manage-button-toolbar-button"]',

  // ===== Plot detail (view mode) =====
  plotIdHeading: '[data-testid="plot-details-edit-h3-plot-id"]',
  plotStatusBadge: '[data-testid="plot-details-edit-span-plot-status"]',
  plotCemeteryName: '[data-testid="plot-details-edit-div-cemetery-name-wrapper"]',
};

export const PlotUrls = {
  advanceTable: '/customer-organization/advance-table?tab=plots',
  addPlotPattern: '/customer-organization/advance-table/manage/add/plot/',
  editPlotPattern: '/manage/edit/plot',
};

export const PlotStatusOptions = {
  vacant: 'Vacant',
  forSale: 'For Sale',
  reserved: 'Reserved',
  occupied: 'Occupied',
  unavailable: 'Unavailable',
};

export const PlotTypeOptions = {
  monumental: 'Monumental',
  garden: 'Garden',
  lawn: 'Lawn',
  cremation: 'Cremation',
  mausoleum: 'Mausoleum',
};
