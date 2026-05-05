/**
 * Selectors for Feedback feature at Cemetery level
 * Multi-step wizard form with 5 expansion panels
 * Based on actual element inspection from project.chronicle.rip
 *
 * NOTE: All continue buttons share the SAME data-testid.
 * Use panel scoping + :visible or button:has-text("continue") to disambiguate.
 */

export const FeedbackSelectors = {
  // Navigation - REQUESTS button in content area (NOT sidebar)
  navigation: {
    requestsButton: '[data-testid="cemetery-info-wrapper-button-btn-service"]',
    feedbackMenuItem: '[role="menuitem"]:has-text("Feedback")',
  },

  // Feedback page structure
  page: {
    title: '[data-testid="form-general-purpose-h1-title"]',
    formContainer: '[data-testid="form-general-purpose-div-form-container"]',
    submitButton: '[data-testid="form-general-purpose-button-submit-request-btn"]',
  },

  // Shared continue button data-testid (same for ALL sections)
  continueButton: '[data-testid="render-custom-form-button-section-continue-btn"]',

  // Section 2: Applicant details — label-based field targeting
  section2_applicant: {
    firstName: 'mat-form-field:has(mat-label:has-text("First Name")) input',
    lastName: 'mat-form-field:has(mat-label:has-text("Last Name")) input',
    middleName: 'mat-form-field:has(mat-label:has-text("Middle Name")) input',
    gender: 'mat-form-field:has(mat-label:has-text("Gender")) mat-select',
    title: 'mat-form-field:has(mat-label:has-text("Title")) input',
    phoneMobile: 'mat-form-field:has(mat-label:has-text("Phone Mobile")) input',
    phoneHome: 'mat-form-field:has(mat-label:has-text("Phone Home")) input',
    phoneOffice: 'mat-form-field:has(mat-label:has-text("Phone Office")) input',
    email: 'mat-form-field:has(mat-label:has-text("Email")) input',
    address: 'mat-form-field:has(mat-label:has-text("Address")) input',
    suburb: 'mat-form-field:has(mat-label:has-text("Suburb")) input',
    state: 'mat-form-field:has(mat-label:has-text("State")) input',
    country: 'mat-form-field:has(mat-label:has-text("Country")) input',
    postcode: 'mat-form-field:has(mat-label:has-text("Postcode")) input',
    postalAddressDiff: 'mat-checkbox:has-text("Postal Address Different")',
    alsoROIHolder: 'mat-checkbox:has-text("Also ROI Holder")',
  },

  // Section 3: Feedback Category
  section3_category: {
    option: (text: string) => `mat-option:has-text("${text}")`,
  },
} as const;
