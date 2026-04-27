@p0 @regional-settings @authenticated
Feature: Regional Settings Management (Authenticated)
  As a cemetery administrator
  I want to manage regional label settings for my organisation
  So that the system uses terminology appropriate for my region

  Background:
    Given I am on the Chronicle login page
    When I enter email "<TEST_EMAIL>"
    And I enter password "<TEST_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully

  @update-regional-labels @smoke @p0
  Scenario: Update regional settings labels and verify they persist
    When I navigate to My Organisation Regional Settings
    And I update the regional settings labels with following values
      | plot    | Lot         |
      | forSale | Available   |
      | roi     | Right       |
    And I save the regional settings
    Then the regional settings labels should be updated successfully
    And the labels should persist after page reload

  @restore-regional-labels @p0
  Scenario: Restore regional settings labels to default values
    When I navigate to My Organisation Regional Settings
    And I update the regional settings labels with following values
      | plot    | Plot        |
      | forSale | For Sale    |
      | roi     | ROI         |
    And I save the regional settings
    Then the regional settings labels should be updated successfully
    And the labels should persist after page reload
