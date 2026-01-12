import { When, Then } from '@cucumber/cucumber';
import { IntermentPage } from '../../pages/p0/IntermentPage.js';

// Initialize page object
let intermentPage: IntermentPage;

When('I click Add Interment button', { timeout: 15000 }, async function () {
  const page = this.page;
  intermentPage = new IntermentPage(page);
  await intermentPage.clickAddIntermentButton();
});

When('I fill interment form with following details', { timeout: 60000 }, async function (dataTable: any) {
  const intermentData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  await intermentPage.fillIntermentForm(intermentData);
});

When('I save the Interment', { timeout: 40000 }, async function () {
  await intermentPage.saveInterment();
});

Then('I should see deceased {string} in the Interment tab', { timeout: 30000 }, async function (deceasedName: string) {
  await intermentPage.verifyDeceasedInTab(deceasedName);
});

Then('I should see interment type {string}', { timeout: 10000 }, async function (intermentType: string) {
  await intermentPage.verifyIntermentType(intermentType);
});

When('I add interment applicant', { timeout: 15000 }, async function () {
  await intermentPage.addIntermentApplicant();
});

When('I add next of kin', { timeout: 15000 }, async function () {
  await intermentPage.addNextOfKin();
});

When(
  'I click on Interments tab',
  { timeout: 30000 },
  async function () {
    intermentPage = new IntermentPage(this.page);
    await intermentPage.clickIntermentTab();
  }
);

When('I click Edit Interment button', { timeout: 15000 }, async function () {
  intermentPage = new IntermentPage(this.page);
  await intermentPage.clickEditIntermentButton();
});

When('I update interment form with following details', { timeout: 60000 }, async function (dataTable: any) {
  const intermentData = dataTable.rowsHash();
  await intermentPage.updateIntermentForm(intermentData);
});
