import { Before, After, BeforeAll, AfterAll, BeforeStep, setDefaultTimeout } from '@cucumber/cucumber';
import { BrowserManager } from '../core/BrowserManager.js';
import { Logger } from '../utils/Logger.js';
import { NetworkHelper } from '../utils/NetworkHelper.js';
import { RequestThrottler } from '../utils/RequestThrottler.js';
import { BASE_CONFIG } from '../data/test-data.js';
import * as fs from 'fs';
import * as path from 'path';

interface ScenarioResult {
  feature: string;
  name: string;
  status: 'PASS' | 'FAIL';
}

const runResults: ScenarioResult[] = [];

/**
 * Global Hooks for Cucumber
 * setDefaultTimeout MUST be at module level — inside BeforeAll it does NOT apply to steps/hooks
 */
setDefaultTimeout(120000);

BeforeAll(async function () {
  Logger.info('Starting test execution...');
  Logger.info('Default step timeout set to 120s');

  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    Logger.info('Created screenshots directory');
  }
});

AfterAll(async function () {
  const browserManager = BrowserManager.getInstance();
  await browserManager.closeBrowser();
  Logger.info('Test execution completed');

  if (runResults.length > 0) {
    saveTxtReport();
  }
});

function saveTxtReport(): void {
  const date = new Date().toISOString().slice(0, 10);
  const env = process.env.ENVIRONMENT ?? 'local';
  const region = process.env.REGION ?? '';

  const tagsIdx = process.argv.indexOf('--tags');
  const rawTags = tagsIdx >= 0 ? (process.argv[tagsIdx + 1] ?? '') : '';
  const tagSlug = rawTags
    .replace(/[@\s"']/g, '')
    .replace(/\s*and\s+not\s+.*$/i, '')
    .replace(/[^a-zA-Z0-9-]/g, '_')
    || 'all';

  const envPart = region ? `${env}_${region}` : env;
  const filename = `${date}_${tagSlug}_${envPart}.txt`;
  const outputDir = path.join(process.cwd(), 'docs', 'reports');
  fs.mkdirSync(outputDir, { recursive: true });

  const passed = runResults.filter(r => r.status === 'PASS').length;
  const failed = runResults.filter(r => r.status === 'FAIL').length;
  const total = runResults.length;
  const envDisplay = [env, region].filter(Boolean).join('-').toUpperCase() || 'LOCAL';

  const byFeature = new Map<string, ScenarioResult[]>();
  for (const r of runResults) {
    if (!byFeature.has(r.feature)) byFeature.set(r.feature, []);
    byFeature.get(r.feature)!.push(r);
  }

  const SEP = '='.repeat(80);
  const sep = '-'.repeat(80);
  const lines: string[] = [];

  lines.push(SEP);
  lines.push(`TEST REPORT`);
  lines.push(`Date       : ${date}`);
  lines.push(`Environment: ${envDisplay}`);
  lines.push(`Tags       : ${rawTags || 'all'}`);
  lines.push(`Result     : ${passed} passed, ${failed} failed, ${total} total`);
  lines.push(SEP);
  lines.push('');

  for (const [feature, scenarios] of byFeature) {
    const fP = scenarios.filter(s => s.status === 'PASS').length;
    const fF = scenarios.filter(s => s.status === 'FAIL').length;
    lines.push(`[${feature.toUpperCase()}]  ${fP}P ${fF}F`);
    lines.push(sep);
    lines.push(` Status | Scenario`);
    lines.push(sep);
    for (const s of scenarios) {
      lines.push(` ${s.status === 'PASS' ? 'PASS  ' : 'FAIL  '} | ${s.name}`);
    }
    lines.push('');
  }

  if (failed > 0) {
    lines.push(SEP);
    lines.push(`FAILURES (${failed})`);
    lines.push(sep);
    runResults.filter(r => r.status === 'FAIL').forEach((r, i) => {
      lines.push(` ${String(i + 1).padStart(2)}. [${r.feature}] ${r.name}`);
    });
    lines.push('');
  }

  lines.push(SEP);
  lines.push(`SUMMARY`);
  lines.push(sep);
  lines.push(` Pass  : ${passed}`);
  lines.push(` Fail  : ${failed}`);
  lines.push(` Total : ${total}`);
  lines.push(SEP);

  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, lines.join('\n') + '\n', 'utf8');
  Logger.info(`Report saved: docs/reports/${filename}`);
}

Before(async function (scenario) {
  Logger.info(`\n========================================`);
  Logger.info(`Starting Scenario: ${scenario.pickle.name}`);
  Logger.info(`========================================`);

  // Create fresh context and page for each scenario
  const browserManager = BrowserManager.getInstance();
  await browserManager.closeContext(); // Close previous context if exists
  this.page = await browserManager.createPage(scenario.pickle.name);
  this.scenarioName = scenario.pickle.name;

  // Attach request throttler to prevent Sentry rate limiting
  await RequestThrottler.attach(this.page);
});

/**
 * BeforeStep — ensure previous step's network activity is fully settled
 * before starting the next step. Prevents request spam / Sentry rate limiting.
 */
BeforeStep(async function () {
  if (!this.page || this.page.isClosed()) return;

  try {
    // Wait for any in-flight API requests from the previous step to finish
    await NetworkHelper.waitForApiRequestsComplete(this.page, 5000);
    // Small stabilization gap so the server is not hammered
    await NetworkHelper.waitForStabilization(this.page, { minWait: 200, maxWait: 1000 });
  } catch {
    // Page may have navigated or closed — safe to ignore
  }
});

After({ timeout: 30000 }, async function (scenario) {
  const status = scenario.result?.status.toLowerCase() === 'passed' ? 'PASSED' : 'FAILED';

  // Auto-capture screenshot on failure
  if (status === 'FAILED' && this.page) {
    try {
      // Clean scenario name
      const scenarioName = scenario.pickle.name
        .replace(/[^a-zA-Z0-9\s]/g, '_')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .substring(0, 100);

      const screenshotPath = path.join(process.cwd(), 'screenshots', `FAILED_${scenarioName}.png`);

      // Wait for page to stabilize before taking screenshot
      await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });
      await NetworkHelper.waitForStabilization(this.page, { minWait: 300, maxWait: 1000 });

      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
        animations: 'disabled' // Disable CSS animations for consistent screenshot
      });
      Logger.info(`Screenshot saved: ${screenshotPath}`);

      // Also log current URL for debugging
      const currentUrl = this.page.url();
      Logger.info(`Current URL at failure: ${currentUrl}`);
    } catch (error) {
      Logger.error(`Failed to capture screenshot: ${error}`);
    }
  }

  // Close page/context after each scenario
  if (this.page) {
    try {
      // Wait a bit before closing to ensure video captures the final state
      await NetworkHelper.waitForStabilization(this.page, { minWait: 500, maxWait: 2000 });

      const videoPath = await this.page.video()?.path();
      await this.page.close();
      Logger.info('Page closed for scenario');

      // Rename video file with scenario name, environment, and status (NO TIMESTAMP)
      if (videoPath) {
        // Clean scenario name
        const sanitizedName = this.scenarioName
          ? this.scenarioName
            .replace(/[^a-zA-Z0-9\s]/g, '_')
            .replace(/\s+/g, '_')
            .toLowerCase()
            .substring(0, 100)
          : 'test';

        // Get environment from centralized config (single source of truth)
        const env = BASE_CONFIG.environment;

        // Get status prefix
        const statusPrefix = status === 'PASSED' ? 'pass' : 'fail';

        const newVideoPath = path.join(path.dirname(videoPath), `${statusPrefix}_${env}_${sanitizedName}.webm`);

        // Wait a bit for video to finish writing
        await new Promise(resolve => setTimeout(resolve, 500));

        if (fs.existsSync(videoPath)) {
          fs.renameSync(videoPath, newVideoPath);
          Logger.info(`Video saved: ${newVideoPath}`);
        }
      }
    } catch (error) {
      Logger.error(`Failed to close page or rename video: ${error}`);
    }
  }

  // Accumulate result for end-of-run report
  const featureName = path
    .basename(scenario.pickle.uri ?? '', path.extname(scenario.pickle.uri ?? ''))
    .replace(/\.(authenticated|public)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  runResults.push({ feature: featureName, name: scenario.pickle.name, status: status === 'PASSED' ? 'PASS' : 'FAIL' });

  if (status === 'PASSED') {
    Logger.success(`Scenario Passed: ${scenario.pickle.name}`);
  } else {
    Logger.error(`Scenario Failed: ${scenario.pickle.name}`);
  }
  Logger.info(`========================================\n`);
});
