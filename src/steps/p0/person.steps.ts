import { When, Then } from '@cucumber/cucumber';
import { PersonPage } from '../../pages/p0/PersonPage.js';
import { replacePlaceholdersInObject, replacePlaceholders } from '../../utils/TestDataHelper.js';

// Initialize page object
let personPage: PersonPage;

When('I navigate to the advance table page', { timeout: 15000 }, async function () {
  const page = this.page;
  personPage = new PersonPage(page);
  
  // Navigate to advance table page - use full URL
  const baseUrl = page.url().split('/customer-organization')[0]; // Get base URL from current page
  await page.goto(`${baseUrl}/customer-organization/advance-table?tab=plots`);
  await page.waitForLoadState('networkidle');
});

When('I click on the PERSONS tab', { timeout: 45000 }, async function () {
  await personPage.navigateToPersonTab();
});

When('I click the add person button', { timeout: 15000 }, async function () {
  await personPage.clickAddPerson();
});

When('I fill in the person form with:', { timeout: 60000 }, async function (dataTable: any) {
  const personData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  const actualData = replacePlaceholdersInObject(personData);
  await personPage.fillPersonForm(actualData as any);
});

When('I click the save button', { timeout: 60000 }, async function () {
  await personPage.clickSave();
});

Then('I should see the person {string} in the first row of the table', { timeout: 45000 }, async function (personName: string) {
  const actualName = replacePlaceholders(personName);
  await personPage.verifyPersonInFirstRow(actualName);
});

// Filter steps
When('I click the filter button', { timeout: 15000 }, async function () {
  await personPage.clickFilterButton();
});

When('I fill in the filter form with first name {string} and last name {string}', { timeout: 15000 }, async function (firstName: string, lastName: string) {
  const actualFirstName = replacePlaceholders(firstName);
  const actualLastName = replacePlaceholders(lastName);
  await personPage.fillFilterForm(actualFirstName, actualLastName);
});

When('I apply the filter', { timeout: 15000 }, async function () {
  await personPage.applyFilter();
});

// Edit steps
When('I click the first row to open person details', { timeout: 15000 }, async function () {
  await personPage.clickFirstRow();
});

When('I click the edit button', { timeout: 15000 }, async function () {
  await personPage.clickEditButton();
});

When('I edit the last name to {string}', { timeout: 15000 }, async function (newLastName: string) {
  const actualLastName = replacePlaceholders(newLastName);
  await personPage.editPersonLastName(actualLastName);
});

// Delete steps
When('I click the delete button', { timeout: 15000 }, async function () {
  await personPage.clickDelete();
});

When('I confirm the deletion', { timeout: 60000 }, async function () {
  await personPage.confirmDelete();
});

Then('the person {string} should not be in the list', { timeout: 20000 }, async function (personName: string) {
  const actualName = replacePlaceholders(personName);
  await personPage.verifyPersonNotInList(actualName);
});
