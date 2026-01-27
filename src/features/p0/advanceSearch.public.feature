@p0 @advance-search-public @smoke
Feature: Advanced Search Plot - Public Access
    As a public user (not logged in)
    I want to search for plots using advanced search
    So that I can find plot information without authentication

    Background:
        Given I am on the Chronicle home page

    @advance-search-public @p0
    Scenario Outline: Advanced search plot by Section, Row, and Number without login - <section> <row> <number>
        When I click Advanced search button without login
        And I select cemetery "<TEST_CEMETERY>" in advanced search
        And I select Plot tab in advanced search
        And I select section "<section>" in advanced search without login
        And I select row "<row>" in advanced search without login
        And I enter plot number "<number>" in advanced search without login
        And I click Search button in advanced search without login
        Then I should be navigated to advance search results page
        And I should see search results information
        And I should see plot number "<number>" in sidebar results
        And I should see cemetery name "<TEST_CEMETERY>" in sidebar results
        And I click close advance search button
        Then I should be on the home page
        And I should not see advance search results sidebar

        Examples:
            | section | row | number | description         |
            | A       | A   | 1      | Basic public search |
            | B       | A   | 1      | Alternative section |

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
