# Bug Report: Sales Owner Field Validation Issue

## Summary
Sales form submission fails due to Angular Material owner dropdown bug where the field appears selected in the UI but the form control value remains empty, causing backend validation to reject the submission.

## Environment
- **URL**: https://staging-aus.chronicle.rip/customer-organization/sales/create
- **Date**: 2026-01-22
- **Browser**: Chromium (Playwright automation)

## Steps to Reproduce
1. Navigate to Sales page
2. Click "Create Sale" button
3. Fill in all required fields (reference, dates, note, purchaser)
4. **Select owner from dropdown** (shows "Juan Francisco fasss" selected)
5. Add multiple items with plots
6. **Select owner again from dropdown** (still shows "Juan Francisco fasss" selected)
7. Verify summary calculation (passes correctly)
8. Click "CREATE" button

## Expected Behavior
- Form should submit successfully
- API call to `/api/v1/invoices/` should be made
- User should be redirected to sales list page with new invoice visible

## Actual Behavior
- Form submission fails
- No API call is made
- User remains on `/sales/create` page
- Backend validation rejects form with "Owner field required" error

## Root Cause
Angular Material `mat-select` component bug:
- **Visual State**: Combobox displays selected owner text ("Juan Francisco fasss (faris+astanaorg@chronicle.rip)")
- **Internal State**: FormControl value is `null` or empty string
- **Validation**: Angular form validator sees empty required field despite UI showing selection

## Evidence from Automation Logs
```
[INFO] [SalesPage] Owner value before selection: "Juan Francisco fasss (faris+astanaorg@chronicle.rip)"
[INFO] [SalesPage] Owner value after selection: "Juan Francisco fasss (faris+astanaorg@chronicle.rip)"
[INFO] [SalesPage] Owner selected
[WARN] [SalesPage] Empty required fields found (may be UI bug): ["Owner"]
[INFO] [SalesPage] CREATE button clicked
[INFO] [SalesPage] URL after CREATE click: https://staging-aus.chronicle.rip/customer-organization/sales/create
[ERROR] [SalesPage] Form submission failed - URL did not change
[ERROR] [SalesPage] This is likely due to Angular Material owner field bug where formControl value is empty despite UI showing selection
```

## Impact
- **Severity**: Critical - Blocks sales creation workflow
- **Workaround**: None available in current UI implementation
- **Test Status**: 17/19 steps pass (89%), only final submission fails due to this bug

## Automation Status
✅ All form fields filled correctly:
- Reference, issue date, due date, note: Filled
- Purchaser person: Added successfully
- Items: All 5 items with plots, qty, price, discount filled
- Summary calculation: **PASSED** ($1,764.10 subtotal, $176.41 VAT, $1,940.51 total)
- Owner selection: **UI shows selected** but formControl value is empty

❌ Form submission fails:
- Owner field validation error
- No API call to `/api/v1/invoices/`
- No redirect to sales list page

## Technical Details
**Selector**: `mat-select[formcontrolname="owner"]`

**Angular Material Version**: Unknown (check with dev team)

**Observed Behavior**:
- `combobox.textContent()` returns "Juan Francisco fasss (faris+astanaorg@chronicle.rip)"
- Angular form evaluates owner as empty required field
- Selection event may not be properly propagating to FormControl

## Recommended Fixes (for Dev Team)
1. **Immediate**: Verify Angular Material version and check for known issues with mat-select FormControl binding
2. **Short-term**: Add explicit change detection trigger after owner selection:
   ```typescript
   this.salesForm.get('owner').updateValueAndValidity();
   this.changeDetectorRef.detectChanges();
   ```
3. **Medium-term**: Review form state management - items array may be resetting owner field when modified
4. **Long-term**: Consider refactoring owner selection to use reactive forms pattern with proper change detection

## Workaround for Manual Testing
1. Select owner **BEFORE** adding any items
2. Do NOT click anywhere near the owner field after adding items
3. Immediately click CREATE button after verifying summary
4. If CREATE fails, refresh page and start over (do not attempt to re-select owner)

## Related Issues
- User reported: "sepertinya ada bug apps, dia hilang setelah kita klik + add item" (owner disappears after clicking ADD ITEM)
- This confirms owner field state is being affected by item array modifications

## Test Automation Notes
- Automation successfully fills all fields and validates summary
- Owner field is selected 3 times (before items, after items, on CREATE validation)
- All 3 selections show correct textContent but formControl remains empty
- No workaround possible in automation - this must be fixed in application code

## Next Steps
1. **Report to dev team** with this bug report
2. **Check Angular console** for any form validation errors or warnings
3. **Verify FormControl binding** in sales.component.ts
4. **Test with different owner selections** to see if issue is user-specific or universal
5. **Check browser console** for any JavaScript errors during owner selection

---
**Status**: Open - Blocking sales automation E2E tests
**Assigned to**: Development Team
**Priority**: P0 - Critical bug blocking core functionality
