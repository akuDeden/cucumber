import { chromium } from '@playwright/test';
import { getCustomerOrgBaseUrl, getCustomerOrgUrl, LOGIN_DATA } from './src/data/test-data.js';

async function testSendButton() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Build URLs using helper functions
  const baseUrl = getCustomerOrgBaseUrl();
  const loginUrl = `${baseUrl}/login`;
  const editRoiUrl = getCustomerOrgUrl('A%20A%203/manage/edit/roi/5664889');
  
  console.log('Generated URLs:');
  console.log('Login URL:', loginUrl);
  console.log('Edit ROI URL:', editRoiUrl);
  
  // Login
  await page.goto(loginUrl);
  await page.fill('input[name="email"]', LOGIN_DATA.valid.email);
  await page.fill('input[type="password"]', LOGIN_DATA.valid.password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  // Navigate to edit ROI page
  await page.goto(editRoiUrl);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Find textarea
  const textarea = page.locator('textarea[placeholder="Add Notes"]');
  await textarea.waitFor({ state: 'visible' });
  await textarea.fill('Test note');
  
  console.log('Textarea found and filled');
  
  // Get all clickable elements near the textarea
  const allButtons = await page.locator('img, button, [role="button"]').all();
  console.log(`Found ${allButtons.length} potential clickable elements`);
  
  // Try to find send button by examining elements
  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];
    const box = await btn.boundingBox();
    if (box) {
      const attrs = await btn.evaluate((el) => ({
        tag: el.tagName,
        src: el.getAttribute('src'),
        alt: el.getAttribute('alt'),
        role: el.getAttribute('role'),
        className: el.className,
        style: el.getAttribute('style'),
      }));
      console.log(`Element ${i}:`, attrs, 'Position:', box);
    }
  }
  
  // Wait to see the result
  await page.waitForTimeout(30000);
  await browser.close();
}

testSendButton().catch(console.error);
