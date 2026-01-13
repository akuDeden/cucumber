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
  // Environment: staging, map, production, etc. (used for domain)
  environment: process.env.ENVIRONMENT || 'dev',
  
  // Base domain (will be combined with environment)
  baseDomain: process.env.BASE_DOMAIN || 'chronicle.rip',
  
  // Region: aus, us, uk, etc. (used for authenticated URLs only)
  region: process.env.REGION || 'aus',
  
  // Convenience property for public URLs (environment.domain)
  get baseUrl(): string {
    return `https://${this.environment}.${this.baseDomain}`;
  },
  
  browser: process.env.BROWSER || 'chromium',
  headless: process.env.HEADLESS === 'true',
  timeout: parseInt(process.env.TIMEOUT || '30000')
};

// ============================================
// CEMETERY DATA
// ============================================
// Cemetery configuration with consistent naming
export const CEMETERY_CONFIG = {
  // Unique slug identifier (used in URLs)
  uniqueName: process.env.TEST_CEMETERY_UNIQUE || 'astana_tegal_gundul',
  
  // Display name (used in UI)
  displayName: process.env.TEST_CEMETERY_NAME || 'Astana Tegal Gundul',
  
  // Organization name for login
  organizationName: process.env.TEST_ORG_NAME || 'astana tegal gundul'
};

// ============================================
// HELPER FUNCTIONS FOR URL GENERATION
// ============================================

/**
 * Build PUBLIC cemetery URL (no region in subdomain)
 * Format: https://{environment}.chronicle.rip/{unique_name}_{region}
 * Example: https://staging.chronicle.rip/astana_tegal_gundul_aus
 */
export function getCemeteryUrl(uniqueName: string = CEMETERY_CONFIG.uniqueName, region: string = BASE_CONFIG.region): string {
  return `${BASE_CONFIG.baseUrl}/${uniqueName}_${region}`;
}

/**
 * Build PUBLIC sell plots URL
 * Format: https://{environment}.chronicle.rip/{unique_name}_{region}/sell-plots
 * Example: https://staging.chronicle.rip/astana_tegal_gundul_aus/sell-plots
 */
export function getCemeterySellPlotsUrl(uniqueName: string = CEMETERY_CONFIG.uniqueName, region: string = BASE_CONFIG.region): string {
  return `${getCemeteryUrl(uniqueName, region)}/sell-plots`;
}

/**
 * Get cemetery display name with region
 * Example: "Astana Tegal Gundul AUS"
 */
export function getCemeteryDisplayName(region: string = BASE_CONFIG.region): string {
  return `${CEMETERY_CONFIG.displayName} ${region.toUpperCase()}`;
}

/**
 * Build AUTHENTICATED customer organization base URL (with region in subdomain)
 * Format: https://{environment}-{region}.chronicle.rip
 * Example: https://staging-aus.chronicle.rip
 */
export function getCustomerOrgBaseUrl(region: string = BASE_CONFIG.region): string {
  const env = BASE_CONFIG.environment;
  const domain = BASE_CONFIG.baseDomain;
  return `https://${env}-${region}.${domain}`;
}

/**
 * Build full AUTHENTICATED customer organization URL path
 * Format: https://{environment}-{region}.chronicle.rip/customer-organization/{OrgName}/{path}
 * Example: https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/plots
 */
export function getCustomerOrgUrl(path: string = '', region: string = BASE_CONFIG.region): string {
  const baseUrl = getCustomerOrgBaseUrl(region);
  const orgName = CEMETERY_CONFIG.displayName.replace(/ /g, '_');
  const basePath = `${baseUrl}/customer-organization/${orgName}`;
  return path ? `${basePath}/${path}` : basePath;
}

// Backward compatibility
export const CEMETERY = CEMETERY_CONFIG.displayName;

// ============================================
// LOGIN DATA
// ============================================
export const LOGIN_DATA = {
  valid: {
    email: process.env.TEST_EMAIL || process.env.CHRONICLE_EMAIL || 'faris+astanaorg@chronicle.rip',
    password: process.env.TEST_PASSWORD || process.env.CHRONICLE_PASSWORD || '12345',
    organizationName: CEMETERY_CONFIG.organizationName // Use centralized org name
  },
  invalid: {
    email: 'invalid@chronicle.rip',
    password: 'wrongpassword'
  }
};

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
  },
  edit: {
    firstName: process.env.TEST_PERSON_FIRSTNAME || 'Michael',
    lastName: process.env.TEST_PERSON_LASTNAME_EDITED || 'Johnsonss', // Changed from Johnson to Johnsonss
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
  },
  filter: {
    firstName: process.env.TEST_PERSON_FIRSTNAME || 'Michael',
    lastName: process.env.TEST_PERSON_LASTNAME || 'Johnson'
  },
  delete: {
    firstName: process.env.TEST_PERSON_DELETE_FIRSTNAME || 'Robert',
    lastName: process.env.TEST_PERSON_DELETE_LASTNAME || 'Williams',
    middleName: process.env.TEST_PERSON_DELETE_MIDDLENAME || 'James',
    title: process.env.TEST_PERSON_DELETE_TITLE || 'Dr',
    gender: process.env.TEST_PERSON_DELETE_GENDER || 'Male',
    phoneM: process.env.TEST_PERSON_DELETE_PHONE_M || '+9876543210',
    phoneH: process.env.TEST_PERSON_DELETE_PHONE_H || '+1122334455',
    phoneO: process.env.TEST_PERSON_DELETE_PHONE_O || '+5544332211',
    email: process.env.TEST_PERSON_DELETE_EMAIL || 'robert.williams@example.com',
    address: process.env.TEST_PERSON_DELETE_ADDRESS || '456 Oak Avenue',
    city: process.env.TEST_PERSON_DELETE_CITY || 'Los Angeles',
    state: process.env.TEST_PERSON_DELETE_STATE || 'CA',
    country: process.env.TEST_PERSON_DELETE_COUNTRY || 'USA',
    postCode: process.env.TEST_PERSON_DELETE_POSTCODE || '90001',
    note: process.env.TEST_PERSON_DELETE_NOTE || 'Test person for deletion via automation'
  }
};

