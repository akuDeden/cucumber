@p0 @advanceSearch @authenticated
Feature: Advanced Search Plot - Authenticated Users
    As a cemetery administrator (logged-in user)
    I want to search for plots using advanced search with full access
    So that I can manage and find plot information efficiently

    Background:
        Given I am on the Chronicle login page
        When I enter email "<TEST_EMAIL>"
        And I enter password "<TEST_PASSWORD>"
        And I click the login button
        Then I should be logged in successfully
        And I navigate to organization home page

    @advanced-search-plot @smoke @p0
    Scenario: Advanced search plot by Section, Row, and Number
        When I click Advanced search button
        And I select section "A" in advanced search
        And I select row "A" in advanced search
        And I enter plot number "1" in advanced search
        And I click Search button in advanced search
        Then I should see search results containing "A A 1"
        When I click on plot "A A 1" from search results
        Then I should see plot sidebar with plot ID "A A 1"
        And I should see plot details sidebar

    @advance-search-plot-id @p0
    Scenario: Advanced search plot by Plot ID
        When I click Advanced search button
        And I enter plot ID "<TEST_ADVANCE_PLOT_ID>" in advanced search
        And I click Search button in advanced search
        Then I should see search results containing "<TEST_ADVANCE_PLOT_ID>"
        When I click on plot "<TEST_ADVANCE_PLOT_ID>" from search results
        Then I should see plot sidebar with plot ID "<TEST_ADVANCE_PLOT_ID>"
        And I should see plot details sidebar

    @advance-search-plot-type @p0
    Scenario: Advanced search plot by Plot type (Garden) and validate detail
        When I click Advanced search button
        And I select plot type "<TEST_ADVANCE_PLOT_TYPE>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information
        When I click on first plot from search results
        Then I should see plot details sidebar
        When I click Edit plot button
        Then I should see plot type "<TEST_ADVANCE_PLOT_TYPE>" in edit plot page
        And I close edit plot page

    @advance-search-plot-type-outline @p0
    Scenario Outline: Advanced search plot by Plot type and validate
        When I click Advanced search button
        And I select plot type "<plotType>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information
        When I click on first plot from search results
        Then I should see plot details sidebar
        When I click Edit plot button
        Then I should see plot type "<plotType>" in edit plot page
        And I close edit plot page

        Examples:
            | plotType |
            | Garden   |
            | Lawn     |

    @advance-search-price @p0
    Scenario: Advanced search plot by Price
        When I click Advanced search button
        And I enter price "<TEST_ADVANCE_PRICE>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information

    @advance-search-capacity @p0
    Scenario: Advanced search plot by Capacity
        When I click Advanced search button
        And I enter burial capacity "<TEST_ADVANCE_BURIAL_CAPACITY>" in advanced search
        And I enter entombment capacity "<TEST_ADVANCE_ENTOMBMENT_CAPACITY>" in advanced search
        And I enter cremation capacity "<TEST_ADVANCE_CREMATION_CAPACITY>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information

    @advance-search-interments-qty @p0
    Scenario: Advanced search plot by Interments Qty
        When I click Advanced search button
        And I enter interments qty from "<TEST_ADVANCE_INTERMENTS_FROM>" to "<TEST_ADVANCE_INTERMENTS_TO>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information

    @advance-search-combined @p0
    Scenario: Advanced search plot by multiple filters combined - Section B Row A Monumental
        When I click Advanced search button
        And I select section "<TEST_ADVANCE_SECTION_B>" in advanced search
        And I select row "<TEST_ADVANCE_ROW_B>" in advanced search
        And I select plot type "<TEST_ADVANCE_PLOT_TYPE>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information
        When I click on first plot from search results
        Then I should see plot details sidebar
        When I click Edit plot button
        Then I should see plot type "<TEST_ADVANCE_PLOT_TYPE>" in edit plot page
        And I close edit plot page

    @advance-search-combined-price @p0
    Scenario: Advanced search plot by Section B Row A with Price filter
        When I click Advanced search button
        And I select section "<TEST_ADVANCE_SECTION_B_ROW_A>" in advanced search
        And I select row "<TEST_ADVANCE_ROW_A_ROW_A>" in advanced search
        And I enter price "<TEST_ADVANCE_PRICE>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information

    @advance-search-combined-capacity @p0
    Scenario: Advanced search plot by Section A Row A with high Burial capacity
        When I click Advanced search button
        And I select section "<TEST_ADVANCE_SECTION_A>" in advanced search
        And I select row "<TEST_ADVANCE_ROW_A>" in advanced search
        And I enter burial capacity "<TEST_ADVANCE_BURIAL_CAPACITY>" in advanced search
        And I enter cremation capacity "<TEST_ADVANCE_CREMATION_CAPACITY>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information
