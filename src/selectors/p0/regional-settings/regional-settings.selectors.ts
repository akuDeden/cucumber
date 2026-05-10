export const RegionalSettingsSelectors = {
  // Top-right cemetery/user dropdown button (contains cemetery name)
  cemeteryDropdownButton: 'button[data-testid*="user-info"], button:has([data-testid*="user-info"])',
  myOrganisationMenuItem: '[data-testid="user-info-dropdown-a-account-settings-button-0"]',

  // Organisation settings tabs
  regionalSettingsTab: 'li:has-text("Regional Settings"), [role="tab"]:has-text("Regional Settings")',

  // Regional Settings input fields
  plotInput:             '[data-testid="regional-setting-input-plot"]',
  plotsInput:            '[data-testid="regional-setting-input-plots"]',
  forSaleInput:          '[data-testid="regional-setting-input-for-sale"]',
  reservedInput:         '[data-testid="regional-setting-input-reserved"]',
  roiInput:              '[data-testid="regional-setting-input-roi"]',
  roisInput:             '[data-testid="regional-setting-input-rois"]',
  roiHolderInput:        '[data-testid="regional-setting-input-roi-holder"]',
  roiHoldersInput:       '[data-testid="regional-setting-input-roi-holders"]',
  roiApplicantInput:     '[data-testid="regional-setting-input-roi-applicant"]',
  roiApplicantsInput:    '[data-testid="regional-setting-input-roi-applicants"]',
  rightOfIntermentInput: '[data-testid="regional-setting-input-right-of-interment"]',

  // Toolbar buttons (appear when form is dirty)
  saveButton:   '[data-testid="toolbar-organization-button-toolbar-button-1"]',
  cancelButton: '[data-testid="toolbar-organization-button-toolbar-button"]',
};

export const RegionalSettingsUrls = {
  // URL varies per env: /customer-organization/organizations/{id}/details (project) or /customer-organization/{slug} (prod)
  // Do NOT use for waitForURL — use element wait instead
  orgSettings: '/customer-organization/organizations',
  regionalSettingsQuery: '?q=regionalsettings',
};
