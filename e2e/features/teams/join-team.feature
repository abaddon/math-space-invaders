@teams
Feature: Join Team
  As a player
  I want to join existing teams
  So that I can contribute to team scores and play with friends

  Background:
    Given I am logged in

  @smoke @authenticated
  Scenario: Join public team via link
    Given a public team "Math Stars" exists
    When I navigate to the team page
    Then I should see the team landing page
    And I should see the team name
    When I click the join team button
    Then I should see "Joined!" success message

  @authenticated
  Scenario: Join private team with correct password
    Given a private team "Secret Club" exists with password "pass123"
    When I navigate to the team page
    And I enter the team password "pass123"
    And I click the join team button
    Then I should see "Joined!" success message

  @authenticated
  Scenario: View team after joining
    Given I have joined a team
    When I view the team page
    Then I should see the "Play for" button
    And I should see the "View Leaderboard" button
