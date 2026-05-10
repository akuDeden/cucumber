import path from 'path';
import { Page, expect } from '@playwright/test';
import { BasePage } from '../../core/BasePage.js';
import { ImportSelectors, ImportUrls } from '../../selectors/p1/import/index.js';
import { NetworkHelper } from '../../utils/NetworkHelper.js';
import { Logger } from '../../utils/Logger.js';

/**
 * Page Object for Cemetery Import Page
 * Handles navigation to import page and file upload interactions
 */
export class ImportPage extends BasePage {
  private logger: Logger;

  constructor(page: Page) {
    super(page);
    this.logger = new Logger('ImportPage');
  }

  /**
   * Click "More" button on cemetery admin page to open menu
   * The "More" element is a <cl-cemetery-action-wrapper> (Angular component), not a standard button
   */
  async clickMoreButton(): Promise<void> {
    this.logger.info('Clicking More button');

    const moreButton = this.page.locator(ImportSelectors.moreButton);
    await moreButton.waitFor({ state: 'visible' });
    await moreButton.click();

    this.logger.success('More menu opened');
  }

  /**
   * Delete all server-side staged files via the import API.
   *
   * Staged files persist across test runs and survive "Wipe data" — only the DB is cleared,
   * not the upload queue. This method uses direct API calls to avoid Angular UI race conditions.
   *
   * Flow:
   *   1. Read Bearer token from page localStorage (set during login)
   *   2. GET /api/v1/cemetery/{slug}/import/files/ to list all staged files
   *   3. DELETE each file by id
   *
   * Can be called from any page — does not require navigating to the import page first.
   */
  private async deleteAllStagedFilesViaApi(): Promise<void> {
    this.logger.info('Checking for staged files to delete via API...');

    // Read Bearer token from the page's localStorage (written by Angular app after login)
    const token = await this.page.evaluate(() =>
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access') ||
      localStorage.getItem('token')
    );

    if (!token) {
      this.logger.warn('No Bearer token in localStorage — skipping API staged-file deletion');
      return;
    }

    // Derive base URL and cemetery slug from current page URL
    // Pattern: https://{env}-{region}.chronicle.rip/chronicle-admin/{cemetery_slug}/...
    const currentUrl = this.page.url();
    const baseUrl = new URL(currentUrl).origin;
    const slugMatch = currentUrl.match(/chronicle-admin\/([^/?#]+)/);

    if (!slugMatch) {
      this.logger.warn(`Cannot extract cemetery slug from URL (${currentUrl}) — skipping`);
      return;
    }

    const cemeterySlug = slugMatch[1];
    const filesEndpoint = `${baseUrl}/api/v1/cemetery/${cemeterySlug}/import/files/`;

    this.logger.info(`GET ${filesEndpoint}`);
    const listResp = await this.page.request.get(filesEndpoint, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });

    if (!listResp.ok()) {
      this.logger.warn(`GET /import/files/ returned ${listResp.status()} — skipping deletion`);
      return;
    }

    const files: Array<{ id?: number; pk?: number; file_name?: string; filename?: string; name?: string }> =
      await listResp.json();

    if (!Array.isArray(files) || files.length === 0) {
      this.logger.info('No staged files found via API');
      return;
    }

    this.logger.info(`Found ${files.length} staged file(s) — deleting via API`);

    for (const file of files) {
      const fileId = file.id ?? file.pk;
      if (fileId == null) {
        this.logger.warn(`Skipping file with no id: ${JSON.stringify(file)}`);
        continue;
      }

      const label = file.file_name || file.filename || file.name || String(fileId);
      const deleteUrl = `${baseUrl}/api/v1/cemetery/${cemeterySlug}/import/files/${fileId}/`;
      const delResp = await this.page.request.delete(deleteUrl, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      if (delResp.ok() || delResp.status() === 204) {
        this.logger.success(`Deleted staged file: ${label} (id=${fileId})`);
      } else {
        this.logger.warn(`Failed to delete ${label} (id=${fileId}): HTTP ${delResp.status()}`);
      }
    }

    this.logger.success('API staged-file deletion complete');
  }

  /**
   * Click "Import" option from the More menu
   */
  async clickImportMenuItem(): Promise<void> {
    this.logger.info('Clicking Import menu item');

    const importOption = this.page.getByRole('menuitem', { name: /import/i });
    await importOption.waitFor({ state: 'visible' });
    await importOption.click();

    this.logger.success('Import menu item clicked');
  }

  /**
   * Navigate to import page via More > Import
   */
  async navigateToImportPage(): Promise<void> {
    this.logger.info('Navigating to Import page via More menu');

    await this.clickMoreButton();
    await this.clickImportMenuItem();

    // Wait for URL change to import page
    await this.page.waitForURL(`**${ImportUrls.importDataPage}`, {
      waitUntil: 'domcontentloaded'
    });

    // Wait for import page data to fully load (API calls for categories)
    await NetworkHelper.waitForApiRequestsComplete(this.page, 8000);

    this.logger.success('Navigated to Import page');
  }

  /**
   * Verify we are on the import page
   */
  async verifyOnImportPage(): Promise<void> {
    this.logger.info('Verifying we are on the Import page');

    await this.page.waitForURL(`**${ImportUrls.importDataPage}`, {
      waitUntil: 'domcontentloaded'
    });

    // Wait for import page title
    const title = this.page.locator(ImportSelectors.importPageTitle);
    await title.waitFor({ state: 'visible' });

    this.logger.success('Verified on Import page');
  }

  /**
   * Get all visible data categories with their counts
   * Uses locator-based approach for better Angular compatibility
   */
  async getImportCategories(): Promise<{ name: string; count: string }[]> {
    this.logger.info('Getting import categories');

    const categories = ['Sections', 'Plots', 'Persons', 'ROIs', 'Interments', 'Stories', 'Events', 'LOT', 'Notes', 'Invoices'];
    const results: { name: string; count: string }[] = [];

    for (const category of categories) {
      try {
        // Find h3 with exact text, then get next sibling h4
        const heading = this.page.locator(`h3`).filter({ hasText: category }).first();
        const isVisible = await heading.isVisible({ timeout: 5000 });
        if (!isVisible) continue;

        // Get count from adjacent h4 (or any sibling) using evaluate
        const count = await heading.evaluate((el) => {
          const next = el.nextElementSibling;
          if (next && next.tagName === 'H4') return next.textContent?.trim();
          // Some categories may not have a count sibling
          return '';
        });

        // Add category to results even when count is empty — test only checks existence
        results.push({ name: category, count: count ?? '' });
      } catch {
        // Category not visible, skip
      }
    }

    this.logger.info(`Found ${results.length} categories`);
    return results;
  }

  /**
   * Verify specific category count
   */
  async verifyCategoryCount(category: string, expectedCount: number | string): Promise<void> {
    this.logger.info(`Verifying ${category} count: ${expectedCount}`);

    const heading = this.page.locator(`h3`).filter({ hasText: category }).first();
    await heading.waitFor({ state: 'visible' });

    const actualCount = await heading.evaluate((el) => {
      const next = el.nextElementSibling;
      if (next && next.tagName === 'H4') return next.textContent?.trim();
      return null;
    });

    expect(actualCount).toBe(String(expectedCount));
    this.logger.success(`${category} count verified: ${actualCount}`);
  }

  /**
   * Click "Back to the Cemetery" button
   */
  async clickBackToCemetery(): Promise<void> {
    this.logger.info('Clicking Back to the Cemetery button');

    const backBtn = this.page.locator(ImportSelectors.backToCemeteryButton);
    await backBtn.waitFor({ state: 'visible' });
    await backBtn.click();

    // Wait for navigation away from import page
    await this.page.waitForURL(url => !url.pathname.includes(ImportUrls.importDataPage), {
      waitUntil: 'domcontentloaded'
    });

    this.logger.success('Navigated back to cemetery page');
  }

  /**
   * Click "Wipe data" and confirm in the confirmation dialog.
   *
   * Dialog title: "Сlear Cemetery database"
   * Confirmation text: "yes, wipe all data"
   * Cancel text: "cancel & keep"
   *
   * Confirmed testids from playwright-cli debug:
   *   - wipeDataButton: [data-testid="toolbar-manage-button-wipe-data"]
   *   - cancelButton:   [data-testid="confirmation-dialog-button-cancel"]
   *   - confirmButton:  [data-testid="confirmation-dialog-button-confirm"]
   */
  async clickWipeDataAndConfirm(): Promise<void> {
    this.logger.info('Clicking Wipe data button');

    const wipeBtn = this.page.locator(ImportSelectors.wipeDataButton);
    await wipeBtn.waitFor({ state: 'visible' });
    await wipeBtn.click();

    // Wait for confirmation dialog
    const confirmBtn = this.page.locator(ImportSelectors.wipeDialogConfirmButton);
    await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });

    this.logger.info('Confirming wipe — clicking "yes, wipe all data"');
    await confirmBtn.click();

    // Wait for wipe API to complete before proceeding to upload
    await NetworkHelper.waitForApiRequestsComplete(this.page, 15000);

    // Delete server-side staged files via API (no UI navigation needed).
    // Staged files survive "Wipe data" — the wipe only clears DB records, not the upload queue.
    await this.deleteAllStagedFilesViaApi();

    // Reload the import page so Angular re-renders with clean state (no stale staged-file DOM).
    // Without this, section items still show old h6 file names and the drag container
    // click does not trigger the native file chooser for new uploads.
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await NetworkHelper.waitForApiRequestsComplete(this.page, 8000);

    this.logger.success('Wipe data completed and staged files cleared');
  }

  /**
   * Click the Import button and confirm the confirmation dialog that appears.
   *
   * Flow:
   *   1. Click the main "Import" button (toolbar)
   *   2. "Confirm data import" dialog appears — click "IMPORT" to confirm
   *   3. After confirmation, the app automatically navigates away from the import page
   *      to the cemetery admin page where the import progress is shown in the sidebar.
   */
  async clickImportButton(): Promise<void> {
    this.logger.info('Clicking Import button');

    const importBtn = this.page.locator(ImportSelectors.importButton).first();
    await importBtn.waitFor({ state: 'visible' });
    await importBtn.click();

    // A confirmation dialog appears: "Confirm data import — CANCEL / IMPORT"
    const confirmBtn = this.page.locator(ImportSelectors.importConfirmButton);
    await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
    this.logger.info('Confirming import dialog');
    await confirmBtn.click();

    // After confirmation the app redirects to the cemetery admin page automatically.
    await this.page.waitForURL(
      url => !url.pathname.includes(ImportUrls.importDataPage),
      { waitUntil: 'domcontentloaded', timeout: 15000 }
    );

    await NetworkHelper.waitForApiRequestsComplete(this.page, 10000);
    this.logger.success('Import submitted — redirected to cemetery admin page');
  }

  /**
   * Poll the import status API until the job finishes.
   *
   * Endpoint: GET /api/v1/cemetery/{slug}/import/status/
   * Response: { "status": "In process" | "Finished" | ... }
   *
   * Flow:
   *   1. Verify initial status is "In process" (import job started)
   *   2. Poll every 10 s until status becomes "Finished"
   *   3. Fail if status is anything other than "In process" / "Finished"
   *      or if the timeout is exceeded.
   *
   * @param timeoutMs  Maximum time to wait (default: 10 min — large imports take time)
   */
  async waitForImportToFinish(timeoutMs = 600000): Promise<void> {
    this.logger.info('Polling import status API until Finished...');

    const token = await this.page.evaluate(() => localStorage.getItem('accessToken'));
    if (!token) throw new Error('No Bearer token in localStorage — cannot poll import status');

    const currentUrl = this.page.url();
    const baseUrl = new URL(currentUrl).origin;
    const slugMatch = currentUrl.match(/chronicle-admin\/([^/?#]+)/);
    if (!slugMatch) throw new Error(`Cannot extract cemetery slug from URL: ${currentUrl}`);

    const cemeterySlug = slugMatch[1];
    const statusEndpoint = `${baseUrl}/api/v1/cemetery/${cemeterySlug}/import/status/`;
    const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

    // Statuses observed: "Starting" → "In process" → "Finished"
    const inProgressStatuses = new Set(['Starting', 'In process']);
    const pollInterval = 10000; // 10 s
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const resp = await this.page.request.get(statusEndpoint, { headers });

      if (!resp.ok()) {
        this.logger.warn(`GET /import/status/ returned ${resp.status()} — retrying`);
        await this.page.waitForTimeout(pollInterval);
        continue;
      }

      const body: { status?: string } = await resp.json();
      const status = body.status ?? 'unknown';
      this.logger.info(`Import status: ${status}`);

      if (status === 'Finished') {
        this.logger.success('Import status: Finished');
        return;
      }

      if (inProgressStatuses.has(status)) {
        await this.page.waitForTimeout(pollInterval);
        continue;
      }

      // Unknown / error status
      throw new Error(`Unexpected import status: "${status}"`);
    }

    throw new Error(`Import did not finish within ${timeoutMs / 1000}s`);
  }

  /**
   * Verify the import progress is visible in the cemetery admin sidebar.
   *
   * After Import is confirmed, the app auto-redirects to the cemetery admin page.
   * The LEFT sidebar shows:
   *   - "Import in progress ..." label
   *   - mat-progress-bar for each category (Plots, Persons, Interment, etc.)
   *
   * Checks both the label text AND at least one progress bar to confirm the import
   * job is running and the UI is reflecting the correct state.
   */
  async verifyImportProgressVisible(): Promise<void> {
    this.logger.info('Verifying import progress is visible in cemetery sidebar');

    // Verify the "Import in progress" label appears in the sidebar
    const progressText = this.page.locator(ImportSelectors.importProgressText).first();
    await progressText.waitFor({ state: 'visible', timeout: 15000 });

    // Verify at least one progress bar is in the DOM.
    // mat-progress-bar uses CSS overflow:hidden animations — Playwright reports it as
    // "hidden" even though it renders visually. Use 'attached' to confirm it exists.
    const progressBar = this.page.locator(ImportSelectors.importProgressBar).first();
    await progressBar.waitFor({ state: 'attached', timeout: 10000 });

    this.logger.success('Import progress is visible in the cemetery sidebar');
  }

  /**
   * Get all cl-section-items for a category, ordered as they appear in the DOM.
   * Uses filter({ has: locator('h3') }) for reliable exact text matching.
   * Avoids CSS :has(h3:text-is()) which may not work on all environments/versions.
   * Uses plain 'h3' selector (not testid) because testid suffixes vary per render cycle.
   */
  private getCategoryItems(category: string) {
    // Use anchored regex (^ = starts-with) to avoid substring false-positives.
    // Plain hasText:'LOT' also matches h3 "Plots" because "Plots" contains "lot" (P-l-o-t-s).
    // /^LOT/i matches "LOT" and "LOTt" (Angular hidden suffix) but NOT "Plotst".
    // /^Plots/i matches "Plots" and "Plotst" but NOT "LOTt".
    // This approach tolerates Angular's per-render hidden text suffixes (e.g. "Plotst").
    const startsWithCategory = new RegExp(`^${category}`, 'i');
    return this.page.locator(ImportSelectors.sectionItemComponent)
      .filter({ has: this.page.locator('h3', { hasText: startsWithCategory }) });
  }

  /**
   * Get the section-item after a file has been uploaded.
   * Post-upload: filetype span disappears, filename h6 appears.
   * Scoped by category name + filename for precise matching.
   */
  private getUploadedSectionItem(category: string, fileName: string) {
    return this.getCategoryItems(category).filter({ hasText: fileName });
  }

  /**
   * Upload a file to a specific import category.
   *
   * Uses setInputFiles() directly on the hidden <input type="file"> inside the
   * cl-section-item. This bypasses the visible drop zone entirely, which is necessary
   * because the drop zone has unstable testids (Angular alternates suffixes per render
   * cycle) and different text content across project vs production environments.
   *
   * Unlock order after wipe (count=0):
   *   Available immediately: Sections, Plots (geojson+csv), Persons, LOT, Notes, Invoices
   *   Unlocked after Plots+Persons uploaded: ROIs, Interments, Stories, Events
   *
   * @param category  e.g. "Sections", "Plots", "Persons", "ROIs", "Interments", "Stories", "Events", "LOT", "Notes", "Invoices"
   * @param fileType  "geojson" or "csv" — differentiates the Plots dual-entry
   * @param filePath  absolute path to the file
   */
  async uploadFileToCategory(category: string, fileType: 'geojson' | 'csv', filePath: string): Promise<void> {
    this.logger.info(`Uploading ${fileType} to ${category}: ${filePath}`);

    const items = this.getCategoryItems(category);
    // For Plots (two entries: geojson then csv), pick by index.
    const sectionItem = category === 'Plots'
      ? items.nth(fileType === 'geojson' ? 0 : 1)
      : items.first();

    // Wait for the section item to be visible (may be locked until Plots+Persons uploaded)
    await sectionItem.waitFor({ state: 'visible', timeout: 15000 });

    // Wait for Angular change detection to settle before attempting upload.
    // After multiple prior uploads the page may be rendering (import button enabled, etc.)
    // which can temporarily prevent the drag container from receiving click events.
    await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 1000 });

    const dragContainer = sectionItem.locator(ImportSelectors.dragContainer);
    let chooserUsed = false;

    // Strategy 1: scroll drag container into view, then click and intercept native file chooser.
    // Longer timeout (15 s) to handle pages with many staged files where Angular is busy.
    try {
      await dragContainer.scrollIntoViewIfNeeded().catch(() => { });
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent('filechooser', { timeout: 15000 }),
        dragContainer.click({ force: true }),
      ]);
      await fileChooser.setFiles(filePath);
      chooserUsed = true;
    } catch {
      this.logger.info(`filechooser not triggered for ${category}, trying JS input.click()`);
    }

