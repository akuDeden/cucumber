/**
 * Test Data Helper Utility
 * Provides helper functions to replace placeholder variables with actual test data
 */

import { TEST_DATA } from '../data/test-data.js';

/**
 * Map of placeholder keys to their actual values
 * Add new mappings here when adding new test data
 */
const PLACEHOLDER_MAP: Record<string, string> = {
  // Login data
  '<TEST_EMAIL>': TEST_DATA.login.valid.email,
  '<TEST_PASSWORD>': TEST_DATA.login.valid.password,
  '<TEST_ORG_NAME>': TEST_DATA.login.valid.organizationName,

  // Cemetery & Plot data
  '<TEST_CEMETERY>': TEST_DATA.cemetery,
  '<TEST_SECTION>': TEST_DATA.plot.section,
  '<TEST_ROW>': TEST_DATA.plot.row,
  '<TEST_NUMBER>': TEST_DATA.plot.number,

  // Advanced Search data
  '<TEST_ADVANCE_PLOT_ID>': TEST_DATA.advanceSearch.plotId,
  '<TEST_ADVANCE_PLOT_TYPE>': TEST_DATA.advanceSearch.plotType,
  '<TEST_ADVANCE_STATUS>': TEST_DATA.advanceSearch.status,
  '<TEST_ADVANCE_PRICE>': TEST_DATA.advanceSearch.price,
  '<TEST_ADVANCE_BURIAL_CAPACITY>': TEST_DATA.advanceSearch.burialCapacity,
  '<TEST_ADVANCE_ENTOMBMENT_CAPACITY>': TEST_DATA.advanceSearch.entombmentCapacity,
  '<TEST_ADVANCE_CREMATION_CAPACITY>': TEST_DATA.advanceSearch.cremationCapacity,
  '<TEST_ADVANCE_INTERMENTS_FROM>': TEST_DATA.advanceSearch.intermentsQtyFrom,
  '<TEST_ADVANCE_INTERMENTS_TO>': TEST_DATA.advanceSearch.intermentsQtyTo,
  '<TEST_ADVANCE_SECTION_B>': TEST_DATA.advanceSearch.sectionB,
  '<TEST_ADVANCE_ROW_B>': TEST_DATA.advanceSearch.rowB,
  '<TEST_ADVANCE_SECTION_B_ROW_A>': TEST_DATA.advanceSearch.sectionBRowA,
  '<TEST_ADVANCE_ROW_A_ROW_A>': TEST_DATA.advanceSearch.rowARowA,
  '<TEST_ADVANCE_SECTION_A>': TEST_DATA.advanceSearch.sectionA,
  '<TEST_ADVANCE_ROW_A>': TEST_DATA.advanceSearch.rowA,

  // Interment data - Add
  '<TEST_INTERMENT_FIRSTNAME>': TEST_DATA.interment.add.firstName,
  '<TEST_INTERMENT_LASTNAME>': TEST_DATA.interment.add.lastName,
  '<TEST_INTERMENT_TYPE>': TEST_DATA.interment.add.intermentType,

  // Interment data - Edit
  '<TEST_INTERMENT_EDIT_FIRSTNAME>': TEST_DATA.interment.edit.firstName,
  '<TEST_INTERMENT_EDIT_LASTNAME>': TEST_DATA.interment.edit.lastName,
  '<TEST_INTERMENT_EDIT_TYPE>': TEST_DATA.interment.edit.intermentType,

  // ROI data - Basic
  '<TEST_ROI_RIGHT_TYPE>': TEST_DATA.roi.basic.rightType,
  '<TEST_ROI_TERM>': TEST_DATA.roi.basic.termOfRight,
  '<TEST_ROI_FEE>': TEST_DATA.roi.basic.fee,
  '<TEST_ROI_CERT>': TEST_DATA.roi.basic.certificateNumber,
  '<TEST_ROI_NOTES>': TEST_DATA.roi.basic.notes,

  // ROI data - With Person
  '<TEST_ROI_CERT_2>': TEST_DATA.roi.withPerson.certificateNumber,
  '<TEST_ROI_HOLDER_FIRSTNAME>': TEST_DATA.roi.withPerson.holder.firstName,
  '<TEST_ROI_HOLDER_LASTNAME>': TEST_DATA.roi.withPerson.holder.lastName,
  '<TEST_ROI_HOLDER_PHONE>': TEST_DATA.roi.withPerson.holder.phone,
};

/**
 * Replace all placeholders in a string with actual test data values
 * 
 * @param value - String that may contain placeholders like <TEST_EMAIL>
 * @returns String with all placeholders replaced with actual values
 * 
 * @example
 * replacePlaceholders('<TEST_EMAIL>') // Returns: 'faris+astanaorg@chronicle.rip'
 * replacePlaceholders('User <TEST_EMAIL> with password <TEST_PASSWORD>') 
 *   // Returns: 'User faris+astanaorg@chronicle.rip with password 12345'
 */
export function replacePlaceholders(value: string): string {
  let result = value;
  
  // Replace all known placeholders
  for (const [placeholder, actualValue] of Object.entries(PLACEHOLDER_MAP)) {
    result = result.replace(new RegExp(placeholder, 'g'), actualValue);
  }
  
  return result;
}

/**
 * Replace placeholders in a data table object
 * Useful for Cucumber data tables where multiple fields may contain placeholders
 * 
 * @param dataTable - Object with keys and values from Cucumber data table
 * @returns New object with all placeholder values replaced
 * 
 * @example
 * const dataTable = {
 *   email: '<TEST_EMAIL>',
 *   password: '<TEST_PASSWORD>'
 * };
 * replacePlaceholdersInObject(dataTable)
 *   // Returns: { email: 'faris+astanaorg@chronicle.rip', password: '12345' }
 */
export function replacePlaceholdersInObject(dataTable: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(dataTable)) {
    result[key] = replacePlaceholders(value);
  }
  
  return result;
}

/**
 * Get the actual test data value for a specific placeholder
 * 
 * @param placeholder - The placeholder key (e.g., 'TEST_EMAIL')
 * @returns The actual value, or the placeholder itself if not found
 * 
 * @example
 * getTestDataValue('TEST_EMAIL') // Returns: 'faris+astanaorg@chronicle.rip'
 * getTestDataValue('<TEST_EMAIL>') // Also works with angle brackets
 */
export function getTestDataValue(placeholder: string): string {
  // Ensure placeholder has angle brackets
  const key = placeholder.startsWith('<') ? placeholder : `<${placeholder}>`;
  return PLACEHOLDER_MAP[key] || placeholder;
}

/**
 * Check if a string contains any placeholders
 * 
 * @param value - String to check
 * @returns true if the string contains any placeholder pattern
 * 
 * @example
 * hasPlaceholder('<TEST_EMAIL>') // Returns: true
 * hasPlaceholder('normal text') // Returns: false
 */
export function hasPlaceholder(value: string): boolean {
  return /<TEST_[A-Z_]+>/.test(value);
}

/**
 * List all available placeholders
 * Useful for debugging or documentation
 * 
 * @returns Array of all available placeholder keys
 */
export function listAvailablePlaceholders(): string[] {
  return Object.keys(PLACEHOLDER_MAP);
}
