# CHR-24 Bug Report: Edit Event Blank Fields

## Original Ticket
**Notion:** sample_007 - Edit event will direct to blank field not populate data existing
**URL:** https://www.notion.so/chronicles/sample_007-Edit-event-will-direct-to-blan-field-not-populate-data-existing-357c6dc1a8eb801cb971d0be163a7af0

## Bug Description
When editing an existing event, the form fields may appear blank instead of being populated with the event's existing data.

## Reproduction Steps Tested
1. Login to map.chronicle.rip with faris+astanaorg@chronicle.rip / 12345
2. Navigate to Calendar view
3. Click on an existing event to open the detail dialog
4. Click "EDIT EVENT" button
5. Observe whether form fields are populated with existing data

## Test Results (2026-05-06)

### Test 1: Direct URL Edit (Event 62217)
- Navigated directly to `/customer-organization/astana_tegal_gundul_aus/events/62217/edit`
- **Result:** All fields properly populated ✅

### Test 2: Calendar → Click Event → Edit Event (Event 62217)
- Event name: "CHR-24 Bug Test Event"
- Data populated via previous edit: name, times, description, payment, purchaser details
- **Result:** All 18 fields properly populated ✅
- Only blank fields: Sub type, Status type, Related interment, Assign Business (intentionally empty)

### Test 3: Calendar → Click Event → Edit Event (Event 62221 - "CHR24 QA Test")
- Created by earlier test scripts with purchaser data
- **Result:** All 17 fields properly populated ✅

### Test 4: Edit → Save → Re-Edit Data Persistence
- Edited event 62217 with comprehensive test data (13 fields)
- Saved, then re-opened the edit page
- **Result:** All 13 fields persisted correctly ✅
  - Minor note: Payment "250.00" returned as "250" (trailing zeros stripped)

## Verdict
**🟢 BUG NOT REPRODUCIBLE on current environment (map.chronicle.rip)**

All edit event flows correctly populate form fields with existing data:
- Direct URL navigation to `/events/{id}/edit`
- Calendar → Event Detail → EDIT EVENT
- Re-editing after save

The bug may have been:
1. Already fixed in a recent deployment
2. Intermittent (race condition in data loading)
3. Specific to certain event configurations not tested here
4. Specific to a different environment (project vs map)

## Test Artifacts
- Screenshots: `screenshots/chr24-v3-*.png`, `screenshots/chr24-repro-*.png`
- Reproduction scripts: `scripts/reproduce-edit-event-bug-CHR24*.ts`, `scripts/reproduce-edit-event-bug-CHR24-v2.ts`, `scripts/reproduce-edit-event-bug-CHR24-v3.ts`

## Automation Coverage
The following Cucumber test scenarios cover this bug:
- `@edit-event` scenario in `src/features/p0/event.authenticated.feature`
- `@edit-event-blank-fields` scenario for detailed field reporting
