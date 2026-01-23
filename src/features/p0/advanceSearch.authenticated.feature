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

    @advance-search-plot @smoke @p0
    Scenario Outline: Advanced search plot by Section, Row, and Number - <section> <row> <number>
        When I click Advanced search button
        And I select section "<section>" in advanced search
        And I select row "<row>" in advanced search
        And I enter plot number "<number>" in advanced search
        And I click Search button in advanced search
        Then I should see search results containing "<section> <row> <number>"
        When I click on plot "<section> <row> <number>" from search results
        Then I should see plot sidebar with plot ID "<section> <row> <number>"
        And I should see plot details sidebar

        Examples:
            | section | row | number | description        |
            | A       | A   | 1      | High capacity plot |
            | B       | A   | 1      | Garden plot        |

    @advance-search-plot-id @p0
    Scenario Outline: Advanced search plot by Plot ID - <plotId>
        When I click Advanced search button
        And I enter plot ID "<plotId>" in advanced search
        And I click Search button in advanced search
        Then I should see search results containing "<plotId>"
        When I click on plot "<plotId>" from search results
        Then I should see plot sidebar with plot ID "<plotId>"
        And I should see plot details sidebar

        Examples:
            | plotId | description          |
            | B A 1  | Section B Row A No 1 |
            | A A 1  | Section A Row A No 1 |

    @advance-search-plot-type @p0
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
            | plotType   | description          |
            | Garden     | Garden plot type     |
            | Monumental | Monumental plot type |

    @advance-search-price @p0
    Scenario Outline: Advanced search plot by Price - <price>
        When I click Advanced search button
        And I enter price "<price>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information

        Examples:
            | price | description        |
            | 500   | Low price range    |
            | 1000  | Medium price range |

    @advance-search-capacity @p0
    Scenario Outline: Advanced search plot by Capacity - B:<burial> E:<entombment> C:<cremation>
        When I click Advanced search button
        And I enter burial capacity "<burial>" in advanced search
        And I enter entombment capacity "<entombment>" in advanced search
        And I enter cremation capacity "<cremation>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information

        Examples:
            | burial | entombment | cremation | description       |
            | 3      | 0          | 2         | High capacity     |
            | 1      | 1          | 1         | Standard capacity |

    @advance-search-interments-qty @p0
    Scenario Outline: Advanced search plot by Interments Qty - <From> to <to>
        When I click Advanced search button
        And I enter interments qty from "<From>" to "<to>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information

        Examples:
            | From | to | description        |
            | 0    | 2  | Low range (0-2)    |
            | 1    | 5  | Medium range (1-5) |

    @advance-search-combined @p0
    Scenario Outline: Advanced search plot by multiple filters - <section> <row> <plotType>
        When I click Advanced search button
        And I select section "<section>" in advanced search
        And I select row "<row>" in advanced search
        And I select plot type "<plotType>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information
        When I click on first plot from search results
        Then I should see plot details sidebar
        When I click Edit plot button
        Then I should see plot type "<plotType>" in edit plot page
        And I close edit plot page

        Examples:
            | section | row | plotType    | description           |
            | B       | A   | Monumental  | Section B Monumental  |
            | A       | A   | Columbarium | Section A Columbarium |

    @advance-search-combined-price @p0 @fail
    Scenario Outline: Advanced search plot by Section Row with Price filter - <section> <row>
        When I click Advanced search button
        And I select section "<section>" in advanced search
        And I select row "<row>" in advanced search
        And I enter price "<price>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information

        Examples:
            | section | row | price | description          |
            | B       | A   | 500   | Section B with price |
            | A       | A   | 1000  | Section A with price |

    @advance-search-combined-capacity @p0 @fail
    Scenario Outline: Advanced search plot by Section Row with Capacity - <section> <row>
        When I click Advanced search button
        And I select section "<section>" in advanced search
        And I select row "<row>" in advanced search
        And I enter burial capacity "<burialCapacity>" in advanced search
        And I enter cremation capacity "<cremationCapacity>" in advanced search
        And I click Search button in advanced search
        Then I should see search results information

        Examples:
            | section | row | burialCapacity | cremationCapacity | description        |
            | A       | A   | 3              | 2                 | High capacity plot |
            | B       | B   | 1              | 1                 | Standard capacity  |