    if (!chooserUsed) {
      // Strategy 2: trigger via JS input.click() — works when drag-container click
      // does not propagate to the hidden file input (e.g. element covered by overlay).
      let jsFallbackUsed = false;
      try {
        const [fileChooser] = await Promise.all([
          this.page.waitForEvent('filechooser', { timeout: 10000 }),
          this.page.evaluate((cat: string) => {
            const items = Array.from(document.querySelectorAll('cl-section-item'));
            const item = items.find(el => el.querySelector('h3')?.textContent?.includes(cat));
            const input = item?.querySelector('input[type="file"]') as HTMLInputElement | null;
            if (input) { input.click(); return true; }
            return false;
          }, category),
        ]);
        await fileChooser.setFiles(filePath);
        jsFallbackUsed = true;
      } catch {
        this.logger.info(`JS input.click() also failed for ${category}, using setInputFiles directly`);
      }

      if (!jsFallbackUsed) {
        // Strategy 3: setInputFiles on the hidden file input (works if input is in DOM).
        const fileInput = sectionItem.locator('input[type="file"]').first();
        await fileInput.setInputFiles(filePath);
      }
    }

    // Wait for upload API to complete before proceeding to next file
    await NetworkHelper.waitForApiRequestsComplete(this.page, 15000);

    // After upload, the filename h6 and "upload more" button appear.
    const fileName = path.basename(filePath);
    const uploadedSectionItem = this.getUploadedSectionItem(category, fileName);
    await uploadedSectionItem.getByRole('button', { name: 'upload more' }).first().waitFor({ state: 'visible', timeout: 10000 });

