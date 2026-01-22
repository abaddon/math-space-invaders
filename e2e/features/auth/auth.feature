Feature: Authentication
  As a player
  I want to sign up and log in
  So that my game progress is saved

  Background:
    Given I am on the authentication page

  # --- Sign Up Scenarios ---

  @smoke @unauthenticated
  Scenario: Successful signup with valid credentials
    When I switch to the sign up tab
    And I enter a new username and password
    And I click the submit button
    Then I should be redirected to the game
    And I should see the game canvas

  @unauthenticated
  Scenario: Signup fails with short username
    When I switch to the sign up tab
    And I enter username "ab" and password "pass123"
    And I confirm the password "pass123"
    And I click the submit button
    Then I should see an error containing "at least 3 characters"

  @unauthenticated
  Scenario: Signup fails with short password
    When I switch to the sign up tab
    And I enter username "testuser" and password "123"
    And I confirm the password "123"
    And I click the submit button
    Then I should see an error containing "at least 4 characters"

  @unauthenticated
  Scenario: Signup fails with password mismatch
    When I switch to the sign up tab
    And I enter username "testuser" and password "pass123"
    And I confirm the password "different"
    And I click the submit button
    Then I should see an error containing "do not match"

  @unauthenticated
  Scenario: Signup fails with invalid username characters
    When I switch to the sign up tab
    And I enter username "user@name!" and password "pass123"
    And I confirm the password "pass123"
    And I click the submit button
    Then I should see an error containing "letters, numbers"

  # --- Sign In Scenarios ---

  @smoke @unauthenticated
  Scenario: Login fails with nonexistent user
    When I enter username "nonexistent_user_xyz" and password "anypassword"
    And I click the submit button
    Then I should see an error containing "Invalid"

  @unauthenticated
  Scenario: Login fails with empty username
    When I enter username "" and password "password123"
    And I click the submit button
    Then I should see an error containing "enter a username"

  @unauthenticated
  Scenario: Login fails with empty password
    When I enter username "testuser" and password ""
    And I click the submit button
    Then I should see an error containing "enter a password"

  # --- Session Persistence Scenarios ---

  @authenticated
  Scenario: Session persists after page reload
    Given I am logged in
    When I reload the page
    Then I should still be on the game screen
    And I should not see the login form

  @authenticated
  Scenario: Session persists after navigation
    Given I am logged in
    When I navigate away and return
    Then I should still be on the game screen

  # --- Logout Scenarios ---

  @authenticated
  Scenario: User can logout
    Given I am logged in
    When I click the logout button
    Then I should be redirected to the login page
    And the auth token should be cleared from localStorage

  # --- Protected Routes ---

  @unauthenticated
  Scenario: Unauthenticated user sees login screen
    Given I have no active session
    When I navigate to the app
    Then I should see the authentication page
