/**
 * Test Data Configuration
 * Centralized test data for all test scenarios
 * Can be overridden via environment variables for different environments/regression testing
 * 
 * Usage:
 * - Default: Uses hardcoded values below
 * - Environment: Set environment variables to override (e.g., TEST_EMAIL=new@email.com)
 * - Regression: Create .env file with new test data for bulk updates
 * 
 * NOTE: This is the SINGLE SOURCE OF TRUTH for all test data.
 * Don't use Config.ts - it's deprecated. All config should be here.
 */

// ============================================
// BASE CONFIGURATION
// ============================================
export const BASE_CONFIG = {
  baseUrl: process.env.BASE_URL || 'https://staging.chronicle.rip',
  browser: process.env.BROWSER || 'chromium',
  headless: process.env.HEADLESS === 'true',
  timeout: parseInt(process.env.TIMEOUT || '30000')
};

// ============================================
// LOGIN DATA
// ============================================
export const LOGIN_DATA = {
  valid: {
    email: process.env.TEST_EMAIL || process.env.CHRONICLE_EMAIL || 'faris+astanaorg@chronicle.rip',
    password: process.env.TEST_PASSWORD || process.env.CHRONICLE_PASSWORD || '12345',
    organizationName: process.env.TEST_ORG_NAME || 'astana tegal gundul'
  },
  invalid: {
    email: 'invalid@chronicle.rip',
    password: 'wrongpassword'
  }
};

// ============================================
// CEMETERY DATA
// ============================================
export const CEMETERY = process.env.TEST_CEMETERY || 'Astana Tegal Gundul';

// ============================================
// PLOT SEARCH DATA
// ============================================
export const PLOT_SEARCH = {
  section: process.env.TEST_SECTION || 'A',
  row: process.env.TEST_ROW || 'A',
  number: process.env.TEST_NUMBER || '1'
};

// Status options for scenario outline examples
export const STATUSES = ['For Sale', 'Vacant', 'Reserved', 'Occupied'];

// ============================================
// ADVANCED SEARCH DATA
// ============================================
// NOTE: Most advanced search now uses Scenario Outline with hardcoded values in .feature files
// These variables are kept as fallback/override options via environment variables
export const ADVANCE_SEARCH_DATA = {
  // Plot ID search - Used in authenticated scenarios
  plotId: process.env.TEST_ADVANCE_PLOT_ID || 'B A 1',

  // Plot type search - Fallback value
  plotType: process.env.TEST_ADVANCE_PLOT_TYPE || 'Monumental',

  // Status search - Fallback value
  status: process.env.TEST_ADVANCE_STATUS || 'Vacant'
};

// ============================================
// INTERMENT DATA
// ============================================
export const INTERMENT_DATA = {
  add: {
    firstName: process.env.TEST_INTERMENT_FIRSTNAME || 'John',
    lastName: process.env.TEST_INTERMENT_LASTNAME || 'Doe',
    intermentType: process.env.TEST_INTERMENT_TYPE || 'Burial'
  },
  edit: {
    firstName: process.env.TEST_INTERMENT_EDIT_FIRSTNAME || 'Jane',
    lastName: process.env.TEST_INTERMENT_EDIT_LASTNAME || 'Smith',
    intermentType: process.env.TEST_INTERMENT_EDIT_TYPE || 'Cremated'
  }
};

// ============================================
// SEARCH BOX TEST DATA
// ============================================
const SEARCH_DATA = {
  roiHolder: {
    searchName: process.env.TEST_SEARCH_ROI_HOLDER_NAME || 'sandiaga uno salahuddin',
    displayName: process.env.TEST_SEARCH_ROI_HOLDER_DISPLAY || 'Sandiaga Uno Salahuddin',
    plotId: process.env.TEST_SEARCH_PLOT_ID || 'B F 13'
  }
};

