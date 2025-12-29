import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlotPage } from '../../pages/p0/PlotPage.js';
import { ROIPage } from '../../pages/p0/ROIPage.js';

// Initialize page objects
let plotPage: PlotPage;
let roiPage: ROIPage;

When('I navigate to all plots page', { timeout: 15000 }, async function () {
  const page = this.page;
  plotPage = new PlotPage(page);
  roiPage = new ROIPage(page);
  await plotPage.clickSeeAllPlots();
});

When('I open the filter dialog', async function () {
  await plotPage.openFilter();
});

When('I select vacant filter', async function () {
  await plotPage.selectVacantFilter();
});

When('I select reserved filter', async function () {
  await plotPage.selectReservedFilter();
});

When('I apply the filter plot', { timeout: 10000 }, async function () {
  await plotPage.applyFilter();
});

When('I expand section {string}', async function (section: string) {
  await plotPage.expandSection(section);
});

When('I select plot {string}', { timeout: 15000 }, async function (plotName: string) {
  await plotPage.selectPlot(plotName);
});

Then('the plot status should be {string}', { timeout: 10000 }, async function (expectedStatus: string) {
  const isCorrect = await plotPage.verifyStatusChanged(expectedStatus);
  expect(isCorrect).toBeTruthy();
});

When('I click Add ROI button', { timeout: 15000 }, async function () {
  await roiPage.clickAddRoi();
});

When('I click ROI tab', async function () {
  await roiPage.clickRoiTab();
});

When('I click Edit ROI button', { timeout: 15000 }, async function () {
  // EDIT ROI button is at bottom of plot detail page, no need to click ROI tab first
  await roiPage.clickEditRoi();
});

When('I fill ROI form with following details', { timeout: 30000 }, async function (dataTable: any) {
  const roiData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  await roiPage.fillRoiForm(roiData);
});

When('I select the first vacant plot', { timeout: 15000 }, async function () {
  const plotName = await plotPage.selectFirstVacantPlot();
  this.selectedPlotName = plotName; // Store for later reference
  // Click the plot to navigate to plot detail page
  await plotPage.page.getByText(`${plotName} Vacant`).click();
  await plotPage.page.waitForTimeout(3000);
});

When('I select the first reserved plot', { timeout: 15000 }, async function () {
  const plotName = await plotPage.selectFirstReservedPlot();
  this.selectedPlotName = plotName; // Store for later reference
});

When('I add ROI holder person with following details', { timeout: 15000 }, async function (dataTable: any) {
  const holderData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  await roiPage.addRoiHolderPerson(holderData);
});

When('I add ROI applicant person with following details', { timeout: 15000 }, async function (dataTable: any) {
  const applicantData = dataTable.rowsHash(); // For vertical tables with key-value pairs
  await roiPage.addRoiApplicantPerson(applicantData);
});

When('I save the ROI', { timeout: 35000 }, async function () {
  await roiPage.saveRoi();
});

Then('I should see ROI holder {string} in the ROI tab', { timeout: 15000 }, async function (holderName: string) {
  const isVisible = await roiPage.verifyRoiPerson(holderName, 'holder');
  if (!isVisible) {
    throw new Error(`❌ Verification failed: ROI holder "${holderName}" not found or label "ROI HOLDER" missing. Check logs above for details.`);
  }
});

Then('I should see ROI applicant {string} in the ROI tab', { timeout: 15000 }, async function (applicantName: string) {
  const isVisible = await roiPage.verifyRoiPerson(applicantName, 'applicant');
  if (!isVisible) {
    throw new Error(`❌ Verification failed: ROI applicant "${applicantName}" not found or label "ROI APPLICANT" missing. Check logs above for details.`);
  }
});

Then('I should see both ROI holder {string} and applicant {string}', { timeout: 15000 }, async function (holderName: string, applicantName: string) {
  const isVisible = await roiPage.verifyRoiHolderAndApplicant(holderName, applicantName);
  if (!isVisible) {
    throw new Error(`❌ Verification failed: Either holder "${holderName}" or applicant "${applicantName}" not found with correct labels. Check logs above for details.`);
  }
});
