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
  // Advanced Search data (minimal - most now in Scenario Outline)
  '<TEST_ADVANCE_PLOT_ID>': TEST_DATA.advanceSearch.plotId,
  '<TEST_ADVANCE_PLOT_TYPE>': TEST_DATA.advanceSearch.plotType,
  '<TEST_ADVANCE_STATUS>': TEST_DATA.advanceSearch.status,

  // Search Box data
  '<TEST_SEARCH_ROI_HOLDER_NAME>': TEST_DATA.search.roiHolder.searchName,
  '<TEST_SEARCH_ROI_HOLDER_DISPLAY>': TEST_DATA.search.roiHolder.displayName,
  '<TEST_SEARCH_PLOT_ID>': TEST_DATA.search.roiHolder.plotId,

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

  // ROI Certificate numbers for different scenarios
  '<TEST_ROI_CERT_2>': TEST_DATA.roi.certificates.withPerson,
  '<TEST_ROI_CERT_APPLICANT>': TEST_DATA.roi.certificates.applicant,
  '<TEST_ROI_CERT_BOTH>': TEST_DATA.roi.certificates.both,

  // ROI Holder data
  '<TEST_ROI_HOLDER_FIRSTNAME>': TEST_DATA.roi.holder.firstName,
  '<TEST_ROI_HOLDER_LASTNAME>': TEST_DATA.roi.holder.lastName,
  '<TEST_ROI_HOLDER_PHONE>': TEST_DATA.roi.holder.phone,
  '<TEST_ROI_HOLDER_EMAIL>': TEST_DATA.roi.holder.email,

  // ROI Applicant data
  '<TEST_ROI_APPLICANT_FIRSTNAME>': TEST_DATA.roi.applicant.firstName,
  '<TEST_ROI_APPLICANT_LASTNAME>': TEST_DATA.roi.applicant.lastName,
  '<TEST_ROI_APPLICANT_PHONE>': TEST_DATA.roi.applicant.phone,
  '<TEST_ROI_APPLICANT_EMAIL>': TEST_DATA.roi.applicant.email,

  // Person data - Add
  '<TEST_PERSON_FIRSTNAME>': TEST_DATA.person.add.firstName,
  '<TEST_PERSON_LASTNAME>': TEST_DATA.person.add.lastName,
  '<TEST_PERSON_MIDDLENAME>': TEST_DATA.person.add.middleName,
  '<TEST_PERSON_TITLE>': TEST_DATA.person.add.title,
  '<TEST_PERSON_GENDER>': TEST_DATA.person.add.gender,
  '<TEST_PERSON_PHONE_M>': TEST_DATA.person.add.phoneM,
  '<TEST_PERSON_PHONE_H>': TEST_DATA.person.add.phoneH,
  '<TEST_PERSON_PHONE_O>': TEST_DATA.person.add.phoneO,
  '<TEST_PERSON_EMAIL>': TEST_DATA.person.add.email,
  '<TEST_PERSON_ADDRESS>': TEST_DATA.person.add.address,
  '<TEST_PERSON_CITY>': TEST_DATA.person.add.city,
  '<TEST_PERSON_STATE>': TEST_DATA.person.add.state,
  '<TEST_PERSON_COUNTRY>': TEST_DATA.person.add.country,
  '<TEST_PERSON_POSTCODE>': TEST_DATA.person.add.postCode,
  '<TEST_PERSON_NOTE>': TEST_DATA.person.add.note,
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