// ============================================
// ROI (RECORD OF INTEREST) DATA
// ============================================
export const ROI_DATA = {
  // Basic ROI data (used across all ROI scenarios)
  basic: {
    rightType: process.env.TEST_ROI_RIGHT_TYPE || 'Cremation',
    termOfRight: process.env.TEST_ROI_TERM || '25 Years',
    fee: process.env.TEST_ROI_FEE || '1000',
    certificateNumber: process.env.TEST_ROI_CERT || 'CERT-TEST-001',
    notes: process.env.TEST_ROI_NOTES || 'Test ROI for automation'
  },
  
  // Certificate numbers for different scenarios (to avoid conflicts)
  certificates: {
    withPerson: process.env.TEST_ROI_CERT_2 || 'CERT-TEST-002',
    applicant: process.env.TEST_ROI_CERT_APPLICANT || 'CERT-TEST-003',
    both: process.env.TEST_ROI_CERT_BOTH || 'CERT-TEST-004'
  },
  
  // ROI Holder person data
  holder: {
    firstName: process.env.TEST_ROI_HOLDER_FIRSTNAME || 'John',
    lastName: process.env.TEST_ROI_HOLDER_LASTNAME || 'Doe',
    phone: process.env.TEST_ROI_HOLDER_PHONE || '+1234567890',
    email: process.env.TEST_ROI_HOLDER_EMAIL || 'john.doe@example.com'
  },
  
  // ROI Applicant person data
  applicant: {
    firstName: process.env.TEST_ROI_APPLICANT_FIRSTNAME || 'Jane',
    lastName: process.env.TEST_ROI_APPLICANT_LASTNAME || 'Smith',
    phone: process.env.TEST_ROI_APPLICANT_PHONE || '+9876543210',
    email: process.env.TEST_ROI_APPLICANT_EMAIL || 'jane.smith@example.com'
  }
};

// ============================================
// PERSON DATA
// ============================================
export const PERSON_DATA = {
  add: {
    firstName: process.env.TEST_PERSON_FIRSTNAME || 'Michael',
    lastName: process.env.TEST_PERSON_LASTNAME || 'Johnson',
    middleName: process.env.TEST_PERSON_MIDDLENAME || 'Andrew',
    title: process.env.TEST_PERSON_TITLE || 'Mr',
    gender: process.env.TEST_PERSON_GENDER || 'Male',
    phoneM: process.env.TEST_PERSON_PHONE_M || '+1234567890',
    phoneH: process.env.TEST_PERSON_PHONE_H || '+0987654321',
    phoneO: process.env.TEST_PERSON_PHONE_O || '+1122334455',
    email: process.env.TEST_PERSON_EMAIL || 'michael.johnson@example.com',
    address: process.env.TEST_PERSON_ADDRESS || '123 Main Street',
    city: process.env.TEST_PERSON_CITY || 'New York',
    state: process.env.TEST_PERSON_STATE || 'NY',
    country: process.env.TEST_PERSON_COUNTRY || 'USA',
    postCode: process.env.TEST_PERSON_POSTCODE || '10001',
    note: process.env.TEST_PERSON_NOTE || 'Test person created via automation'
  }
};

// ============================================
// FULL TEST DATA OBJECT (For easy access)
// ============================================
export const TEST_DATA = {
  config: BASE_CONFIG,
  login: LOGIN_DATA,
  cemetery: CEMETERY,
  plot: PLOT_SEARCH,
  statuses: STATUSES,
  advanceSearch: ADVANCE_SEARCH_DATA,
  interment: INTERMENT_DATA,
  search: SEARCH_DATA,
  roi: ROI_DATA,
  person: PERSON_DATA
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Helper function to get plot detail text (format: "A A 1")
export function getPlotDetailText(): string {
  return `${PLOT_SEARCH.section} ${PLOT_SEARCH.row} ${PLOT_SEARCH.number}`;
}

// Helper function to get full deceased name
export function getDeceasedName(type: 'add' | 'edit' = 'add'): string {
  const data = type === 'add' ? INTERMENT_DATA.add : INTERMENT_DATA.edit;
  return `${data.firstName} ${data.lastName}`;
}

// Helper function to get full person name
export function getPersonName(): string {
  return `${PERSON_DATA.add.firstName} ${PERSON_DATA.add.lastName}`;
}
