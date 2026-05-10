# Bug Ticket: CHR-24 - Edit Event Shows Blank Fields Instead of Existing Data

**Original Notion Ticket:** [sample_007 - Edit event will direct to blank field, not populate data existing](https://www.notion.so/chronicles/sample_007-Edit-event-will-direct-to-blan-field-not-populate-data-existing-357c6dc1a8eb801cb971d0be163a7af0)

**Status:** Reproduced ✅ | Bug Confirmed 🔴
**Priority:** Medium
**Date Reproduced:** 2026-05-05
**Environment:** map.chronicle.rip (aus region)
**Test Account:** faris+astanaorg@chronicle.rip

---

## Bug Description

When editing an existing event, the edit form loads with several fields **blank/empty** even though the event was created with data. The user is directed to what appears to be a blank form rather than one populated with the existing event's data.

## Steps to Reproduce

1. Login to https://map.chronicle.rip with a valid organization account
2. Navigate directly to an event's edit page, e.g.:
   `https://aus.chronicle.rip/customer-organization/astana_tegal_gundul_aus/events/62217/edit`
   OR
   - Click "Calendar" toggle
   - Click on an existing event
   - Click "EDIT EVENT" button
3. Observe the edit form fields

## Expected Behavior

All form fields should be pre-populated with the event's existing data (event name, date, time, purchaser details, payment amount, etc.)

## Actual Behavior

### ✅ Fields that ARE populated correctly:
| Field | Value |
|-------|-------|
| Event Name | "test" |
| Date | "05/05/2026" |
| Start time | "00:00" |
| End Time | "00:00" |
| Postal Address Different | "on" |

### ❌ Fields that are BLANK (should have data):
| Field | Expected | Actual |
|-------|----------|--------|
| Payment Amount | (value if set) | "" (empty) |
| Purchaser | (name if set) | "" (empty) |
| Purchaser Email | (email if set) | "" (empty) |
| Purchaser Phone | (phone if set) | "" (empty) |
| Address | (address if set) | "" (empty) |
| Suburb | (suburb if set) | "" (empty) |
| State | (state if set) | "" (empty) |
| Country | (country if set) | "" (empty) |
| Post Code | (postcode if set) | "" (empty) |

### Select dropdowns showing "none":
| Dropdown | Value |
|----------|-------|
| Sub type | "none" |
| Status type | "none" |

Note: Some of these fields may genuinely be empty if no purchaser/payment data was entered when creating the event. However, the bug report indicates data was entered but not displayed in edit mode.

## Screenshots

Located in `screenshots/` directory:
- `chr24-reproduce-event1-detail.png` - Event detail dialog
- `chr24-reproduce-event1-edit-form.png` - Edit form showing blank fields
- `chr24-v2-direct-edit-62217.png` - Direct URL edit page

## Additional Observations

1. **Calendar rendering issue**: The Calendar view (FullCalendar) did not render any events on the calendar grid, even though events exist in the system. `.fc-event` count was 0, `.fc-daygrid-day` count was 0. The calendar structure appears not to render at all in headless mode. This may be related to the map/leaflet overlay taking precedence.

2. **Direct URL access works**: Navigating directly to `/events/{id}/edit` does load the edit form and displays the existing event data (partial). This is a viable workaround for testing.

3. **Other event IDs (62216, 62218, 62219, 62220)** returned no form - possibly deleted or different organization.

## Root Cause Hypothesis

The blank fields in the purchase details section may be caused by:
1. Frontend not properly mapping the API response to form controls for purchaser/payment data
2. Form initialization clearing fields that have null/undefined values from the API
3. Race condition between API response and form initialization

## Test Automation

Automated test added to the project:
- **Feature file**: `src/features/p0/event.authenticated.feature`
- **Step definitions**: `src/steps/p0/event.steps.ts`
- **Page object**: `src/pages/p0/EventPage.ts`
- **Selectors**: `src/selectors/p0/event/event.selectors.ts`
- **Reproduction script**: `scripts/reproduce-edit-event-bug-chr24b.ts`

### Running the automated test:
```bash
npm test -- --tags "@edit-event"
npm test -- --tags "@event"
```

## Impact

- **User Impact**: High - Users cannot see or edit existing event purchaser/payment data
- **Workaround**: None identified for editing purchaser details
- **Frequency**: Reproducible consistently
