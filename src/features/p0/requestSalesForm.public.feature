@request-sales-form @public @p0x
Feature: Request Sales Form - Public Plot Purchase
  As a public user
  I want to request to purchase a cemetery plot
  So that I can secure a plot for future use

  Background:
    # Cemetery name is now centralized and dynamically built from CEMETERY_CONFIG + region
    Given I am on the sell plots page for cemetery

  # ============================================
  # SCENARIO 1: PRE-NEED PURCHASE (WORKING ✅)
  # Complete flow dari plot selection sampai konfirmasi
  # ============================================
  @request-sales-form-pre-need @smoke
  Scenario: Submit PRE-NEED purchase request for available plot
    When I expand the first section in sell plots page
    And I find a plot with purchase option available
    And I should see a Request to Buy button on the plot details page
    When I click the Request to Buy button
    And I select Pre-need plot purchase option
    Then I should be on the request form page
    When I continue from the description section
    And I fill the ROI Applicant form with valid data
    And I continue from the ROI Applicant section
    And I fill the ROI form with valid data
    And I continue from the ROI section
    And I agree to the terms and conditions
    And I continue from the terms section
    And I add a signature
    And I continue from the signature section
    And I submit the request form
    Then I should see a confirmation dialog
    And the confirmation should show that the request was sent successfully

  # ============================================
  # SCENARIO 2: AT-NEED PURCHASE (COMPLETE ✅)
  # Flow untuk at-need berbeda: ROI section dulu, baru ROI Applicant
  # Sections: ROI → ROI Applicant → ROI Holder → Deceased → Event Service → Terms → Signature → Submit
  # ============================================
  @request-sales-form-at-need @smoke
  Scenario: Submit AT-NEED purchase request for available plot
    Given I am on the sell plots page for cemetery
    When I expand the first section in sell plots page
    And I find a plot with purchase option available
    And I should see a Request to Buy button on the plot details page
    When I click the Request to Buy button
    And I select At-need plot purchase option
    Then I should be on the request form page
    When I fill the ROI form with valid data
    And I continue from the ROI section
    And I fill the ROI Applicant form with valid data for At-need
    And I continue from the ROI Applicant section
    And I fill the ROI Holder form with valid data for At-need
    And I continue from the ROI Holder section for At-need
    And I fill the Deceased form with valid data for At-need
    And I continue from the Deceased section for At-need
    And I fill the Event Service form with valid data for At-need
    And I continue from the Event Service section for At-need
    And I add a signature
    And I continue from the signature section
    And I fill the Service form with valid data for At-need
    And I continue from the Service section for At-need
    And I submit the request form
    Then I should see a confirmation dialog
    And the confirmation should show that the request was sent successfully
