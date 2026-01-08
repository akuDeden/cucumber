@p0 @advanceSearch
Feature: Advanced Search Plot
  As a public user or cemetery administrator
  I want to search for plots using advanced search
  So that I can find plot information

  # ==========================================
  # PUBLIC ACCESS (NO LOGIN) SCENARIOS
  # ==========================================

  Background:
    Given I am on the Chronicle home page

  @advance-search-public @p0
  Scenario: Advanced search plot by Section, Row, and Number without login
    When I click Advanced search button without login
    And I select cemetery "<TEST_CEMETERY>" in advanced search
    And I select Plot tab in advanced search
    And I select section "<TEST_SECTION>" in advanced search without login
    And I select row "<TEST_ROW>" in advanced search without login
    And I enter plot number "<TEST_NUMBER>" in advanced search without login
    And I click Search button in advanced search without login
    Then I should be navigated to advance search results page
    And I should see search results information
    And I should see plot number "<TEST_NUMBER>" in sidebar results
    And I should see cemetery name "<TEST_CEMETERY>" in sidebar results
    And I click close advance search button
    Then I should be on the home page
    And I should not see advance search results sidebar

  @advance-search-public @advance-search-status @p0
  Scenario Outline: Advanced search plot by status without login
    When I click Advanced search button without login
    And I select cemetery "<TEST_CEMETERY>" in advanced search
    And I select Plot tab in advanced search
    And I select status "<status>" in advanced search without login
    And I click Search button in advanced search without login
    Then I should be navigated to advance search results page
    And I should see search results information
    And I should see status icon "<status>" in first result

    Examples:
      | status   |
      | For Sale |
      | Vacant   |
      | Reserved |
      | Occupied |

  # ==========================================
  # LOGGED-IN USER SCENARIOS
  # ==========================================

  @advanced-search-plot @smoke @p0
  Scenario: Advanced search plot by Section, Row, and Number (logged-in user)
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully
    When I click Advanced search button
    And I select section "A" in advanced search
    And I select row "A" in advanced search
    And I enter plot number "1" in advanced search
    And I click Search button in advanced search
    Then I should see search results containing "A A 1"
    When I click on plot "A A 1" from search results
    Then I should see plot sidebar with plot ID "A A 1"
    And I should see plot details sidebar