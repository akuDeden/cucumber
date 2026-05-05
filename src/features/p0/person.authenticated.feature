@p0 @person @authenticated
Feature: Person Management - Authenticated
  As an authenticated user
  I want to manage person records
  So that I can maintain accurate person information in the system

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  @create
  Scenario: Create a new person with complete information
    When I navigate to the advance table page
    And I click on the PERSONS tab
    And I click the add person button
    And I fill in the person form with:
      | firstName  | <TEST_PERSON_FIRSTNAME>  |
      | lastName   | <TEST_PERSON_LASTNAME>   |
      | middleName | <TEST_PERSON_MIDDLENAME> |
      | title      | <TEST_PERSON_TITLE>      |
      | gender     | <TEST_PERSON_GENDER>     |
      | phoneM     | <TEST_PERSON_PHONE_M>    |
      | phoneH     | <TEST_PERSON_PHONE_H>    |
      | phoneO     | <TEST_PERSON_PHONE_O>    |
      | email      | <TEST_PERSON_EMAIL>      |
      | address    | <TEST_PERSON_ADDRESS>    |
      | city       | <TEST_PERSON_CITY>       |
      | state      | <TEST_PERSON_STATE>      |
      | country    | <TEST_PERSON_COUNTRY>    |
      | postCode   | <TEST_PERSON_POSTCODE>   |
      | note       | <TEST_PERSON_NOTE>       |
    And I click the save button
    Then I should see the person "<TEST_PERSON_FIRSTNAME> <TEST_PERSON_LASTNAME>" in the first row of the table

  @edit
  Scenario: Edit person with filter maintained
    When I navigate to the advance table page
    And I click on the PERSONS tab
    And I click the filter button
    And I fill in the filter form with first name "<TEST_PERSON_FIRSTNAME>" and last name "<TEST_PERSON_LASTNAME>"
    And I apply the filter
    Then I should see the person "<TEST_PERSON_FIRSTNAME> <TEST_PERSON_LASTNAME>" in the first row of the table
    When I click the first row to open person details
    And I edit the last name to "<TEST_PERSON_LASTNAME_EDITED>"
    And I click the save button
    # After save, filter should show the edited person with new last name
    And I click the filter button
    And I fill in the filter form with first name "<TEST_PERSON_FIRSTNAME>" and last name "<TEST_PERSON_LASTNAME_EDITED>"
    And I apply the filter
    Then I should see the person "<TEST_PERSON_FIRSTNAME> <TEST_PERSON_LASTNAME_EDITED>" in the first row of the table

  @add-sale-from-edit-person @smoke @p0
  Scenario: Add Sale to a person from the Edit Person page
    When I navigate to the advance table and open the second person
    And I click the ADD SALE button
    And I fill sale reference with "<TEST_SALES_REFERENCE>"
    And I select the first available item with related plot "<TEST_SALES_RELATED_PLOT>"
    When I click Create and confirm to navigate back to Edit Plot page
    Then I should see a new sale entry with reference "<TEST_SALES_REFERENCE>" on the Edit Plot page

  @delete
  Scenario: Delete person and verify not in list
    When I navigate to the advance table page
    And I click on the PERSONS tab
    # Filter to find the edited person from previous scenario
    And I click the filter button
    And I fill in the filter form with first name "<TEST_PERSON_FIRSTNAME>" and last name "<TEST_PERSON_LASTNAME_EDITED>"
    And I apply the filter
    Then I should see the person "<TEST_PERSON_FIRSTNAME> <TEST_PERSON_LASTNAME_EDITED>" in the first row of the table
    # Delete the person
    When I click the first row to open person details
    And I click the delete button
    And I confirm the deletion
    # Verify person is not in the list anymore
    Then the person "<TEST_PERSON_FIRSTNAME> <TEST_PERSON_LASTNAME_EDITED>" should not be in the list
