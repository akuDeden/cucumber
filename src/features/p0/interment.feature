@p0 @interment
Feature: Interment Management
  As a cemetery administrator
  I want to add Interments to vacant plots
  So that I can record deceased persons in the cemetery

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  @add-interment @smoke @p0
  Scenario: Add Interment to vacant plot and verify deceased appears in INTERMENTS tab
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand the first section
    And I select the first vacant plot
    When I click Add Interment button
    And I fill interment form with following details
      | firstName     | <TEST_INTERMENT_FIRSTNAME> |
      | lastName      | <TEST_INTERMENT_LASTNAME>  |
      | intermentType | <TEST_INTERMENT_TYPE>      |
    And I save the Interment
    Then I should see deceased "<TEST_INTERMENT_FIRSTNAME> <TEST_INTERMENT_LASTNAME>" in the Interment tab
    And I should see interment type "<TEST_INTERMENT_TYPE>"

  @edit-interment @smoke @p0
  Scenario: Edit existing Interment in occupied plot and verify changes
    When I navigate to all plots page
    And I open the filter dialog
    And I select occupied filter
    And I apply the filter plot
    And I expand the first section
    And I select the first occupied plot
    And I click on Interments tab
    When I click Edit Interment button
    And I update interment form with following details
      | firstName     | <TEST_INTERMENT_EDIT_FIRSTNAME> |
      | lastName      | <TEST_INTERMENT_EDIT_LASTNAME>  |
      | intermentType | <TEST_INTERMENT_EDIT_TYPE>      |
    And I save the Interment
    Then I should see deceased "<TEST_INTERMENT_EDIT_FIRSTNAME> <TEST_INTERMENT_EDIT_LASTNAME>" in the Interment tab
    And I should see interment type "<TEST_INTERMENT_EDIT_TYPE>"

  @add-interment-with-relations @p0
  Scenario: Add Interment with applicant, next of kin, funeral minister and funeral director
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand the first section
    And I select the first vacant plot
    When I click Add Interment button
    And I fill interment form with following details
      | firstName     | <TEST_INTERMENT_FIRSTNAME> |
      | lastName      | <TEST_INTERMENT_LASTNAME>  |
      | intermentType | <TEST_INTERMENT_TYPE>      |
    And I add interment applicant by searching "<TEST_INTERMENT_APPLICANT_LASTNAME>"
    And I add next of kin by searching "<TEST_INTERMENT_NOK_LASTNAME>"
    And I add funeral minister by searching "<TEST_INTERMENT_MINISTER_BUSINESS>"
    And I add funeral director by searching "<TEST_INTERMENT_DIRECTOR_BUSINESS>"
    And I save the Interment
    Then I should see deceased "<TEST_INTERMENT_FIRSTNAME> <TEST_INTERMENT_LASTNAME>" in the Interment tab

  @edit-interment-with-relations @p0
  Scenario: Edit Interment adding applicant, next of kin, funeral minister and funeral director
    When I navigate to all plots page
    And I open the filter dialog
    And I select occupied filter
    And I apply the filter plot
    And I expand the first section
    And I select the first occupied plot
    And I click on Interments tab
    When I click Edit Interment button
    And I add interment applicant by searching "<TEST_INTERMENT_APPLICANT_LASTNAME>"
    And I add next of kin by searching "<TEST_INTERMENT_NOK_LASTNAME>"
    And I add funeral minister by searching "<TEST_INTERMENT_MINISTER_BUSINESS>"
    And I add funeral director by searching "<TEST_INTERMENT_DIRECTOR_BUSINESS>"
    And I save the Interment
    Then I should be on the plot detail page after save

  @delete-interment @p0
  Scenario: Delete Interment from the more menu on edit interment page
    When I navigate to all plots page
    And I open the filter dialog
    And I select occupied filter
    And I apply the filter plot
    And I expand the first section
    And I select the first occupied plot
    And I click on Interments tab
    When I click Edit Interment button
    And I click more options on edit interment page
    And I click delete interment from menu
    And I confirm the interment deletion
    Then I should be on the plot detail page after save

  @move-interment @p0
  Scenario: Move Interment from the more menu on edit interment page
    When I navigate to all plots page
    And I open the filter dialog
    And I select occupied filter
    And I apply the filter plot
    And I expand the first section
    And I select the first occupied plot
    And I click on Interments tab
    When I click Edit Interment button
    And I click more options on edit interment page
    And I click move interment from menu
    And I select a vacant plot to move interment to "<TEST_INTERMENT_MOVE_PLOT>"
    And I confirm the interment move
    Then the interment should be moved successfully
