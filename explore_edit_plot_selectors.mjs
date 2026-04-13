import { chromium } from '@playwright/test';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.dev', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx === -1) return;
  env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
});

const LOGIN_BASE_URL = env.LOGIN_BASE_URL;
const EMAIL = env.CHRONICLE_EMAIL;
const PASSWORD = env.CHRONICLE_PASSWORD;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Login
await page.goto(`${LOGIN_BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.locator('[data-testid="login-mat-form-field-input-mat-input-element"]').click();
await page.locator('[data-testid="login-mat-form-field-input-mat-input-element"]').fill(EMAIL);
await page.locator('[data-testid="login-mat-form-field-input-password"]').click();
await page.locator('[data-testid="login-mat-form-field-input-password"]').fill(PASSWORD);
await page.locator('[data-testid="login-login-screen-button-mat-focus-indicator"]').click();
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(2000);
console.log('After login:', page.url());

// Navigate DIRECTLY to the vacant plot edit form (using known URL from test)
// Plot B B 7 (uuid: 10255825) - found as first vacant in previous test
const editUrl = `${LOGIN_BASE_URL}/customer-organization/astana_tegal_gundul_aus/10255825/manage/edit/plot`;
await page.goto(editUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
console.log('Edit form URL:', page.url());

// Get all data-testid elements
const allTestIds = await page.evaluate(() => {
  const elements = document.querySelectorAll('[data-testid]');
  return Array.from(elements).map(el => ({
    testid: el.getAttribute('data-testid'),
    tag: el.tagName,
    text: el.textContent?.trim().substring(0, 60)
  }));
});

console.log('\n=== Interment/ROI related data-testid elements ===');
allTestIds.forEach(el => {
  if (/interment|roi|add|plus|adding/i.test(el.testid || '') || /^Add$|interment|right/i.test(el.text || '')) {
    console.log(`[${el.tag}] "${el.testid}" | "${el.text}"`);
  }
});

console.log('\n=== ALL Buttons ===');
const buttons = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button')).map(el => ({
    testid: el.getAttribute('data-testid'),
    text: el.textContent?.trim().substring(0, 60),
    ariaLabel: el.getAttribute('aria-label'),
    disabled: el.disabled
  }));
});
buttons.forEach(b => console.log(`[BUTTON] testid="${b.testid}" | text="${b.text}" | disabled=${b.disabled}`));

await browser.close();
