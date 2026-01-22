Feature: Leaderboard
  As a player
  I want to view the leaderboard
  So that I can see top scores and compare my performance

  Background:
    Given I am logged in

  # --- View Leaderboard Scenarios ---

  @smoke @authenticated
  Scenario: View global leaderboard from menu
    Given I am on the game menu
    When I open the leaderboard from the menu
    Then I should see the leaderboard modal
    And the leaderboard should display scores sorted highest-first

  @authenticated
  Scenario: Score appears in leaderboard after game over
    Given I am on the game menu
    When I click the start game button
    And I wait for the game to start
    And I answer one question correctly
    And I click wrong answers until game over
    Then I should see the Game Over screen
    When I open the leaderboard from game over
    Then I should see my score in the leaderboard

  # --- Close Leaderboard Scenario ---

  @authenticated
  Scenario: Close leaderboard returns to menu
    Given the leaderboard is open from menu
    When I close the leaderboard
    Then I should see the main menu
