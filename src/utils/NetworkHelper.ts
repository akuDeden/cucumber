import { Page } from '@playwright/test';
import { Logger } from './Logger.js';

/**
 * Helper for waiting for network requests and data loading
 * Provides more reliable waiting than hardcoded timeouts
 */
export class NetworkHelper {
  private static logger = new Logger('NetworkHelper');

  /**
   * Wait for network to be idle (no more than 2 requests for specified time)
   * Use this after navigation or data loading operations
   * @param page - Playwright page object
   * @param timeout - Maximum time to wait in ms (default: 30000)
   */
  static async waitForNetworkIdle(page: Page, timeout: number = 30000): Promise<void> {
    try {
      await page.waitForLoadState('networkidle', { timeout });
      this.logger.info('Network idle reached');
    } catch (e) {
      // Some apps have continuous polling, so networkidle might timeout
      // This is acceptable, log and continue
      this.logger.info(`Network idle timeout (acceptable for apps with polling): ${(e as Error).message}`);
    }
  }

  /**
   * Wait for all critical API requests to complete
   * More reliable than networkidle for apps with polling
   * Waits until no requests started in the last 500ms
   * @param page - Playwright page object
   * @param timeout - Maximum time to wait in ms (default: 15000)
   */
  static async waitForApiRequestsComplete(page: Page, timeout: number = 15000): Promise<void> {
    const startTime = Date.now();
    let lastRequestTime = startTime;

    while (Date.now() - startTime < timeout) {
      const pendingRequests = await page.evaluate(() => {
        // @ts-ignore - accessing performance API
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const now = performance.now();
        // Count requests that started in last 100ms
        return entries.filter(e => e.startTime > now - 100).length;
      });

      if (pendingRequests === 0) {
        const timeSinceLastRequest = Date.now() - lastRequestTime;
        if (timeSinceLastRequest > 500) {
          this.logger.info('API requests completed');
          return;
        }
      } else {
        lastRequestTime = Date.now();
      }

      await page.waitForTimeout(100);
    }

    this.logger.info(`Timeout waiting for API requests, continuing...`);
  }

  /**
   * Wait for DOM ready state
   * Useful for Angular/React apps that need time to render
   * @param page - Playwright page object
   * @param timeout - Maximum time to wait in ms (default: 10000)
   */
  static async waitForDOMReady(page: Page, timeout: number = 10000): Promise<void> {
    await page.waitForLoadState('domcontentloaded', { timeout });
    this.logger.info('DOM ready');
  }

  /**
   * Wait for element with network check
   * Combines element visibility + network stability
   * @param page - Playwright page object
   * @param selector - CSS selector or testid
   * @param timeout - Maximum time to wait in ms (default: 15000)
   */
  static async waitForElementWithNetworkIdle(
    page: Page,
    selector: string,
    timeout: number = 15000
  ): Promise<void> {
    await page.waitForSelector(selector, { state: 'visible', timeout });
    // Small wait to ensure data is loaded after element is visible
    await this.waitForApiRequestsComplete(page, 3000);
    this.logger.info(`Element ${selector} visible with network idle`);
  }

  /**
   * Wait for URL change and then network idle
   * Use after navigation actions
   * @param page - Playwright page object
   * @param urlPattern - URL pattern to wait for
   * @param timeout - Maximum time to wait in ms (default: 30000)
   */
  static async waitForURLWithNetworkIdle(
    page: Page,
    urlPattern: string,
    timeout: number = 30000
  ): Promise<void> {
    await page.waitForURL(urlPattern, { timeout });
    await this.waitForApiRequestsComplete(page, 3000);
    this.logger.info(`URL ${urlPattern} reached with network idle`);
  }

  /**
   * Smart wait for form to be ready
   * Checks if form is visible AND inputs are editable
   * @param page - Playwright page object
   * @param formSelector - Selector for the form or form container
   * @param timeout - Maximum time to wait in ms (default: 15000)
   */
  static async waitForFormReady(
    page: Page,
    formSelector: string,
    timeout: number = 15000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const isReady = await page.evaluate((selector) => {
        // @ts-ignore - Running in browser context
        const form = document.querySelector(selector);
        if (!form) return false;

        // Check if visible
        // @ts-ignore
        const rect = form.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;

        // Check if inputs are not readonly
        // @ts-ignore
        const inputs = form.querySelectorAll('input:not([type=hidden]), textarea, select');
        // @ts-ignore
        for (const input of Array.from(inputs)) {
          // @ts-ignore
          if (input.readOnly) return false;
        }

        return true;
      }, formSelector);

      if (isReady) {
        this.logger.info(`Form ${formSelector} is ready`);
        return;
      }

      await page.waitForTimeout(200);
    }

    throw new Error(`Form ${formSelector} not ready after ${timeout}ms`);
  }

  /**
   * Wait for list/data to be populated
   * Useful for tables, lists, grids that load data from API
   * @param page - Playwright page object
   * @param listSelector - Selector for the list container
   * @param minItems - Minimum number of items expected (default: 1)
   * @param timeout - Maximum time to wait in ms (default: 15000)
   */
  static async waitForListPopulated(
    page: Page,
    listSelector: string,
    minItems: number = 1,
    timeout: number = 15000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const itemCount = await page.evaluate((selector) => {
        // @ts-ignore - Running in browser context
        const list = document.querySelector(selector);
        if (!list) return 0;

        // Count direct children that are list items
        // @ts-ignore
        const items = list.querySelectorAll(':scope > *');
        return items.length;
      }, listSelector);

      if (itemCount >= minItems) {
        this.logger.info(`List ${listSelector} populated with ${itemCount} items`);
        return;
      }

      await page.waitForTimeout(200);
    }

    throw new Error(`List ${listSelector} not populated after ${timeout}ms`);
  }
}
