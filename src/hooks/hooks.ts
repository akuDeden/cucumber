import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { BrowserManager } from '../core/BrowserManager.js';
import { Logger } from '../utils/Logger.js';
import { BASE_CONFIG } from '../data/test-data.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global Hooks for Cucumber
 */

BeforeAll(async function() {
  Logger.info('Starting test execution...');
  
  // Set default step timeout to 120 seconds (production is slow, especially for multi-item sales)
  setDefaultTimeout(120000);
  Logger.info('Default step timeout set to 120s');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    Logger.info('Created screenshots directory');
  }
});

AfterAll(async function() {
  const browserManager = BrowserManager.getInstance();
  await browserManager.closeBrowser();
  Logger.info('Test execution completed');
});

Before(async function(scenario) {
  Logger.info(`\n========================================`);
  Logger.info(`Starting Scenario: ${scenario.pickle.name}`);
  Logger.info(`========================================`);
  
  // Create fresh context and page for each scenario
  const browserManager = BrowserManager.getInstance();
  await browserManager.closeContext(); // Close previous context if exists
  this.page = await browserManager.createPage(scenario.pickle.name);
  this.scenarioName = scenario.pickle.name;
});

After(async function(scenario) {
  const status = scenario.result?.status.toLowerCase() === 'passed' ? 'PASSED' : 'FAILED';
  
  // Auto-capture screenshot on failure
  if (status === 'FAILED' && this.page) {
    try {
      // Clean scenario name without timestamp
      const scenarioName = scenario.pickle.name
        .replace(/[^a-zA-Z0-9\s]/g, '_')
        .replace(/\s+/g, '_')
        .toLowerCase()
        .substring(0, 100);
      
      const screenshotPath = path.join(process.cwd(), 'screenshots', `FAILED_${scenarioName}.png`);
      
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
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
  
  if (status === 'PASSED') {
    Logger.success(`Scenario Passed: ${scenario.pickle.name}`);
  } else {
    Logger.error(`Scenario Failed: ${scenario.pickle.name}`);
  }
  Logger.info(`========================================\n`);
});
