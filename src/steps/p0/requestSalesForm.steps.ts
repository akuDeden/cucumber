import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { RequestSalesFormPage } from '../../pages/p0/RequestSalesFormPage.js';
import { REQUEST_SALES_FORM_DATA } from '../../data/test-data.js';

let requestSalesFormPage: RequestSalesFormPage;
let selectedPlotName: string;

// ============================================
// NAVIGATION STEPS
// ============================================

Given('I am on the sell plots page for {string}', { timeout: 30000 }, async function (cemeteryName: string) {
  requestSalesFormPage = new RequestSalesFormPage(this.page);
  await requestSalesFormPage.navigateToSellPlotsPage();
});

// ============================================
// PLOT SELECTION STEPS
// ============================================

When('I expand the first section in sell plots page', async function () {
  const sectionName = REQUEST_SALES_FORM_DATA.plot.section;
  await requestSalesFormPage.expandSection(sectionName);
});

When('I find a plot with purchase option available', { timeout: 60000 }, async function () {
  selectedPlotName = await requestSalesFormPage.findPlotWithPurchaseOption();
});

Then('I should see a Request to Buy button on the plot details page', async function () {
  const isVisible = await requestSalesFormPage.verifyRequestToBuyButtonVisible();
  expect(isVisible).toBe(true);
});

// ============================================
// REQUEST TO BUY FLOW STEPS
// ============================================

When('I click the Request to Buy button', { timeout: 30000 }, async function () {
  // Pass the selected plot name to re-navigate and clear history
  await requestSalesFormPage.clickRequestToBuy(selectedPlotName);
});

When('I select Pre-need plot purchase option', { timeout: 30000 }, async function () {
  await requestSalesFormPage.selectPreNeedPurchase();
});

When('I select At-need plot purchase option', { timeout: 30000 }, async function () {
  await requestSalesFormPage.selectAtNeedPurchase();
});

// ============================================
// FORM VALIDATION STEPS
// ============================================

Then('I should be on the request form page', async function () {
  const currentUrl = this.page.url();
  expect(currentUrl).toMatch(/\/purchase\/(Pre-need|At-need)/);
});

Then('the plot name and cemetery should match on the form', async function () {
  await requestSalesFormPage.validateFormSummary(
    selectedPlotName,
    REQUEST_SALES_FORM_DATA.cemetery.name
  );
});

// ============================================
// FORM FILLING STEPS
// ============================================

When('I continue from the description section', async function () {
  await requestSalesFormPage.continueDescriptionSection();
});

When('I fill the ROI Applicant form with valid data', async function () {
  await requestSalesFormPage.fillROIApplicantForm();
});

When('I continue from the ROI Applicant section', async function () {
  await requestSalesFormPage.continueROIApplicantSection();
});

When('I fill the At-need Interment Details form with valid data', async function () {
  await requestSalesFormPage.fillIntermentDetailsForm();
});

When('I continue from the Interment Details section', async function () {
  await requestSalesFormPage.continueIntermentDetailsSection();
});

When('I fill the ROI form with valid data', { timeout: 10000 }, async function () {
  await requestSalesFormPage.fillROIForm();
});

When('I continue from the ROI section', async function () {
  await requestSalesFormPage.continueROISection();
});

When('I agree to the terms and conditions', { timeout: 15000 }, async function () {
  await requestSalesFormPage.agreeToTerms();
});

When('I continue from the terms section', async function () {
  await requestSalesFormPage.continueTermsSection();
});

When('I add a signature', async function () {
  await requestSalesFormPage.addSignature();
});

When('I continue from the signature section', async function () {
  await requestSalesFormPage.continueSignatureSection();
});

// ============================================
// FORM SUBMISSION STEPS
// ============================================

When('I submit the request form', { timeout: 30000 }, async function () {
  await requestSalesFormPage.submitRequest();
});

// ============================================
// CONFIRMATION VALIDATION STEPS
// ============================================

Then('I should see a confirmation dialog', { timeout: 15000 }, async function () {
  const isVisible = await requestSalesFormPage.verifyConfirmationDialog();
  expect(isVisible).toBe(true);
});

Then('the confirmation should show that the request was sent successfully', async function () {
  const hasSuccessMessage = await requestSalesFormPage.verifySuccessMessage();
  expect(hasSuccessMessage).toBe(true);
});

// ============================================
// AT-NEED SPECIFIC STEPS (DO NOT USE FOR PRE-NEED)
// ============================================

When('I fill the ROI Applicant form with valid data for At-need', async function () {
  await requestSalesFormPage.fillROIApplicantFormAtNeed();
});

When('I fill the ROI Holder form with valid data for At-need', async function () {
  await requestSalesFormPage.fillROIHolderFormAtNeed();
});

When('I continue from the ROI Holder section for At-need', async function () {
  await requestSalesFormPage.continueROIHolderSectionAtNeed();
});

When('I fill the Deceased form with valid data for At-need', async function () {
  await requestSalesFormPage.fillDeceasedFormAtNeed();
});

When('I continue from the Deceased section for At-need', async function () {
  await requestSalesFormPage.continueDeceasedSectionAtNeed();
});

When('I fill the Event Service form with valid data for At-need', async function () {
  await requestSalesFormPage.fillEventServiceFormAtNeed();
});

When('I continue from the Event Service section for At-need', async function () {
  await requestSalesFormPage.continueEventServiceSectionAtNeed();
});

