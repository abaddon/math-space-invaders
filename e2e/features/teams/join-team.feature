@teams
Feature: Join Team
  As a player
  I want to join existing teams
  So that I can contribute to team scores and play with friends

  Background:
    Given I am logged in

  @smoke @authenticated
  Scenario: View created team landing page
    Given I have created a public team
    When I navigate to the team page
    Then I should see the team landing page
    And I should see the team name
    And I should see the "Play for" button

  @authenticated
  Scenario: View created private team
    Given I have created a private team with password "secret123"
    When I navigate to the team page
    Then I should see the team landing page
    And I should see the "Play for" button

  @authenticated
  Scenario: View team member features
    Given I have created a public team
    When I view the team page
    Then I should see the "Play for" button
    And I should see the "View Leaderboard" button
    And I should see the "Settings" button
