@teams
Feature: Team Management
  As a team member
  I want to manage my team membership
  So that I can access team features and manage teams

  Background:
    Given I am logged in

  @authenticated
  Scenario: Creator sees management options
    Given I have created a public team
    When I view the team page
    Then I should see the "Play for" button
    And I should see the "View Leaderboard" button
    And I should not see the "Leave Team" button

  @authenticated
  Scenario: Creator can manage team members
    Given I have created a public team
    When I view the team page
    Then I should see the "Manage Members" button
