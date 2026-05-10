@p0 @invoice-from-sales-request @authenticated
Feature: Invoice from Sales Request — Admin Access Fix
  As an organization user (admin or owner)
  I want to generate an invoice from an approved sales request
  So that I can manage billing without encountering incorrect access errors

  # TC-01: Core bug fix — admin must NOT get 403 when generating invoice from request
  @tc-01 @smoke @invoice-from-sales-request-admin-generate
  Scenario: TC-01 — Admin can generate invoice from approved request
    Given I am on the Chronicle map login page
    When I enter email "<TEST_ADMIN_EMAIL>"
    And I enter password "<TEST_ADMIN_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully
    When I navigate to the admin requests page
    And I open the first approved sales request
    And I click "Generate Invoice"
    Then the invoice is created successfully
    And I do not see "You don't have access" error

  # TC-02: When invoice already exists, 400 error must say "already exists" not "access denied"
  @tc-02 @smoke @invoice-from-sales-request-already-exists
  Scenario: TC-02 — Admin sees correct error when invoice already exists
    Given I am on the Chronicle map login page
    When I enter email "<TEST_ADMIN_EMAIL>"
    And I enter password "<TEST_ADMIN_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully
    When I navigate to the admin requests page
    And I open an approved request that already has an invoice
    And I click "Generate Invoice"
    Then I see an error message containing "already exists"
    And I do not see "You don't have access to this sales request" error

  # TC-03: Regression — owner user must still be able to generate invoice
  @tc-03 @smoke @invoice-from-sales-request-owner-regression
  Scenario: TC-03 — Owner user can still generate invoice (regression check)
    Given I am on the Chronicle map login page
    When I enter email "<TEST_OWNER_EMAIL>"
    And I enter password "<TEST_OWNER_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully
    When I navigate to the owner requests page
    And I open the first approved sales request
    And I click "Generate Invoice"
    Then the invoice is created successfully
    And I do not see any access error

  # TC-04: Regression — admin must still reach the Sales menu
  @tc-04 @smoke @invoice-from-sales-request-sales-menu-regression
  Scenario: TC-04 — Admin can still access the Sales menu (regression check)
    Given I am on the Chronicle map login page
    When I enter email "<TEST_ADMIN_EMAIL>"
    And I enter password "<TEST_ADMIN_PASSWORD>"
    And I click the login button
    Then I should be logged in successfully
    When I navigate to the admin dashboard
    And I click "Sales" in the navigation menu
    Then I am taken to the Sales page
    And I do not see any access error
