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
