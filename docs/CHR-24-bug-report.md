# CHR-24 Bug Report: Edit Event — Fields Not Populated With Existing Data

## Summary
When editing an existing event on map.chronicle.rip, multiple form fields appear blank instead of being populated with the event's existing data. This affects the purchaser/payment section, description, and several dropdown fields.

## Environment
- **URL:** https://aus.chronicle.rip/customer-organization/astana_tegal_gundul_aus/events/62217/edit
- **Event ID:** 62217 (event name: "test")
- **Account:** faris+astanaorg@chronicle.rip
- **Tested:** 2026-05-06

## Steps to Reproduce
1. Login to map.chronicle.rip with valid credentials
2. Navigate to Calendar view
3. Click on an existing event on the calendar
4. Click "EDIT EVENT" in the detail dialog
5. OR navigate directly to `/customer-organization/{org}/events/{id}/edit`
6. Observe which form fields are populated vs blank

## Test Results (Automated — Playwright + Cucumber)

### ✅ Populated Fields (8/23)
| Field | Value |
|-------|-------|
| Event Name | "test" |
| Date | "05/05/2026" |
| Start time | "00:00" |
| End Time | "00:00" |
| [Select] Event type | "Burial" |
| [Select] Cemetery | "Astana Tegal Gundul" |
| [Select] Plot | "A A 2" |
| [Select] Responsible | "cemeterysOwner (faris+astanaorg@chronicle.rip)" |

### ❌ Blank Fields (15/23)
| Field | Expected | Actual |
|-------|----------|--------|
| Search | N/A (search input) | "" |
| Payment Amount | Should show payment if set | "" (blank) |
| Purchaser | Should show purchaser name if set | "" (blank) |
| Purchaser Email | Should show email if set | "" (blank) |
| Purchaser Phone | Should show phone if set | "" (blank) |
| Address | Should show address if set | "" (blank) |
| Suburb | Should show suburb if set | "" (blank) |
| State | Should show state if set | "" (blank) |
| Country | Should show country if set | "" (blank) |
| Post Code | Should show postal code if set | "" (blank) |
| Description | Should show description if set | "" (blank) |
| [Select] Sub type | Should show sub-type if set | "" (blank) |
| [Select] Status type | Should show status if set | "" (blank) |
| [Select] Related interment | Should show interment if linked | "" (blank) |
| [Select] Assign Business | Should show business if assigned | "" (blank) |

## Analysis

### Known vs Bug
Some blank fields may be legitimately empty if no data was entered when creating the event. However, the Notion ticket (sample_007) specifically reports that existing data is not being populated in the edit form. This suggests the edit form is failing to load data from the API response into the form fields.

### Likely Root Cause
The edit event page likely has one of these issues:
1. **API response mapping failure** — The form component is not correctly mapping API response fields to form controls
2. **Race condition** — Form renders before API data is loaded
3. **Field name mismatch** — Backend field names don't match what the frontend expects for form population
4. **Form initialization** — Form controls aren't properly patched/initialized with the loaded data

## Test Artifacts
- **Feature file:** src/features/p0/event.authenticated.feature (scenario: @edit-event-blank-fields)
- **Step definitions:** src/steps/p0/event.steps.ts
- **Page object:** src/pages/p0/EventPage.ts
- **Selectors:** src/selectors/p0/event/event.selectors.ts
- **Screenshot:** screenshots/FAILED_verify_which_fields_are_blank_when_editing_an_event__chr_24_detailed_report_.png
- **Video:** videos/fail_production_verify_which_fields_are_blank_when_editing_an_event__chr_24_detailed_report_.webm

## Recommendation
1. **Investigate the edit event API call** — Check the network response when loading /events/{id}/edit to see if the API returns all fields
2. **Check form patchValue/setValue** — Verify the form component correctly maps API response data to reactive form controls
3. **Test with a fully-populated event** — Create an event with ALL fields filled, then edit it to see which fields fail to load
4. **Priority: P0** — Data loss risk: users may save the edit form with blank fields, unintentionally erasing existing data
