/**
 * Advanced Search Selectors
 * Real selectors from staging.chronicle.rip
 * Discovered via MCP Playwright manual exploration
 * Using CSS selectors with data-testid and aria-label
 */

export const AdvanceSearchSelectors = {
  // Home page - Advanced Search button
  advancedSearchButton: 'button:has-text("Advanced")',
  advancedSearchButtonByClass: 'button.container-advanced-search',
  advancedSearchIcon: 'img[data-testid="toolbar-img-manage-icon"]',

  // Advanced Search Dialog - Cemetery selection
  // Note: Use getByRole('combobox', { name: 'Cemeteries' }) instead of CSS selector
  cemeteryOption: (name: string) => `mat-option[role="option"]:has-text("${name}")`,

  // Advanced Search Dialog - Plot tab
  plotTabButton: 'button[aria-label="Plot"]',

  // Advanced Search Dialog - Deceased Person tab
  deceasedPersonTabButton: 'button[aria-label="Deceased Person"]',

  // Advanced Search Dialog - Plot fields
  plotIdTextbox: 'input[aria-label="Plot ID"]',
  sectionCombobox: 'input[data-testid="mat-form-field-input-number"]',
  rowCombobox: 'mat-select[aria-label="Row"]',
  numberTextbox: 'input[data-testid="mat-form-field-input-12"]',
  statusCombobox: 'mat-select[aria-label="Status"]',
  plotTypeCombobox: 'mat-select[aria-label="Plot type"]',
  priceTextbox: 'input[aria-label="Price ($)"]',

  // Advanced Search Dialog - Action buttons
  clearAllButton: 'button:has-text("CLEAR ALL")',
  cancelButton: 'button:has-text("CANCEL")',
  searchButton: 'button:has-text("SEARCH")',

  // Advance Search Results page
  searchResultsPage: '/search/advance',
  searchResultsHeading: 'h3:has-text("plots found")',
  searchResultsSubheading: 'p:has-text("cemeteries")',
  searchByBoundariesSwitch: '[role="switch"]',
  closeAdvanceSearchButton: '[data-testid*="advance-search-result-button-close-advance-search"]',
  // Plot result items in sidebar - works for both authenticated (numbered suffixes) and public (shared testid)
  searchResultItem: '[data-testid*="advance-search-result-div-search-list"]',
  searchResultPlotId: '[data-testid*="advance-search-result-div-content-title"] > span:first-child',
  // Plot detail in sidebar result
  plotDetailContainer: '[data-testid*="advance-search-result-div-content-title"]',
  plotDetailText: '[data-testid*="advance-search-result-div-content-title"] > span:first-child',
  cemeteryNameText: '[data-testid*="advance-search-result-div-content-title"] > span:last-child',
  firstResultIcon: '[data-testid*="advance-search-result-div-picture"] mat-icon',

  // No results message
  noResultsMessage: 'generic:has-text("No results at this place")',
  zoomOutMessage: 'generic:has-text("Please zoom out to see more items")',

  // Home page elements (for verification after closing search)
  cemeteriesHeading: 'div[data-testid="cemetery-list-public-div-cemeteries-title"]',
  cemeteriesCount: 'div[data-testid="cemetery-list-public-div-amount-of-cemeteries"]'
};
