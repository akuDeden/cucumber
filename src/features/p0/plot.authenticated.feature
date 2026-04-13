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

  @edit-plot-from-map @smoke @p0
  Scenario: Edit an existing plot from the cemetery map page
    When I navigate to the cemetery map page
    And I search for plot "<TEST_SEARCH_PLOT_ID>" on the map
    And I click the edit button from plot detail
    And I update the plot with following details
      | notes | Updated from map page by automated test |
    And I save the plot changes
    Then the plot should be updated successfully

  @delete-plot @p0
  Scenario: Delete a plot from the tables section
    When I navigate to the Tables section
    And I click the first plot row in the table
    And I click the more options menu
    And I click delete plot
    And I confirm the plot deletion
    Then the plot should no longer be in the table

  @view-plot-detail @smoke @p0
  Scenario: View plot detail by clicking a row in the tables section
    When I navigate to the Tables section
    And I click the first plot row in the table
    Then I should see the plot edit page
