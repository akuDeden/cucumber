@p0 @business @authenticated
Feature: Business Management (Authenticated)
  As a cemetery administrator
  I want to manage businesses in the system
  So that I can associate businesses with cemetery operations

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  @create-business @smoke @p0
  Scenario: Add a new business from the Business tab in the advance table
    When I navigate to the Business tab in the advance table
    And I click the Add Business button
    And I fill the add business form with following details
      | cemetery     | <TEST_CEMETERY_DISPLAY_NAME>  |
      | businessName | <TEST_BUSINESS_NAME>          |
      | firstName    | <TEST_BUSINESS_FIRSTNAME>     |
      | lastName     | <TEST_BUSINESS_LASTNAME>      |
      | phone        | <TEST_BUSINESS_PHONE>         |
      | email        | <TEST_BUSINESS_EMAIL>         |
      | address      | <TEST_BUSINESS_ADDRESS>       |
    And I save the new business
    Then the new business should appear in the business table

  @edit-business @smoke @p0
  Scenario: Edit an existing business from the business table
    When I navigate to the Business tab in the advance table
    And I click the first business row in the table
    And I update the business with following details
      | phone   | <TEST_BUSINESS_EDIT_PHONE>   |
      | email   | <TEST_BUSINESS_EDIT_EMAIL>   |
      | address | <TEST_BUSINESS_EDIT_ADDRESS> |
    And I save the business changes
    Then the business should be updated successfully

  @delete-business @p0
  Scenario: Delete a business from the business table
    When I navigate to the Business tab in the advance table
    And I click the first business row in the table
    And I click the Delete Business button
    And I confirm the business deletion
    Then the business should no longer be in the table
