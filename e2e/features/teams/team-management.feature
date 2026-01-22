@teams
Feature: Team Management
  As a team member
  I want to manage my team membership
  So that I can leave teams I no longer want to be part of

  Background:
    Given I am logged in

  @authenticated
  Scenario: Leave team successfully
    Given I am a member of team "Test Team"
    When I view the team page
    And I click the leave team button
    Then I should be redirected to the home page

  @authenticated
  Scenario: Team shows join button after leaving
    Given I have left a team
    When I navigate to that team's page
    Then I should see the join button
    And I should not see the "Play for" button
