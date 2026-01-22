@gameplay
Feature: Gameplay
  As a player
  I want to play the math game
  So that I can practice arithmetic skills

  Background:
    Given I am logged in

  @game-start
  Scenario: Start new game from menu
    Given I am on the game menu
    When I click the start game button
    Then the game should be in "PLAYING" state
    And the canvas should be visible
    And I should see a math problem

  @answer-selection @correct
  Scenario: Correct answer increases score
    Given I am on the game menu
    And I start a new game
    And my score is 0
    When I click the correct answer block
    Then my score should increase

  @answer-selection @wrong
  Scenario: Wrong answer decreases lives
    Given I am on the game menu
    And I start a new game
    And I have 3 lives
    When I click the wrong answer block
    Then I should have fewer lives

  @pause-resume @keyboard
  Scenario: Pause game with Escape key
    Given I am on the game menu
    And I start a new game
    And the game is in "PLAYING" state
    When I press the Escape key
    Then the game should be in "PAUSED" state
    And I should see "PAUSED" text on screen

  @pause-resume @keyboard
  Scenario: Resume game with Escape key
    Given I am on the game menu
    And I start a new game
    And I pause the game with Escape
    When I press the Escape key
    Then the game should be in "PLAYING" state

  @pause-resume @button
  Scenario: Resume game with Resume button
    Given I am on the game menu
    And I start a new game
    And I pause the game with Escape
    When I click the Resume button
    Then the game should be in "PLAYING" state
