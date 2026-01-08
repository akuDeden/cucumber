@p0 @searchBox
Feature: Search ROI Holder
  As a public user or cemetery administrator
  I want to search for ROI holders using global search
  So that I can find plot information associated with ROI holders

  # ==========================================
  # PUBLIC ACCESS (NO LOGIN) SCENARIOS
  # ==========================================

  Background:
    Given I am on the Chronicle home page

  @search-roi-holder-public @p0
  Scenario: Search ROI holder without login should return no results (privacy protection)
    # First, select a cemetery to provide context for search
    When I select cemetery "<TEST_CEMETERY>" for public search
    # Search for existing ROI holder in global search
    When I search for "sandiaga uno salahuddin" in global search without login
    # Verify no results are returned due to privacy protection
    Then I should see "No results" message indicating privacy protection

  # ==========================================
  # LOGGED-IN USER SCENARIOS
  # ==========================================

  @search-roi-holder-logged-in @p0
  Scenario: Search ROI holder and verify plot information (logged-in user)
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully
    # Navigate to plot list page where search is available
    When I navigate to all plots page
    # Search for existing person in global search
    When I search for "sandiaga uno salahuddin" in global search
    # Verify search result shows plot with person name and ROI Holder role
    Then I should see search result with plot "B F 13"
    # Click on search result to navigate to plot detail
    When I click on search result plot "B F 13"
    # Verify person exists in ROI tab with ROI HOLDER role
    Then I should see ROI holder "Sandiaga Uno Salahuddin" in the ROI tab
