@teams
Feature: Create Team
  As a player
  I want to create a team
  So that I can play with friends and track group scores

  Background:
    Given I am logged in

  @smoke @authenticated
  Scenario: Create public team successfully
    Given I am on the game screen
    When I click the create team button
    And I enter team name "Test Wizards"
    And I select "public" team privacy
    And I submit the team creation form
    Then I should see the team created success message
    And I should see a shareable team link

  @authenticated
  Scenario: Create private team with password
    Given I am on the game screen
    When I click the create team button
    And I enter team name "Secret Squad"
    And I select "private" team privacy
    And I enter team password "secret123"
    And I submit the team creation form
    Then I should see the team created success message
    And I should see a shareable team link

  @authenticated
  Scenario: Cancel team creation
    Given I am on the create team modal
    When I click the cancel button
    Then the create team modal should be closed
    And I should see the game menu
