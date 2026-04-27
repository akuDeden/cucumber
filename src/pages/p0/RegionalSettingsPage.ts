import { Page } from '@playwright/test';
import { RegionalSettingsSelectors, RegionalSettingsUrls } from '../../selectors/p0/regional-settings/regional-settings.selectors.js';
import { Logger } from '../../utils/Logger.js';
import { getCustomerOrgBaseUrl } from '../../data/test-data.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';

export interface RegionalLabels {
  plot?: string;
  plots?: string;
  forSale?: string;
  reserved?: string;
  roi?: string;
  rois?: string;
  roiHolder?: string;
  roiApplicant?: string;
  rightOfInterment?: string;
}

export class RegionalSettingsPage {
  readonly page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('RegionalSettingsPage');
  }

  async navigateToRegionalSettings(): Promise<void> {
    this.logger.info('Opening cemetery dropdown');
    const dropdownBtn = this.page.getByRole('button', { name: /@/ }).first();
    await dropdownBtn.waitFor({ state: 'visible', timeout: 15000 });
    await dropdownBtn.click();

    this.logger.info('Clicking My organisation');
    const myOrgItem = this.page.locator(RegionalSettingsSelectors.myOrganisationMenuItem);
    await myOrgItem.waitFor({ state: 'visible', timeout: 8000 });
    await myOrgItem.click();

    await this.page.waitForURL(`**${RegionalSettingsUrls.orgSettings}**`, { timeout: 15000 });
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);

    this.logger.info('Clicking Regional Settings tab');
    const regionalTab = this.page.locator(RegionalSettingsSelectors.regionalSettingsTab).first();
    await regionalTab.waitFor({ state: 'visible', timeout: 8000 });
    await regionalTab.click();

    await this.page.locator(RegionalSettingsSelectors.plotInput).waitFor({ state: 'visible', timeout: 10000 });
    this.logger.success('On Regional Settings page');
  }

  async updateLabels(labels: RegionalLabels): Promise<void> {
    const fieldMap: Array<{ key: keyof RegionalLabels; selector: string }> = [
      { key: 'plot',             selector: RegionalSettingsSelectors.plotInput },
      { key: 'plots',            selector: RegionalSettingsSelectors.plotsInput },
      { key: 'forSale',          selector: RegionalSettingsSelectors.forSaleInput },
      { key: 'reserved',         selector: RegionalSettingsSelectors.reservedInput },
      { key: 'roi',              selector: RegionalSettingsSelectors.roiInput },
      { key: 'rois',             selector: RegionalSettingsSelectors.roisInput },
      { key: 'roiHolder',        selector: RegionalSettingsSelectors.roiHolderInput },
      { key: 'roiApplicant',     selector: RegionalSettingsSelectors.roiApplicantInput },
      { key: 'rightOfInterment', selector: RegionalSettingsSelectors.rightOfIntermentInput },
    ];

    for (const { key, selector } of fieldMap) {
      if (labels[key] === undefined) continue;
      const el = this.page.locator(selector);
      await el.waitFor({ state: 'visible', timeout: 5000 });
      await el.focus();
      await el.selectText();
      await el.pressSequentially(labels[key]!, { delay: 40 });
      await this.page.waitForTimeout(80);
      this.logger.info(`Set ${key} = ${labels[key]}`);
    }
  }

  async save(): Promise<void> {
    this.logger.info('Saving regional settings');
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(200);

    const saveBtn = this.page.locator(RegionalSettingsSelectors.saveButton);
    await saveBtn.waitFor({ state: 'visible', timeout: 8000 });

    const baseUrl = getCustomerOrgBaseUrl();
    const orgPattern = `${baseUrl}/api/v1/organization`;

    const saveResponse = this.page.waitForResponse(
      r => r.url().includes('/api/v1/organization') && r.request().method() !== 'GET',
      { timeout: 15000 }
    );
    await saveBtn.click({ force: true });
    const resp = await saveResponse;

    if (!resp.ok()) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(`Save failed with status ${resp.status()}: ${JSON.stringify(body).substring(0, 200)}`);
    }
    this.logger.success(`Saved regional settings — status ${resp.status()}`);
  }

  async getFieldValue(selector: string): Promise<string> {
    return this.page.locator(selector).inputValue();
  }

  async getCurrentLabels(): Promise<RegionalLabels> {
    return {
      plot:             await this.getFieldValue(RegionalSettingsSelectors.plotInput),
      plots:            await this.getFieldValue(RegionalSettingsSelectors.plotsInput),
      forSale:          await this.getFieldValue(RegionalSettingsSelectors.forSaleInput),
      reserved:         await this.getFieldValue(RegionalSettingsSelectors.reservedInput),
      roi:              await this.getFieldValue(RegionalSettingsSelectors.roiInput),
      rois:             await this.getFieldValue(RegionalSettingsSelectors.roisInput),
      roiHolder:        await this.getFieldValue(RegionalSettingsSelectors.roiHolderInput),
      roiApplicant:     await this.getFieldValue(RegionalSettingsSelectors.roiApplicantInput),
      rightOfInterment: await this.getFieldValue(RegionalSettingsSelectors.rightOfIntermentInput),
    };
  }
}
