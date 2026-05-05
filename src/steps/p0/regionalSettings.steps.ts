import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { RegionalSettingsPage, RegionalLabels } from '../../pages/p0/RegionalSettingsPage.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';

let regionalPage: RegionalSettingsPage;
let expectedLabels: RegionalLabels = {};

When('I navigate to My Organisation Regional Settings', { timeout: 30000 }, async function () {
  regionalPage = new RegionalSettingsPage(this.page);
  await regionalPage.navigateToRegionalSettings();
});

When('I update the regional settings labels with following values', { timeout: 60000 }, async function (dataTable) {
  const rows: Record<string, string> = dataTable.rowsHash();
  expectedLabels = {
    plot:             rows['plot'],
    plots:            rows['plots'],
    forSale:          rows['forSale'],
    reserved:         rows['reserved'],
    roi:              rows['roi'],
    rois:             rows['rois'],
    roiHolder:        rows['roiHolder'],
    roiApplicant:     rows['roiApplicant'],
    rightOfInterment: rows['rightOfInterment'],
  };
  // Remove undefined keys
  Object.keys(expectedLabels).forEach(k => {
    if ((expectedLabels as any)[k] === undefined) delete (expectedLabels as any)[k];
  });
  await regionalPage.updateLabels(expectedLabels);
});

When('I save the regional settings', { timeout: 20000 }, async function () {
  await regionalPage.save();
});

Then('the regional settings labels should be updated successfully', { timeout: 15000 }, async function () {
  const current = await regionalPage.getCurrentLabels();
  for (const [key, value] of Object.entries(expectedLabels)) {
    expect((current as any)[key]).toBe(value);
  }
});

Then('the labels should persist after page reload', { timeout: 20000 }, async function () {
  await this.page.reload({ waitUntil: 'domcontentloaded' });
  await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
  await this.page.locator('[data-testid="regional-setting-input-plot"]').waitFor({ state: 'visible', timeout: 10000 });

  const current = await regionalPage.getCurrentLabels();
  for (const [key, value] of Object.entries(expectedLabels)) {
    expect((current as any)[key]).toBe(value);
  }
});