    this.logger.success(`File uploaded to ${category} (${fileType})`);
  }

  /**
   * Verify a file was uploaded to a specific category by checking the filename appears.
   *
   * @param category  e.g. "Sections"
   * @param fileType  "geojson" or "csv"
   * @param fileName  just the filename, e.g. "Section_AUS_GEOJSON_Astana_Tegal_Gundul.geojson"
   */
  async verifyFileUploaded(category: string, _fileType: 'geojson' | 'csv', fileName: string): Promise<void> {
    this.logger.info(`Verifying file uploaded to ${category}: ${fileName}`);

    const uploadedSectionItem = this.getUploadedSectionItem(category, fileName);
    await uploadedSectionItem.locator('h6').filter({ hasText: fileName }).first().waitFor({ state: 'visible', timeout: 10000 });

    this.logger.success(`File "${fileName}" confirmed in ${category}`);
  }

  /**
   * Verify Import button state
   */
  async verifyImportButtonState(enabled: boolean): Promise<void> {
    this.logger.info(`Verifying Import button state: ${enabled ? 'enabled' : 'disabled'}`);

    const importBtn = this.page.locator(ImportSelectors.importButton).first();
    await importBtn.waitFor({ state: 'visible' });

    const isDisabled = await importBtn.isDisabled();
    expect(isDisabled).toBe(!enabled);

    this.logger.success(`Import button is ${enabled ? 'enabled' : 'disabled'}`);
  }
}
