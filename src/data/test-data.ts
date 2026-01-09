/**
 * Test Data Configuration
 * Centralized test data for all test scenarios
 * Can be overridden via environment variables for different environments/regression testing
 * 
 * Usage:
 * - Default: Uses hardcoded values below
 * - Environment: Set environment variables to override (e.g., TEST_EMAIL=new@email.com)
 * - Regression: Create .env file with new test data for bulk updates
 */

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
export const ADVANCE_SEARCH_DATA = {
  // Plot ID search
  plotId: process.env.TEST_ADVANCE_PLOT_ID || 'B A 1',

  // Plot type search (based on CSV data: 1=Lawn, 2=Garden)
  // Note: Some plot types may not have results in all cemeteries
  plotType: process.env.TEST_ADVANCE_PLOT_TYPE || 'Monumental',

  // Status search (1=Vacant, 2=Reserved, 3=Occupied, 6=Unavailable)
  status: process.env.TEST_ADVANCE_STATUS || 'Vacant',

  // Price search
  price: process.env.TEST_ADVANCE_PRICE || '500',

  // Capacity search (based on A A 1: burial=3, cremation=2)
  burialCapacity: process.env.TEST_ADVANCE_BURIAL_CAPACITY || '3',
  entombmentCapacity: process.env.TEST_ADVANCE_ENTOMBMENT_CAPACITY || '0',
  cremationCapacity: process.env.TEST_ADVANCE_CREMATION_CAPACITY || '2',

  // Interments Qty range
  intermentsQtyFrom: process.env.TEST_ADVANCE_INTERMENTS_FROM || '0',
  intermentsQtyTo: process.env.TEST_ADVANCE_INTERMENTS_TO || '2',

  // Section B (verified to have 91 plots in staging)
  sectionB: process.env.TEST_ADVANCE_SECTION_B || 'B',
  rowB: process.env.TEST_ADVANCE_ROW_B || 'A',

  // Section B Row A (with prices)
  sectionBRowA: process.env.TEST_ADVANCE_SECTION_B_ROW_A || 'B',
  rowARowA: process.env.TEST_ADVANCE_ROW_A_ROW_A || 'A',

  // Section A Row A (with high capacity)
  sectionA: process.env.TEST_ADVANCE_SECTION_A || 'A',
  rowA: process.env.TEST_ADVANCE_ROW_A || 'A'
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
// ROI (RECORD OF INTEREST) DATA
// ============================================
export const ROI_DATA = {
  basic: {
    rightType: process.env.TEST_ROI_RIGHT_TYPE || 'Cremation',
    termOfRight: process.env.TEST_ROI_TERM || '25 Years',
    fee: process.env.TEST_ROI_FEE || '1000',
    certificateNumber: process.env.TEST_ROI_CERT || 'CERT-TEST-001',
    notes: process.env.TEST_ROI_NOTES || 'Test ROI for automation'
  },
  withPerson: {
    rightType: 'Cremation',
    termOfRight: '25 Years',
    fee: '1000',
    certificateNumber: process.env.TEST_ROI_CERT_2 || 'CERT-TEST-002',
    notes: 'Test ROI with person holder',
    holder: {
      firstName: process.env.TEST_ROI_HOLDER_FIRSTNAME || 'John',
      lastName: process.env.TEST_ROI_HOLDER_LASTNAME || 'Doe',
      phone: process.env.TEST_ROI_HOLDER_PHONE || '+1234567890'
    }
  }
};

// ============================================
// FULL TEST DATA OBJECT (For easy access)
// ============================================
export const TEST_DATA = {
  login: LOGIN_DATA,
  cemetery: CEMETERY,
  plot: PLOT_SEARCH,
  statuses: STATUSES,
  advanceSearch: ADVANCE_SEARCH_DATA,
  interment: INTERMENT_DATA,
  roi: ROI_DATA
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