// ============================================
// REQUEST SALES FORM DATA
// ============================================
export const REQUEST_SALES_FORM_DATA = {
  cemetery: {
    // Use centralized cemetery config
    name: getCemeteryDisplayName(), // e.g., "Astana Tegal Gundul AUS"
    url: getCemeteryUrl(), // e.g., "https://staging.chronicle.rip/astana_tegal_gundul_aus"
    sellPlotsUrl: getCemeterySellPlotsUrl(), // e.g., "https://staging.chronicle.rip/astana_tegal_gundul_aus/sell-plots"
    uniqueName: CEMETERY_CONFIG.uniqueName, // e.g., "astana_tegal_gundul"
    region: BASE_CONFIG.region, // e.g., "aus"
  },
  plot: {
    section: process.env.TEST_PLOT_SECTION || 'B',
    name: process.env.TEST_PLOT_NAME || 'B A 1',
    status: process.env.TEST_PLOT_STATUS || 'For Sale',
  },
  applicant: {
    firstName: process.env.TEST_APPLICANT_FIRSTNAME || 'Test',
    lastName: process.env.TEST_APPLICANT_LASTNAME || 'Buyer',
    middleName: process.env.TEST_APPLICANT_MIDDLENAME || '',
    phoneMobile: process.env.TEST_APPLICANT_PHONE_M || '',
    phoneHome: process.env.TEST_APPLICANT_PHONE_H || '',
    phoneOffice: process.env.TEST_APPLICANT_PHONE_O || '',
    email: process.env.TEST_APPLICANT_EMAIL || 'test.buyer@example.com',
    address: process.env.TEST_APPLICANT_ADDRESS || '',
    suburb: process.env.TEST_APPLICANT_SUBURB || '',
    state: process.env.TEST_APPLICANT_STATE || '',
    country: process.env.TEST_APPLICANT_COUNTRY || '',
    postcode: process.env.TEST_APPLICANT_POSTCODE || '',
  },
  roi: {
    rightType: process.env.TEST_REQUEST_ROI_RIGHT_TYPE || 'Burial',
    termOfRight: process.env.TEST_REQUEST_ROI_TERM || 'Perpetual',
    fee: process.env.TEST_REQUEST_ROI_FEE || '100',
    serviceNeed: process.env.TEST_REQUEST_ROI_SERVICE_NEED || 'Pre-need',
  },
  // At-need specific: Interment Details
  intermentDetails: {
    deceasedFirstName: process.env.TEST_DECEASED_FIRSTNAME || 'John',
    deceasedLastName: process.env.TEST_DECEASED_LASTNAME || 'Doe',
    deceasedMiddleName: process.env.TEST_DECEASED_MIDDLENAME || '',
    dateOfBirth: process.env.TEST_DECEASED_DOB || '01/01/1950',
    dateOfDeath: process.env.TEST_DECEASED_DOD || '01/01/2026',
    placeOfDeath: process.env.TEST_PLACE_OF_DEATH || 'Hospital',
    intermentDate: process.env.TEST_INTERMENT_DATE || '01/15/2026',
    intermentTime: process.env.TEST_INTERMENT_TIME || '10:00',
    funeralDirector: process.env.TEST_FUNERAL_DIRECTOR || 'Test Funeral Home',
  },
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
  person: PERSON_DATA,
  requestSalesForm: REQUEST_SALES_FORM_DATA
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
export function getPersonName(type: 'add' | 'edit' | 'delete' = 'add'): string {
  const data = type === 'add' ? PERSON_DATA.add : (type === 'edit' ? PERSON_DATA.edit : PERSON_DATA.delete);
  return `${data.firstName} ${data.lastName}`;
}

// Helper function to get full applicant name for request sales form
export function getApplicantName(): string {
  return `${REQUEST_SALES_FORM_DATA.applicant.firstName} ${REQUEST_SALES_FORM_DATA.applicant.lastName}`;
}
