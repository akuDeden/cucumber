import { When, Then, Before, After } from '@cucumber/cucumber';
import { PersonPage } from '../../pages/p0/PersonPage.js';
import { replacePlaceholdersInObject, replacePlaceholders } from '../../utils/TestDataHelper.js';
import { randomFirstName, randomLastName, PERSON_DATA } from '../../data/test-data.js';

// Initialize page object
let personPage: PersonPage;

// Store random person data (shared across all scenarios in the feature)
interface RandomPersonData {
  firstName: string;
  lastName: string;
  editedLastName: string;
  middleName: string;
  title: string;
  gender: string;
  phoneM: string;
  phoneH: string;
  phoneO: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postCode: string;
  note: string;
}

let randomPersonData: RandomPersonData;
let isRandomDataGenerated = false;

// Generate random person data once before the first scenario
Before({ tags: '@person' }, async function () {
  if (!isRandomDataGenerated) {
    const randomFirst = randomFirstName();
    const randomLast = randomLastName();
    const randomEditedLast = randomLastName();

    randomPersonData = {
      firstName: randomFirst,
      lastName: randomLast,
      editedLastName: randomEditedLast,
      middleName: PERSON_DATA.add.middleName,
      title: PERSON_DATA.add.title,
      gender: PERSON_DATA.add.gender,
      phoneM: PERSON_DATA.add.phoneM,
      phoneH: PERSON_DATA.add.phoneH,
      phoneO: PERSON_DATA.add.phoneO,
      email: PERSON_DATA.add.email.replace('michael.johnson', `${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}`),
      address: PERSON_DATA.add.address,
      city: PERSON_DATA.add.city,
      state: PERSON_DATA.add.state,
      country: PERSON_DATA.add.country,
      postCode: PERSON_DATA.add.postCode,
      note: PERSON_DATA.add.note
    };

    isRandomDataGenerated = true;
    console.log(`Generated random person for all scenarios: ${randomPersonData.firstName} ${randomPersonData.lastName} (edited: ${randomPersonData.editedLastName})`);
  }
});

When('I navigate to the advance table page', { timeout: 15000 }, async function () {
  const page = this.page;
  personPage = new PersonPage(page);

  // Navigate to advance table page - use full URL
  const baseUrl = page.url().split('/customer-organization')[0]; // Get base URL from current page
  await page.goto(`${baseUrl}/customer-organization/advance-table?tab=plots`);

  // Wait for page to load - use domcontentloaded with fallback networkidle
  await page.waitForLoadState('domcontentloaded');
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    // Network still active but page is usable
  }
});

When('I click on the PERSONS tab', { timeout: 45000 }, async function () {
  await personPage.navigateToPersonTab();
});

When('I click the add person button', { timeout: 15000 }, async function () {
  await personPage.clickAddPerson();
});

When('I fill in the person form with:', { timeout: 60000 }, async function (dataTable: any) {
  const personData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  let actualData = replacePlaceholdersInObject(personData);

  // Override with random data if using test placeholders
  if (actualData.firstName === '<TEST_PERSON_FIRSTNAME>' || actualData.firstName === PERSON_DATA.add.firstName) {
    actualData = { ...actualData, ...randomPersonData };
  }

  await personPage.fillPersonForm(actualData as any);
});

When('I click the save button', { timeout: 60000 }, async function () {
  await personPage.clickSave();
});

Then('I should see the person {string} in the first row of the table', { timeout: 45000 }, async function (personName: string) {
  // Check if original placeholder is being used
  const usesPlaceholder = personName.includes('<TEST_PERSON_');

  let actualName = usesPlaceholder
    ? personName.replace('<TEST_PERSON_FIRSTNAME>', randomPersonData.firstName)
                .replace('<TEST_PERSON_LASTNAME>', randomPersonData.lastName)
                .replace('<TEST_PERSON_LASTNAME_EDITED>', randomPersonData.editedLastName)
    : replacePlaceholders(personName);

  // Parse full name into first and last name
  // Expected format: "FirstName LastName" or "FirstName MiddleName LastName"
  const nameParts = actualName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  if (!firstName || !lastName) {
    throw new Error(`Cannot parse first and last name from "${actualName}". Expected format: "FirstName LastName"`);
  }

  // Use the new search-based verification approach
  await personPage.searchAndVerifyPersonInFirstRow(firstName, lastName);
});

