# Test Failures Summary

**Date**: 2026-05-04
**Total Failures**: 12 scenarios across 7 feature files

---

## Grouped by Root Cause

### 1. Business Table — No Rows Visible (2 scenarios)

| # | Scenario | Failed Step | Error |
|---|----------|-------------|-------|
| 1 | Edit an existing business | `clickFirstTableRow` | Timeout 8s — `mat-row.nth(1)` not found |
| 2 | Delete a business | `clickFirstTableRow` | Timeout 60s — same locator, function-level timeout |

**Root Cause**: Business table has no data rows loaded when step executes. Either table API returns empty, or rows not rendered in time.

**Location**: `BusinessPage.ts:204` → `business.steps.ts:42-45`

---

### 2. Purchaser Search — "endri yanto" Not Found in Dialog (2 scenarios)

| # | Scenario | Failed Step | Error |
|---|----------|-------------|-------|
| 4 | Add Sale to Interment | `searchAndSelectPurchaser` | Timeout 15s — text "endri yanto" not visible in `mat-dialog-container` |
| 6 | Add Sale to Plot | `searchAndSelectPurchaser` | Timeout 15s — identical error |

**Root Cause**: Purchaser search returns no matching result, or suggestion list doesn't contain exact "endri yanto" text. Known issue — search API may not return results in time.

**Location**: `SalesPage.ts:832` → `plot.steps.ts:149-154`

---

### 3. Regional Settings — API 400 "SAML provider not created" (2 scenarios)

| # | Scenario | Failed Step | Error |
|---|----------|-------------|-------|
| 7 | Update regional settings labels | `saveRegionalSettings` | API 400: `{"message":"SAML provider not created"}` |
| 8 | Restore regional settings labels | `saveRegionalSettings` | API 400: identical error |

**Root Cause**: Backend rejects save when SAML provider not configured. **Application bug** — regional settings save endpoint incorrectly requires SAML provider.

**Location**: `RegionalSettingsPage.ts:67` → `regionalSettings.steps.ts:31-32`

---

### 4. Interment Save — Page Navigation Timeout (1 scenario)

| # | Scenario | Failed Step | Error |
|---|----------|-------------|-------|
| 3 | Edit Interment adding applicant, NOK, minister, director | `saveInterment` | Timeout 30s — `waitForURL` never resolves after save click |

**Root Cause**: After clicking save on interment form, page doesn't navigate. Possible: save button click doesn't trigger submit, validation error blocks save silently, or API returns error without UI feedback.

**Location**: `IntermentPage.ts:358` → `interment.steps.ts:92-93`

---

### 5. ROI Save — Tablist Not Visible After Save (1 scenario)

| # | Scenario | Failed Step | Error |
|---|----------|-------------|-------|
| 5 | Add ROI to a plot | `saveROI` | Timeout 30s — `[role="tablist"]` not visible after save |

**Root Cause**: After saving ROI, page doesn't return to plot detail with tabs visible. Save may have failed silently, or navigation didn't occur.

**Location**: `roi.steps.ts:106-112`

---

### 6. ROI Table — Edit Form Not Loading (1 scenario)

| # | Scenario | Failed Step | Error |
|---|----------|-------------|-------|
| 10 | Add Sale to ROI | `openSecondROI` | Timeout 45s — `button:has-text("SAVE")` not visible |

**Root Cause**: Opening second ROI from advance table never loads the edit form. ROI may not exist, or table click doesn't trigger edit mode.

**Location**: `roi.steps.ts:277-290`

---

### 7. ROI Replace — Plot "B G 3" Not Found in Table (1 scenario)

| # | Scenario | Failed Step | Error |
|---|----------|-------------|-------|
| 11 | Replace ROI holder | `openROIEditForm` | Timeout 20s — `.mat-cell.mat-column-plotId` with text "B G 3" not visible |

**Root Cause**: Plot "B G 3" doesn't exist in ROI table, or table pagination hides it. Test data `<TEST_ROI_REPLACE_PLOT_ID>` may be invalid.

**Location**: `roiTable.steps.ts:263-270`

---

### 8. Sales Partial Payment — Status UNPAID Instead of PARTIALLY PAID (1 scenario)

| # | Scenario | Failed Step | Error |
|---|----------|-------------|-------|
| 12 | Create sale with partial payment | `validateInvoiceStatus` | Expected "PARTIALLY PAID", actual "UNPAID" |

**Root Cause**: Payments were added (3x Bank Transfer totaling $600) but invoice status remains UNPAID. Either payments not saved correctly, or status update requires different trigger (e.g., recalculation, page refresh).

**Location**: `SalesPage.ts:1662` → `sales.steps.ts:302-303`

---

### 9. Pre-need Purchase Request — No Server Response (1 scenario)

| # | Scenario | Failed Step | Error |
|---|----------|-------------|-------|
| 9 | Submit PRE-NEED purchase request | `submitRequest` | "Form submission failed - no response from server" |

**Root Cause**: Public form submission API call returns no response. Network issue, API timeout, or endpoint down on target environment.

**Location**: `RequestSalesFormPage.ts:915` → `requestSalesForm.steps.ts:97-98`

---

## Quick Reference Table

| # | Feature File | Scenario | Failed Step | Category |
|---|-------------|----------|-------------|----------|
| 1 | business.authenticated | Edit business | clickFirstTableRow | No data in table |
| 2 | business.authenticated | Delete business | clickFirstTableRow | No data in table |
| 3 | interment | Edit interment w/ contacts | saveInterment | Save/navigation timeout |
| 4 | interment | Add Sale to interment | searchAndSelectPurchaser | Purchaser not found |
| 5 | plot.authenticated | Add ROI to plot | saveROI | Save/navigation timeout |
| 6 | plot.authenticated | Add Sale to plot | searchAndSelectPurchaser | Purchaser not found |
| 7 | regionalSettings.authenticated | Update labels | save (API 400) | App bug — SAML |
| 8 | regionalSettings.authenticated | Restore labels | save (API 400) | App bug — SAML |
| 9 | requestSalesForm.public | Pre-need submit | submitRequest | No server response |
| 10 | roi | Add Sale to ROI | openSecondROI | Edit form not loading |
| 11 | roiTable.authenticated | Replace ROI holder | openROIEditForm | Plot not in table |
| 12 | sales.authenticated | Partial payment sale | validateInvoiceStatus | Status not updated |
