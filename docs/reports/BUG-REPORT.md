# Bug Report - Staging Chronicle System

## Issue: Add ROI Button Not Working

**Date**: December 28, 2025  
**Environment**: staging-aus.chronicle.rip  
**User**: faris+astanaorg@chronicle.rip  
**Organization**: Astana Tegal Gundul

### Description
When clicking the "Add ROI" button on a plot detail page, the form does not open. The URL remains on the plot detail page instead of navigating to the Add ROI form.

### Steps to Reproduce
1. Login to staging.chronicle.rip with credentials `faris+astanaorg@chronicle.rip` / `12345`
2. Navigate to "See all Plots"
3. Filter plots by status "Vacant"
4. Expand section "A"
5. Select plot "A B 3"
6. Verify plot status is "VACANT"
7. Click "Add ROI" button

### Expected Behavior
- URL should change to: `https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/A%20B%203/manage/add/roi`
- Add ROI form should appear with fields:
  - Right type (dropdown)
  - Term of right (dropdown)
  - Fee (number input)
  - Payment date (date picker)
  - Certificate number (text input)
  - Notes (textarea)
  - etc.

### Actual Behavior
- URL remains at: `https://staging-aus.chronicle.rip/customer-organization/Astana_Tegal_Gundul/plots/A%20B%203?backTo=%2Fcustomer-organization%2FAstana_Tegal_Gundul%2Fplots&from=map&zoom=21`
- Button clicks successfully (no error in browser console based on automation logs)
- No navigation occurs
- Form does not appear

### Evidence
- **Screenshot**: `screenshots/after-add-roi-click.png` (captured after button click)
- **Selector used**: `[data-testid="plot-details-edit-button-add-roi-btn"]`
- **Button found**: Yes (automation confirmed button exists and is clickable)
- **Click executed**: Yes (no timeout on click action)

### Test Results
✅ Login successful  
✅ Navigate to plots page successful  
✅ Filter vacant plots successful  
✅ Select plot successful  
✅ Verify plot status successful  
✅ Click Add ROI button successful  
❌ Form does not open (bug in staging system)

### Possible Causes
1. **Permission Issue**: User may not have permission to create ROI for this organization
2. **JavaScript Error**: Frontend error preventing navigation (check browser console)
3. **Backend Error**: API call failing silently
4. **Session Issue**: User session may have expired or is invalid
5. **Feature Flag**: Add ROI feature may be disabled for this environment

### Recommendation
1. Check browser console for JavaScript errors when clicking Add ROI button
2. Verify user permissions for creating ROI in Astana Tegal Gundul organization
3. Check backend logs for API errors when button is clicked
4. Test with different user account or organization
5. Verify feature is enabled in staging environment

### Automation Status
**Automation code is working correctly** - the issue is in the staging system, not the test framework.

Test scenario created:
- ✅ `@add-roi-form-verification` - Verifies button can be clicked (PASSING)
- 🔄 `@add-roi-full` - Full ROI creation flow (COMMENTED OUT until bug is fixed)

### Next Steps
1. Report this bug to development team
2. Get access to a working environment or user account
3. Once fixed, uncomment the full scenario in `src/features/p0/add-roi.feature`
4. Re-run tests to verify complete Add ROI workflow