Then('I should see the person with first name {string} and last name {string} in the first row after filter', { timeout: 45000 }, async function (firstName: string, lastName: string) {
  const usesPlaceholder = firstName.includes('<TEST_PERSON_') || lastName.includes('<TEST_PERSON_');

  let actualFirstName = usesPlaceholder && firstName.includes('<TEST_PERSON_')
    ? firstName.replace('<TEST_PERSON_FIRSTNAME>', randomPersonData.firstName)
                .replace('<TEST_PERSON_LASTNAME>', randomPersonData.lastName)
                .replace('<TEST_PERSON_LASTNAME_EDITED>', randomPersonData.editedLastName)
    : replacePlaceholders(firstName);

  let actualLastName = usesPlaceholder && lastName.includes('<TEST_PERSON_')
    ? lastName.replace('<TEST_PERSON_FIRSTNAME>', randomPersonData.firstName)
              .replace('<TEST_PERSON_LASTNAME>', randomPersonData.lastName)
              .replace('<TEST_PERSON_LASTNAME_EDITED>', randomPersonData.editedLastName)
    : replacePlaceholders(lastName);

  // Handle edited last name
  if (lastName.includes('EDITED')) {
    actualLastName = randomPersonData.editedLastName;
  }

  // Use the new search-based verification approach
  await personPage.searchAndVerifyPersonInFirstRow(actualFirstName, actualLastName);
});

// Filter steps
When('I click the filter button', { timeout: 15000 }, async function () {
  await personPage.clickFilterButton();
});

When('I fill in the filter form with first name {string} and last name {string}', { timeout: 15000 }, async function (firstName: string, lastName: string) {
  const usesPlaceholder = firstName.includes('<TEST_PERSON_') || lastName.includes('<TEST_PERSON_');

  let actualFirstName = usesPlaceholder && firstName.includes('<TEST_PERSON_')
    ? firstName.replace('<TEST_PERSON_FIRSTNAME>', randomPersonData.firstName)
                .replace('<TEST_PERSON_LASTNAME>', randomPersonData.lastName)
                .replace('<TEST_PERSON_LASTNAME_EDITED>', randomPersonData.editedLastName)
    : replacePlaceholders(firstName);

  let actualLastName = usesPlaceholder && lastName.includes('<TEST_PERSON_')
    ? lastName.replace('<TEST_PERSON_FIRSTNAME>', randomPersonData.firstName)
              .replace('<TEST_PERSON_LASTNAME>', randomPersonData.lastName)
              .replace('<TEST_PERSON_LASTNAME_EDITED>', randomPersonData.editedLastName)
    : replacePlaceholders(lastName);

  // Handle edited last name
  if (lastName.includes('EDITED')) {
    actualLastName = randomPersonData.editedLastName;
  }

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
  const usesPlaceholder = newLastName.includes('<TEST_PERSON_');

  let actualLastName = usesPlaceholder
    ? newLastName.replace('<TEST_PERSON_LASTNAME_EDITED>', randomPersonData.editedLastName)
    : replacePlaceholders(newLastName);

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
  const usesPlaceholder = personName.includes('<TEST_PERSON_');

  let actualName = usesPlaceholder
    ? personName.replace('<TEST_PERSON_FIRSTNAME>', randomPersonData.firstName)
                  .replace('<TEST_PERSON_LASTNAME>', randomPersonData.lastName)
                  .replace('<TEST_PERSON_LASTNAME_EDITED>', randomPersonData.editedLastName)
    : replacePlaceholders(personName);

  await personPage.verifyPersonNotInList(actualName);
});
