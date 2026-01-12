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

When('I click on the PERSONS tab', { timeout: 15000 }, async function () {
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

When('I click the save button', { timeout: 30000 }, async function () {
  await personPage.clickSave();
});

Then('I should see the person {string} in the first row of the table', { timeout: 45000 }, async function (personName: string) {
  const actualName = replacePlaceholders(personName);
  await personPage.verifyPersonInFirstRow(actualName);
});
