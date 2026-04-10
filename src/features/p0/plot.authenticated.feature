@p0 @plot @authenticated
Feature: Plot Management (Authenticated)
  As a cemetery administrator
  I want to create and edit plots in the cemetery
  So that I can manage the available burial spaces

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  @create-plot @smoke @p0
  Scenario: Create a new plot from the Tables section
    When I navigate to the Tables section
    And I click the Add Plot button
    And I fill the add plot form with following details
      | cemetery  | <TEST_CEMETERY_DISPLAY_NAME> |
      | section   | <TEST_PLOT_NEW_SECTION>      |
      | row       | <TEST_PLOT_NEW_ROW>          |
      | number    | <TEST_PLOT_NEW_NUMBER>       |
      | status    | <TEST_PLOT_NEW_STATUS>       |
      | plotType  | <TEST_PLOT_NEW_TYPE>         |
    And I save the new plot
    Then the new plot should appear in the plots table

  @edit-plot @smoke @p0
  Scenario: Edit an existing plot from the plot detail page
    When I navigate to all plots page
    And I open the filter dialog
    And I select vacant filter
    And I apply the filter plot
    And I expand the first section
    And I select the first vacant plot
    And I click the Edit Plot button
    And I update the plot with following details
      | burialCapacity | <TEST_PLOT_EDIT_BURIAL_CAPACITY> |
      | notes          | <TEST_PLOT_EDIT_NOTES>           |
    And I save the plot changes
    Then the plot should be updated successfully
