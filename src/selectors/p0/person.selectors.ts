export const PersonSelectors = {
  // Navigation
  personTab: '[data-testid="content-wrapper-a-3"]',
  addPersonButton: '[data-testid="content-wrapper-button-add-plot"]',

  // Form fields
  firstNameInput: 'input[formcontrolname="first_name"]',
  lastNameInput: 'input[formcontrolname="last_name"]',
  middleNameInput: 'input[formcontrolname="middle_name"]',
  titleInput: 'input[formcontrolname="title"]',
  genderDropdown: 'mat-select[formcontrolname="gender"]',
  
  phoneMobileInput: 'input[formcontrolname="mobile"]',
  phoneHomeInput: 'input[formcontrolname="home"]',
  phoneOfficeInput: 'input[formcontrolname="business"]',
  emailInput: 'input[formcontrolname="email"]',
  
  // Home address
  addressInput: 'input[formcontrolname="street"]',
  cityInput: 'input[formcontrolname="suburb"]',
  stateInput: 'input[formcontrolname="state"]',
  countryInput: 'input[formcontrolname="country"]',
  postCodeInput: 'input[formcontrolname="postcode"]',
  
  // Notes
  notesTextarea: 'input[formcontrolname="notes"]',
  
  // Buttons
  saveButton: 'button[data-testid="toolbar-manage-button-toolbar-button-1"]',
  cancelButton: 'button[data-testid="toolbar-manage-button-toolbar-button"]',
  
  // Table - first row (grid structure)
  tableFirstRow: 'div[role="grid"] div[role="row"]:nth-child(2)', // nth-child(2) to skip header row
  firstRowFirstName: 'div[role="grid"] div[role="row"]:nth-child(2) div[role="gridcell"]:nth-child(2)',
  firstRowLastName: 'div[role="grid"] div[role="row"]:nth-child(2) div[role="gridcell"]:nth-child(4)',
};
