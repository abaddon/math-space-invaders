Feature: Leaderboard
  As a player
  I want to view the leaderboard
  So that I can see top scores and compare my performance

  Background:
    Given I am logged in

  # --- View Leaderboard Scenarios ---

  @smoke @authenticated
  Scenario: View global leaderboard with top scores
    Given the leaderboard has seeded scores
    When I open the leaderboard from the menu
    Then I should see entries with nicknames and scores
    And scores should be sorted highest-first

  @authenticated
  Scenario: Score appears in leaderboard after game over
    Given I am on the game screen
    When I start a new game
    And I answer one question correctly
    And I lose all my lives
    Then I should see the game over screen
    When I open the leaderboard from game over
    Then I should see my score in the leaderboard

  # --- Close Leaderboard Scenario ---

  @authenticated
  Scenario: Close leaderboard returns to menu
    Given the leaderboard is open from menu
    When I close the leaderboard
    Then I should see the game menu

  # --- Empty State Scenario ---

  @authenticated
  Scenario: Empty leaderboard shows message
    Given the leaderboard has no seeded scores
    When I open the leaderboard from the menu
    Then I should see the empty state message
