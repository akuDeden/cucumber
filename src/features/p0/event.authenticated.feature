@p0 @event @authenticated
Feature: Event Management - CRUD (Create, Edit, Delete)
  As a cemetery administrator
  I want to manage events through a full lifecycle (create, edit, delete)
  So that I can track cemetery activities and verify data integrity

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  @create-event @smoke @regression
  Scenario: Create a new event from calendar
    When I navigate to the calendar view
    And I click the add new event button
    Then the add event form should be loaded
    When I fill in the event form with:
      | eventName | CHR24 Automation Test Event |
      | date      | 01/15/2026                  |
      | startTime | 10:00                       |
      | endTime   | 12:00                       |
      | eventType | Burial                      |
    And I save the event
    Then I should see the event "CHR24 Automation Test Event" on the calendar

  @edit-event @bug @regression @p0
  Scenario: Edit existing event should populate all form fields with existing data (CHR-24 bug verification)
    When I navigate to the calendar view
    And I open the event "CHR24 Automation Test Event" from the calendar
    And I click the edit event button in the detail dialog
    Then the edit event form should be loaded
    And the "Event Name" field should be populated with "CHR24 Automation Test Event"
    And the "Date" field should be populated
    And the "Start time" field should be populated
    And the "End Time" field should be populated
    And the event type select should show a valid value
    When I update the event name to "CHR24 Automation Test Event EDITED"
    And I save the event
    Then I should see the event "CHR24 Automation Test Event EDITED" on the calendar

  @delete-event @regression
  Scenario: Delete the created event and verify it no longer appears
    When I navigate to the calendar view
    And I open the event "CHR24 Automation Test Event EDITED" from the calendar
    And I click the delete event button in the detail dialog
    And I confirm the event deletion
    Then the event "CHR24 Automation Test Event EDITED" should no longer appear on the calendar

  @edit-event-blank-fields @bug @regression @p0
  Scenario: Verify which fields are blank when editing an event (CHR-24 detailed report)
    When I navigate to edit event page for event "62217"
    Then the edit event form should be loaded
    And I should see a report of all populated and blank fields
