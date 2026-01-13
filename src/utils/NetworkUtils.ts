import { Page, Response } from '@playwright/test';

/**
 * Returns a promise that resolves when a response with the given endpoint and status code is received.
 * Use this BEFORE triggering the action that causes the network request to avoid race conditions.
 * 
 * @example
 * const responsePromise = waitForEndpoint(page, 'v1_ms_cemetery_list');
 * await page.goto(url);
 * await responsePromise;
 */
export function waitForEndpoint(page: Page, endpoint: string, statusCode: number = 200): Promise<Response> {
    return page.waitForResponse((response) =>
        response.url().includes(endpoint) && response.status() === statusCode
    );
}