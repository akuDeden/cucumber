@p0 @sales @authenticated
Feature: Sales Management (Authenticated)
  As a cemetery administrator
  I want to create and manage sales records
  So that I can track plot sales and customer purchases

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  @create-sales @smoke @p0
  Scenario: Create new sale with multiple items and verify total calculation
    When I navigate to Sales page
    And I validate sales table is loaded
    And I click Create Sale button
    And I fill sale reference with "<TEST_SALES_REFERENCE>"
    And I fill sale issue date with "<TEST_SALES_ISSUE_DATE>"
    And I fill sale due date with "<TEST_SALES_DUE_DATE>"
    And I fill sale note with "<TEST_SALES_NOTE>"
    And I add purchaser person "<TEST_SALES_PURCHASER>"
    And I add sale items with following details:
      | description | related_plot | quantity | price    | discount |
      | item a      | B F 1        | 1        | 1313.56  | 0        |
      | item b      | B F 2        | 1        | 178.35   | 0        |
      | item c      | B F 3        | 2        | 32.95    | 0        |
      | item d      | B F 4        | 1        | 105.08   | 0        |
      | item e      | B F 5        | 1        | 101.21   | 0        |
    And I select sale owner
    Then I should see sale summary with following values:
      | subtotal | $1,764.10 |
      | discount | $0.00     |
      | vat      | $176.41   |
      | total    | $1,940.51 |
    When I click Create button
    Then the sale should be created successfully
