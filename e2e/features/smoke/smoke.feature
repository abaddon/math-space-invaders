Feature: Smoke Test
  Verify E2E testing infrastructure works correctly

  @smoke
  Scenario: Application loads successfully
    Given I navigate to the home page
    Then I should see the game title
