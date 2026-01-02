@p0 @interment
Feature: Interment Management
  As a cemetery administrator
  I want to add Interments to vacant plots
  So that I can record deceased persons in the cemetery

  Background:
    Given I am on the Chronicle login page
    When I enter email "faris+astanaorg@chronicle.rip"
    And I enter password "12345"
    And I click the login button
    Then I should be logged in successfully

  @add-interment @smoke @p0
  Scenario: Add Interment to vacant plot and verify deceased appears in INTERMENTS tab
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand section "a"
    And I select the first vacant plot
    When I click Add Interment button
    And I fill interment form with following details
      | firstName     | John   |
      | lastName      | Doe    |
      | intermentType | Burial |
    And I save the Interment
    Then I should see deceased "John Doe" in the Interment tab
    And I should see interment type "Burial"

  @edit-interment @smoke @p0
  Scenario: Edit existing Interment in occupied plot and verify changes
    When I navigate to all plots page
    And I open the filter dialog
    And I select occupied filter
    And I apply the filter plot
    And I expand section "a"
    And I select the first occupied plot
    And I click on Interments tab
    When I click Edit Interment button
    And I update interment form with following details
      | firstName     | Jane    |
      | lastName      | Smith   |
      | intermentType | Cremated |
    And I save the Interment
    Then I should see deceased "Jane Smith" in the Interment tab
    And I should see interment type "Cremated"
