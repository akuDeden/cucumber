@p0 @roi
Feature: ROI Management
  As a cemetery administrator
  I want to add ROI (Record of Interest) to vacant plots
  So that I can reserve plots for potential customers

  Background:
    Given I am on the Chronicle login page
    When I enter email "faris+astanaorg@chronicle.rip"
    And I enter password "12345"
    And I click the login button
    Then I should be logged in successfully

  @add-roi @smoke
  Scenario: Add ROI to vacant plot and verify status change to Reserved
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand section "a"
    And I select the first vacant plot
    When I click Add ROI button
    And I fill ROI form with following details
      | rightType       | Cremation       |
      | termOfRight     | 25 Years        |
      | fee             | 1000            |
      | certificateNumber | CERT-TEST-001 |
      | notes           | Test ROI for automation |
    And I save the ROI
    Then the plot status should be "RESERVED"

  @add-roi-holder @roi-holder
  Scenario: Add ROI with person ROI holder to vacant plot
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand section "a"
    And I select the first vacant plot
    When I click Add ROI button
    And I fill ROI form with following details
      | rightType       | Cremation       |
      | termOfRight     | 25 Years        |
      | fee             | 1000            |
      | certificateNumber | CERT-TEST-002 |
      | notes           | Test ROI with person holder |
    And I add ROI holder person with following details
      | firstName | John                 |
      | lastName  | Doe                  |
      | phone     | +1234567890          |
      | email     | john.doe@example.com |
    And I save the ROI
    Then the plot status should be "RESERVED"
    And I should see ROI holder "John Doe" in the ROI tab

  @add-roi-applicant @roi-applicant
  Scenario: Add ROI with person ROI applicant to vacant plot
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand section "a"
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

  @add-roi-holder-applicant @roi-holder-applicant
  Scenario: Add ROI with both ROI holder and applicant to vacant plot
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand section "a"
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

  @edit-roi @roi-edit
  Scenario: Edit ROI details on reserved plot
    When I navigate to all plots page
    And I open the filter dialog
    And I select reserved filter
    And I apply the filter plot
    And I expand section "a"
    And I select the first reserved plot
    And I click Edit ROI button
    And I fill ROI form with following details
      | fee             | 2000            |
      | certificateNumber | CERT-EDIT-001 |
      | notes           | Updated ROI details |
    And I save the ROI
    Then the plot status should be "RESERVED"
