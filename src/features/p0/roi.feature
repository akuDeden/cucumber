@p0 @roi
Feature: ROI Management
  As a cemetery administrator
  I want to add ROI (Record of Interest) to vacant plots
  So that I can reserve plots for potential customers

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  @add-roi @smoke @p0
  Scenario: Add ROI to vacant plot and verify status change to Reserved
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand the first section
    And I select the first vacant plot
    When I click Add ROI button
    And I fill ROI form with following details
      | rightType         | <TEST_ROI_RIGHT_TYPE> |
      | termOfRight       | <TEST_ROI_TERM>       |
      | fee               | <TEST_ROI_FEE>        |
      | certificateNumber | <TEST_ROI_CERT>       |
      | notes             | <TEST_ROI_NOTES>      |
    And I save the ROI
    Then the plot status should be "RESERVED"

  @add-roi @roi-holder @p0
  Scenario: Add ROI with person ROI holder to vacant plot
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand the first section
    And I select the first vacant plot
    When I click Add ROI button
    And I fill ROI form with following details
      | rightType         | Cremation           |
      | termOfRight       | 25 Years            |
      | fee               | 1000                |
      | certificateNumber | <TEST_ROI_CERT_2>   |
      | notes             | Test ROI with person holder |
    And I add ROI holder person with following details
      | firstName | <TEST_ROI_HOLDER_FIRSTNAME> |
      | lastName  | <TEST_ROI_HOLDER_LASTNAME>  |
      | phone     | <TEST_ROI_HOLDER_PHONE>     |
      | email     | john.doe@example.com        |
    And I save the ROI
    Then the plot status should be "RESERVED"
    And I should see ROI holder "<TEST_ROI_HOLDER_FIRSTNAME> <TEST_ROI_HOLDER_LASTNAME>" in the ROI tab

  @add-roi @roi-applicant @p0
  Scenario: Add ROI with person ROI applicant to vacant plot
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand the first section
    And I select the first vacant plot
    When I click Add ROI button
    And I fill ROI form with following details
      | rightType       | Cremation       |
      | termOfRight     | 25 Years        |
      | fee             | 1000            |
      | certificateNumber | CERT-TEST-003 |
      | notes           | Test ROI with applicant |
    And I add ROI applicant person with following details
      | firstName | Jane                  |
      | lastName  | Smith                 |
      | phone     | +9876543210           |
      | email     | jane.smith@example.com |
    And I save the ROI
    Then the plot status should be "RESERVED"
    And I should see ROI applicant "Jane Smith" in the ROI tab

  @add-roi @roi-holder-applicant @p0
  Scenario: Add ROI with both ROI holder and applicant to vacant plot
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand the first section
    And I select the first vacant plot
    When I click Add ROI button
    And I fill ROI form with following details
      | rightType       | Cremation       |
      | termOfRight     | 25 Years        |
      | fee             | 1000            |
      | certificateNumber | CERT-TEST-004 |
      | notes           | Test ROI with holder and applicant |
    And I add ROI holder person with following details
      | firstName | John                 |
      | lastName  | Doe                  |
      | phone     | +1234567890          |
      | email     | john.doe@example.com |
    And I add ROI applicant person with following details
      | firstName | Jane                  |
      | lastName  | Smith                 |
      | phone     | +9876543210           |
      | email     | jane.smith@example.com |
    And I save the ROI
    Then the plot status should be "RESERVED"
    And I should see both ROI holder "John Doe" and applicant "Jane Smith"

  @edit-roi @p0
  Scenario: Edit ROI details on reserved plot
    When I navigate to all plots page
    And I open the filter dialog
    And I select reserved filter
    And I apply the filter plot
    And I expand the first section
    And I select the first reserved plot
    And I click Edit ROI button
    And I fill ROI form with following details
      | fee             | 2000            |
      | certificateNumber | CERT-EDIT-001 |
    And I save the ROI
    Then the plot status should be "RESERVED"
    When I click Edit ROI button
    Then I should see fee "2000" in ROI form
    And I should see certificate number "CERT-EDIT-001" in ROI form
    And I add activity note "Updated ROI details"
    And I save the ROI
    When I click Edit ROI button
    And I should see activity note "Updated ROI details"

  @edit-activity-note @p0
  Scenario: Edit existing activity note in ROI
    When I navigate to all plots page
    And I open the filter dialog
    And I select reserved filter
    And I apply the filter plot
    And I expand the first section
    And I select the first reserved plot
    And I click Edit ROI button
    # First, add a note that we will edit later
    And I add activity note "Original note to be edited"
    And I save the ROI
    # Now edit the note
    When I click Edit ROI button
    And I edit activity note "Original note to be edited" to "EDITED: Note has been updated successfully"
    # Verify edit worked before saving
    Then I should see activity note "EDITED: Note has been updated successfully"
    # Now save
    And I save the ROI
    # Verify the edited note persists
    When I click Edit ROI button
    Then I should see activity note "EDITED: Note has been updated successfully"


