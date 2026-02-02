import { BrowserManager } from './src/core/BrowserManager';
import { ROIPage } from './src/pages/p0/ROIPage';
import { LoginPage } from './src/pages/p0/LoginPage';
import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

test.describe('ROI Activity Notes', () => {
  let browserManager: BrowserManager;
  let loginPage: LoginPage;
  let roiPage: ROIPage;
  const noteText = 'This is a test note for editing';
  const editedNoteText = 'This is the edited note';

  test.beforeEach(async () => {
    browserManager = new BrowserManager();
    await browserManager.launchBrowser();
    const page = browserManager.getPage();
    loginPage = new LoginPage(page);
    roiPage = new ROIPage(page);

    await loginPage.login(process.env.TEST_EMAIL as string, process.env.TEST_PASSWORD as string);
    // Navigate to a specific ROI edit page
    await roiPage.page.goto('https://staging.chronicle.rip/manage/edit/roi/4636');
    // Add a note to be edited
    await roiPage.addActivityNote(noteText);
    const isNoteVisible = await roiPage.verifyActivityNote(noteText);
    expect(isNoteVisible).toBe(true);
  });

  test.afterEach(async () => {
    // Clean up the created notes
    try {
        await roiPage.deleteActivityNote(editedNoteText);
    } catch (error) {
        console.log(`Could not delete the note: ${editedNoteText}`);
    }
    try {
        await roiPage.deleteActivityNote(noteText);
    } catch (error) {
        console.log(`Could not delete the note: ${noteText}`);
    }
    await browserManager.closeBrowser();
  });

  test('should edit an activity note', async () => {
    await roiPage.editActivityNote(noteText, editedNoteText);

    // Verify the note was edited
    const isEditedNoteVisible = await roiPage.verifyActivityNote(editedNoteText);
    expect(isEditedNoteVisible).toBe(true);

    // Verify the old note is not visible anymore
    const isOldNoteVisible = await roiPage.verifyActivityNote(noteText);
    expect(isOldNoteVisible).toBe(false);
  });
});
