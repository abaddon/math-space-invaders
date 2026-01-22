# Feature Landscape: E2E Testing Patterns for Game Applications

**Domain:** Educational game application with HTML5 Canvas rendering
**Project:** Math Space Invaders Web (React 19 + TypeScript + Firebase)
**Testing Stack:** Playwright + Cucumber (Gherkin/BDD)
**Researched:** 2026-01-22

## Executive Summary

E2E testing for game applications presents unique challenges compared to standard web applications. Unlike typical DOM-based UIs, games render to HTML5 Canvas, making element-level queries impossible. This research identifies essential BDD patterns for testing game applications, focusing on user-observable behavior rather than internal game state, and strategies for testing canvas-rendered content through indirect assertions and visual comparisons.

**Key insight:** BDD scenarios for games must focus on **outcomes** (score changed, level increased, game state transitioned) rather than **actions** (clicked specific canvas coordinate). This aligns naturally with BDD's declarative philosophy.

---

## Table Stakes

Essential patterns and scenarios that any E2E test suite for this type of application must include.

### 1. Authentication Flow Testing

**Why table stakes:** Core prerequisite for all protected features. Without authentication tests, user identity and session management remain unverified.

| Pattern | Complexity | Coverage |
|---------|------------|----------|
| Sign up with valid credentials | Low | Happy path validation |
| Sign up with invalid inputs (username length, special chars, weak password) | Low | Input validation |
| Login with existing account | Low | Session creation |
| Login with wrong credentials | Low | Security validation |
| Session persistence across page refresh | Medium | Token/session management |
| Logout and session cleanup | Low | Security cleanup |

**Implementation approach:**
- Use **programmatic authentication** for test setup (don't repeat login UI flow in every test)
- Test authentication UI explicitly only in auth-specific scenarios
- Store auth state in Playwright's storage state for reuse across tests

**Gherkin pattern:**
```gherkin
Feature: User Authentication

  Scenario: New user signs up successfully
    Given I am on the signup page
    When I enter username "testuser123"
    And I enter password "securepass"
    And I click the "Sign Up" button
    Then I should see a welcome message
    And I should be redirected to the main menu
    And my session should be persisted

  Scenario Outline: Sign up validation rejects invalid inputs
    Given I am on the signup page
    When I enter username "<username>"
    And I enter password "<password>"
    And I click the "Sign Up" button
    Then I should see error "<error_message>"

    Examples:
      | username | password | error_message |
      | ab       | pass123  | Username must be 3-15 characters |
      | user@123 | pass123  | Username can only contain letters, numbers, _ and - |
      | validuser | abc     | Password must be at least 4 characters |
```

### 2. Game State Transition Testing

**Why table stakes:** Games are finite state machines. Testing transitions ensures the game loop works correctly.

| Transition | Testing Strategy | Observable Outcome |
|------------|-----------------|-------------------|
| MENU → PLAYING | Button click | Game canvas visible, HUD showing |
| PLAYING → PAUSED | Pause action | Animation stopped, pause UI visible |
| PAUSED → PLAYING | Resume action | Animation resumed |
| PLAYING → LEVEL_UP | Complete level | Level up screen, level counter incremented |
| PLAYING → GAME_OVER | Lose all lives | Game over screen, score displayed |

**Canvas testing strategy:**
Since canvas content can't be queried directly, test state transitions through:
1. **UI indicators** (HUD elements, buttons, overlays outside canvas)
2. **Data attributes** on container elements (`data-game-state="playing"`)
3. **Visual snapshots** for canvas content validation
4. **Accessibility labels** (ARIA attributes on game container)

**Gherkin pattern:**
```gherkin
Feature: Game State Management

  Scenario: Starting a new game
    Given I am logged in
    And I am on the main menu
    When I click "Start Game"
    Then the game should be in "PLAYING" state
    And the HUD should display level "1"
    And the HUD should display "3" lives
    And the score should be "0"

  Scenario: Pausing and resuming gameplay
    Given I am in an active game
    When I press the "Escape" key
    Then the game should be in "PAUSED" state
    And the pause overlay should be visible
    When I click "Resume"
    Then the game should be in "PLAYING" state
    And the pause overlay should not be visible
```

### 3. Game Mechanics Testing (Outcome-Based)

**Why table stakes:** Core gameplay must work. Focus on observable outcomes rather than pixel-perfect actions.

| Mechanic | Test Approach | Assertion |
|----------|--------------|-----------|
| Answering correctly | Trigger correct answer event | Score increases, level progress advances |
| Answering incorrectly | Trigger wrong answer event | Lives decrease or penalty applied |
| Time expiration | Wait for timer | Lives decrease, new problem presented |
| Level progression | Complete level requirements | Level counter increments, difficulty increases |
| Game over condition | Deplete all lives | Game state transitions to GAME_OVER |

**Canvas interaction alternatives:**
1. **Programmatic triggering** - Call game functions directly via `page.evaluate()`
2. **Coordinate-based clicking** - Use fixed coordinates for answer blocks (fragile but functional)
3. **Test hooks** - Add `data-testid` attributes to overlay elements that map to canvas regions
4. **Keyboard simulation** - Use keyboard shortcuts to select answers (1/2/3 keys)

**Gherkin pattern:**
```gherkin
Feature: Math Problem Solving

  Background:
    Given I am logged in as "testplayer"
    And I have started a new game

  Scenario: Answering a problem correctly
    Given the current problem is "5 + 3"
    And the correct answer is "8"
    When I select the answer block showing "8"
    Then my score should increase by 100 points
    And my progress toward next level should increase
    And a new problem should be presented

  Scenario: Answering incorrectly reduces lives
    Given I have 3 lives remaining
    And the current problem is "7 - 2"
    And the correct answer is "5"
    When I select the answer block showing "4"
    Then my lives should decrease to 2
    And the problem should reset
    And a warning animation should play

  Scenario: Time expiration penalty
    Given the current problem is displayed
    And the timer shows 5 seconds remaining
    When I wait for the timer to expire
    Then my lives should decrease by 1
    And a new problem should be presented
```

### 4. Leaderboard Testing

**Why table stakes:** Social features drive engagement. Leaderboards must accurately reflect scores and rankings.

| Scenario | Complexity | Data Requirements |
|----------|------------|------------------|
| View global leaderboard | Low | Pre-seeded test data |
| Player appears on leaderboard after high score | Medium | Test isolation + cleanup |
| Rankings update correctly | Medium | Multiple test accounts |
| Pagination works | Low | 10+ test records |
| Player profile view from leaderboard | Low | Click-through navigation |

**Data management pattern:**
- Use **test-specific Firebase namespace** or **emulator mode**
- Seed known test data before tests
- Clean up test data after tests complete

**Gherkin pattern:**
```gherkin
Feature: Global Leaderboard

  Background:
    Given the leaderboard contains test data:
      | username  | score | level | rank |
      | topplayer | 50000 | 18    | 1    |
      | midplayer | 25000 | 12    | 2    |
      | newplayer | 10000 | 6     | 3    |

  Scenario: Viewing the global leaderboard
    Given I am logged in
    When I navigate to the "Leaderboard" page
    Then I should see a table with player rankings
    And the table should show columns: Rank, Player, Score, Level
    And "topplayer" should be ranked #1 with score 50000

  Scenario: Player appears after achieving high score
    Given I am logged in as "challenger"
    And I have completed a game with score 30000
    When I navigate to the "Leaderboard" page
    Then I should see "challenger" in the rankings
    And "challenger" should be ranked #2
    And "midplayer" should now be ranked #3
```

### 5. Team Features Testing

**Why table stakes:** Team functionality is a core feature requiring comprehensive coverage.

| Scenario | Complexity | Key Validations |
|----------|------------|----------------|
| Create public team | Medium | Slug generation, team page accessible |
| Create private team with password | Medium | Password hashing, join flow requires password |
| Join team via shareable link | Medium | URL routing, membership created |
| View team leaderboard | Medium | Aggregate scoring, member rankings |
| Team member management (promote, remove) | High | Role permissions, state updates |

**Gherkin pattern:**
```gherkin
Feature: Team Management

  Scenario: Creating a public team
    Given I am logged in as "teamlead"
    When I navigate to "Create Team"
    And I enter team name "Math Champions"
    And I select team type "Public"
    And I click "Create Team"
    Then I should see "Team created successfully"
    And I should be redirected to the team page for "math-champions"
    And I should be listed as team "Owner"

  Scenario: Joining a private team with password
    Given a private team "Elite Squad" exists with password "secret123"
    And I am logged in as "newmember"
    When I navigate to the team join page for "elite-squad"
    And I enter password "secret123"
    And I click "Join Team"
    Then I should see "Successfully joined team"
    And I should appear in the team members list
    And my role should be "Member"

  Scenario: Viewing team leaderboard
    Given I am a member of team "Math Wizards"
    And the team has members with scores:
      | member   | score |
      | wizard1  | 45000 |
      | wizard2  | 38000 |
      | wizard3  | 22000 |
    When I navigate to the team leaderboard
    Then I should see team rankings with "wizard1" in first place
    And the team total score should be "105000"
```

---

## Differentiators

Advanced patterns that elevate test quality, maintainability, and confidence beyond baseline coverage.

### 1. Visual Regression Testing for Canvas Content

**Value proposition:** Ensures canvas-rendered game elements (starship, projectiles, answer blocks, particles) render correctly across browsers and changes.

**Implementation:**
- Use Playwright's `toMatchSnapshot()` with canvas screenshots
- Mask dynamic regions (timer, score that changes)
- Define pixel tolerance thresholds for anti-aliasing differences
- Store baseline snapshots in version control

**Complexity:** Medium-High

**Gherkin integration:**
```gherkin
Scenario: Game canvas renders correctly
  Given I am in an active game
  When I take a snapshot of the game canvas
  Then the canvas should match the baseline snapshot
  And no visual regressions should be detected
```

**Reference:** [Playwright Visual Regression Testing](https://playwright.dev/docs/test-snapshots), [Visual Testing with Playwright](https://www.browserstack.com/guide/playwright-visual-regression-testing)

### 2. Scenario Outlines with Data Tables for Difficulty Progression

**Value proposition:** Efficiently tests all 18 tiers and 8 operation types without duplicating scenarios.

**Pattern:**
```gherkin
Scenario Outline: Math problems scale with difficulty tiers
  Given I am at difficulty tier <tier>
  When I view the current problem
  Then the operation type should be "<operation>"
  And the number range should be "<range>"
  And the time limit should be "<time>" seconds

  Examples:
    | tier | operation    | range      | time |
    | 1    | Addition     | 1-9        | 10   |
    | 2    | Addition     | 1-9        | 9    |
    | 3    | Addition     | 1-9        | 8    |
    | 4    | Subtraction  | 1-9        | 10   |
    | 7    | Multiplication | 1-9      | 10   |
    | 13   | Fractions    | 1-9        | 10   |
    | 16   | Percentages  | 1-99       | 10   |
```

**Complexity:** Low-Medium

**Benefits:**
- Tests all progression tiers with single scenario definition
- Easy to add new tiers without code duplication
- Readable specification of difficulty system

### 3. Background Setup for Game State Seeding

**Value proposition:** Reduces test setup duplication, improves readability, and speeds execution.

**Pattern:**
```gherkin
Feature: Level Progression

  Background:
    Given I am logged in as "testplayer"
    And I am at level 5 with score 12000
    And I have 3 lives remaining
    And there are 2 correct answers until level up

  Scenario: Leveling up after reaching target
    When I answer the next 2 problems correctly
    Then I should see the "Level Up" screen
    And my level should be 6
    And my time limit should decrease

  Scenario: Game over before leveling up
    When I answer the next 3 problems incorrectly
    Then I should see the "Game Over" screen
    And my final score should be recorded
```

**Complexity:** Low

**Implementation:**
Use Playwright's `page.evaluate()` to inject game state programmatically rather than playing through UI.

### 4. Tag-Based Test Organization and Selective Execution

**Value proposition:** Run subset of tests in CI (smoke tests), or focus on feature areas during development.

**Pattern:**
```gherkin
@smoke @critical
Feature: Core Authentication

@smoke @game
Scenario: Starting a game from menu
  ...

@team @integration
Scenario: Multi-user team collaboration
  ...

@slow @visual-regression
Scenario: Canvas rendering across browsers
  ...
```

**CI configuration:**
```bash
# Smoke tests (fast, run on every commit)
npm run test:e2e -- --tags "@smoke"

# Full suite (run nightly)
npm run test:e2e

# Visual regression (run on release candidate)
npm run test:e2e -- --tags "@visual-regression"
```

**Complexity:** Low

**Reference:** [Cucumber Tags](https://cucumber.io/docs/cucumber/api/)

### 5. Accessibility Testing Integration

**Value proposition:** Ensures game is usable with keyboard navigation and screen readers where applicable.

**Pattern:**
```gherkin
@accessibility
Feature: Keyboard Navigation

  Scenario: Playing game with keyboard only
    Given I am in an active game
    When I press "1" key
    Then the first answer block should be selected
    When I press "2" key
    Then the second answer block should be selected
    When I press "Escape" key
    Then the game should pause

@accessibility
Scenario: Screen reader announces game state changes
  Given I am using a screen reader
  When the game state changes to "LEVEL_UP"
  Then the screen reader should announce "Level Up! You are now on level 2"
```

**Complexity:** Medium

**Implementation:**
- Use Playwright's accessibility tree inspection
- Verify ARIA labels and roles
- Test focus management

**Reference:** [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

### 6. Parallel Test Execution with Shared State Management

**Value proposition:** Speeds up test execution by running scenarios in parallel without test interference.

**Pattern:**
- Each test worker gets isolated Firebase namespace or uses emulator
- Tests create unique usernames with timestamps: `testuser_${Date.now()}_${workerIndex}`
- Teams use unique slugs to prevent collisions

**Complexity:** Medium-High

**Configuration:**
```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,
  testDir: './e2e',
});
```

**Reference:** [Playwright Parallelization](https://playwright.dev/docs/test-parallel), [Best Practices for Playwright 2026](https://www.browserstack.com/guide/playwright-best-practices)

---

## Anti-Features

Patterns to explicitly avoid based on industry best practices and common pitfalls.

### 1. Over-Specific Canvas Coordinate Testing

**Anti-pattern:**
```gherkin
# BAD: Brittle, implementation-dependent
Scenario: Clicking answer block
  When I click canvas coordinates (320, 180)
  Then the answer should be selected
```

**Why avoid:**
- Canvas coordinates change with screen size, window dimensions
- Breaks when game layout is adjusted
- Not human-readable - what is (320, 180)?
- Violates BDD principle of describing behavior, not implementation

**Instead:**
```gherkin
# GOOD: Declarative, resilient to UI changes
Scenario: Selecting the correct answer
  Given the current problem is "5 + 3"
  When I select the answer "8"
  Then my score should increase
```

**Implementation:** Use test hooks or keyboard shortcuts (1/2/3 keys) to select answers programmatically.

**Reference:** [Writing Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/), [Cucumber Anti-Patterns](https://cucumber.io/blog/bdd/cucumber-anti-patterns-part-two/)

### 2. Testing Game Physics and Rendering Details

**Anti-pattern:**
```gherkin
# BAD: Testing internal implementation
Scenario: Projectile trajectory calculation
  When player fires projectile
  Then projectile velocity should be 5 pixels per frame
  And projectile should follow parabolic arc
  And collision detection should use AABB algorithm
```

**Why avoid:**
- E2E tests verify user-observable behavior, not algorithms
- Physics calculations belong in unit tests
- Slows down E2E suite with unnecessary detail
- Makes tests fragile to refactoring

**Instead:**
- **Unit test** physics calculations (already have 169 unit tests with Vitest)
- **E2E test** observable outcomes (score changed, game state transitioned)

**Correct E2E scope:**
```gherkin
# GOOD: User-observable outcome
Scenario: Shooting correct answer
  When I shoot the block with the correct answer
  Then the block should disappear
  And my score should increase
  And a new problem should appear
```

**Reference:** [End-to-End Testing Best Practices](https://www.bunnyshell.com/blog/best-practices-for-end-to-end-testing-in-2025/), [Optimizing E2E Testing](https://dev.to/quave/optimizing-end-to-end-testing-strategies-for-speed-reliability-and-efficiency-1idh)

### 3. UI-Heavy Imperative Scenarios

**Anti-pattern:**
```gherkin
# BAD: Step-by-step UI instructions
Scenario: Creating a team
  Given I am logged in
  When I click the "Teams" menu item
  And I click the "Create Team" button
  And I type "My Team" in the "Team Name" field
  And I click the "Public" radio button
  And I click the "Create" button
  And I wait 2 seconds
  Then I should see "Team created"
```

**Why avoid:**
- Tests UI navigation, not business behavior
- Breaks when UI restructures (menu becomes dropdown, button text changes)
- Hard to read - obscures what's actually being tested
- Slow - every test repeats full navigation flow

**Instead:**
```gherkin
# GOOD: Declarative, focused on outcome
Scenario: Creating a public team
  Given I am logged in
  When I create a team named "My Team" as "Public"
  Then I should see the team page for "my-team"
  And I should be the team owner
```

**Implementation:** Step definition handles UI navigation details, test describes intent.

**Reference:** [Declarative vs Imperative Gherkin](https://cucumber.io/blog/bdd/cucumber-anti-patterns-part-two/), [Writing Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)

### 4. Hard-Coded Waits and Sleeps

**Anti-pattern:**
```gherkin
When I click "Start Game"
And I wait 3 seconds
Then the game should be loaded
```

**Why avoid:**
- Flaky tests - 3 seconds might be enough on dev machine, not on CI
- Wastes time - if page loads in 500ms, still waits 3 seconds
- Violates Playwright best practices

**Instead:**
- Use Playwright's **auto-waiting** (waits for element to be actionable)
- Use explicit **waitFor** conditions

**Implementation:**
```typescript
// GOOD: Wait for specific condition
await page.waitForSelector('[data-game-state="playing"]');
await page.waitForLoadState('networkidle');
await expect(page.locator('.hud')).toBeVisible();
```

**Reference:** [Playwright Auto-Waiting](https://playwright.dev/docs/actionability), [E2E Testing Anti-Patterns](https://www.testdevlab.com/blog/5-test-automation-anti-patterns-and-how-to-avoid-them)

### 5. Testing Every Edge Case at E2E Level

**Anti-pattern:**
- Testing all 18 tiers * 8 operation types * 3 digit complexities = 432 combinations via UI
- Testing username validation with 50+ invalid input variations
- Testing every Firebase error condition via E2E flow

**Why avoid:**
- E2E tests should be 5-10% of total test suite (testing pyramid)
- Slow execution leads to CI bottlenecks
- Redundant with unit/integration tests
- Expensive to maintain

**Instead:**
- **Unit tests:** Edge cases, validation logic, error conditions (169 tests exist)
- **E2E tests:** Critical user journeys, integration smoke tests (5-10 key scenarios)

**E2E test selection criteria:**
- Does it represent a critical user journey?
- Does it exercise integration between multiple systems (UI + Firebase + game engine)?
- Would failure severely impact users?

**Reference:** [End-to-End Testing Guide](https://talent500.com/blog/end-to-end-testing-guide/), [Master E2E Testing Best Practices](https://www.accelq.com/blog/what-is-end-to-end-e2e-testing/)

### 6. Repeating Login Flow in Every Test

**Anti-pattern:**
```gherkin
# Repeated in every feature file
Scenario: [Any feature]
  Given I navigate to login page
  And I enter username "testuser"
  And I enter password "testpass"
  And I click "Login"
  When I [actual test action]
  Then [actual test assertion]
```

**Why avoid:**
- Wastes 5-10 seconds per test
- Suite of 50 tests = 4-8 minutes wasted on repeated logins
- Breaks when login UI changes

**Instead:**
- Use **Playwright storage state** to authenticate once and reuse session
- Use **programmatic authentication** via API/Firebase SDK

**Implementation:**
```typescript
// playwright.config.ts - Global setup
export default defineConfig({
  use: {
    storageState: 'auth.json', // Reuse authenticated session
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global.setup\.ts/,
    },
    {
      name: 'authenticated tests',
      dependencies: ['setup'],
      use: { storageState: 'auth.json' },
    },
  ],
});
```

**Reference:** [Playwright Authentication Best Practices](https://playwright.dev/docs/auth), [Firebase E2E Testing with Playwright](https://github.com/nearform/playwright-firebase), [Building Comprehensive E2E Test Suite](https://dev.to/bugslayer/building-a-comprehensive-e2e-test-suite-with-playwright-lessons-from-100-test-cases-171k)

---

## Example Gherkin Scenarios

Concrete, production-ready examples for Math Space Invaders core features.

### Example 1: Complete Authentication Journey

```gherkin
@smoke @critical
Feature: User Authentication and Session Management

  Rule: New users can create accounts with valid credentials

    Scenario: Successful signup creates user profile
      Given I am on the signup page
      When I sign up with username "mathwiz42" and password "secure123"
      Then I should be logged in
      And I should see the main menu
      And my profile should show:
        | field        | value     |
        | username     | mathwiz42 |
        | highScore    | 0         |
        | bestLevel    | 0         |
        | gamesPlayed  | 0         |

    Scenario Outline: Signup validation prevents invalid inputs
      Given I am on the signup page
      When I attempt to sign up with username "<username>" and password "<password>"
      Then I should see error message "<error>"
      And I should remain on the signup page

      Examples:
        | username       | password | error                                           |
        | ab             | pass123  | Username must be 3-15 characters                |
        | thisisaverylongusername | pass | Username must be 3-15 characters       |
        | user@name      | pass123  | Username can only contain letters, numbers, _ and - |
        | validuser      | abc      | Password must be at least 4 characters          |

  Rule: Existing users can log in and sessions persist

    Background:
      Given a user exists with username "existinguser" and password "mypassword"

    Scenario: Successful login with correct credentials
      Given I am on the login page
      When I log in with username "existinguser" and password "mypassword"
      Then I should be logged in
      And I should see "Welcome back, existinguser!"

    Scenario: Login fails with incorrect password
      Given I am on the login page
      When I log in with username "existinguser" and password "wrongpassword"
      Then I should see error "Invalid username or password"
      And I should remain on the login page

    Scenario: Session persists after page refresh
      Given I am logged in as "existinguser"
      When I refresh the page
      Then I should still be logged in
      And I should see my username in the header

    Scenario: Logout clears session
      Given I am logged in as "existinguser"
      When I click "Logout"
      Then I should be logged out
      And I should be redirected to the login page
      When I refresh the page
      Then I should still be logged out
```

### Example 2: End-to-End Gameplay Flow

```gherkin
@smoke @game
Feature: Complete Gameplay Experience

  Background:
    Given I am logged in as "gamer123"

  Scenario: Playing through first level successfully
    Given I am on the main menu
    When I start a new game
    Then the game state should be "PLAYING"
    And I should see:
      | element      | value |
      | level        | 1     |
      | lives        | 3     |
      | score        | 0     |
      | time limit   | 10    |

    When I correctly solve 10 problems
    Then I should see the "Level Up!" screen
    And my level should be "2"
    And my score should be greater than "0"

    When I click "Continue"
    Then the game state should be "PLAYING"
    And I should see level "2"

  Scenario: Game over when all lives lost
    Given I am in an active game with 1 life remaining
    When I answer incorrectly 1 time
    Then the game state should be "GAME_OVER"
    And I should see "Game Over"
    And my final score should be displayed
    And my score should be saved to the leaderboard

  Scenario: Pausing and resuming gameplay
    Given I am in an active game
    And my current score is "5000"
    When I press the "Escape" key
    Then the game state should be "PAUSED"
    And the pause menu should display:
      | option   |
      | Resume   |
      | Settings |
      | Quit     |
    And the timer should be stopped

    When I click "Resume"
    Then the game state should be "PLAYING"
    And the timer should continue from where it stopped
    And my score should still be "5000"

  Scenario: Sound settings persist during gameplay
    Given I am in an active game with sound enabled
    When I pause the game
    And I open settings
    And I toggle sound off
    And I resume the game
    Then sound effects should be muted
    When I answer a problem correctly
    Then no sound should play
```

### Example 3: Leaderboard and Social Features

```gherkin
@integration @leaderboard
Feature: Global and Team Leaderboards

  Background:
    Given the following players exist:
      | username   | highScore | bestLevel |
      | champion   | 75000     | 18        |
      | expert     | 50000     | 15        |
      | rookie     | 5000      | 3         |
    And I am logged in as "challenger"

  Scenario: Viewing global leaderboard shows top players
    When I navigate to the "Leaderboard" page
    Then I should see the leaderboard table with columns:
      | Rank | Player | Score | Level |
    And the rankings should be:
      | rank | player    | score | level |
      | 1    | champion  | 75000 | 18    |
      | 2    | expert    | 50000 | 15    |
      | 3    | rookie    | 5000  | 3     |

  Scenario: Achieving new high score updates leaderboard position
    Given my current high score is 0
    When I complete a game with score 60000
    And I navigate to the "Leaderboard" page
    Then I should see "challenger" at rank 2
    And the rankings should be:
      | rank | player     | score |
      | 1    | champion   | 75000 |
      | 2    | challenger | 60000 |
      | 3    | expert     | 50000 |

  Scenario: Clicking player opens profile modal
    Given I am on the "Leaderboard" page
    When I click on player "champion"
    Then I should see a profile modal with:
      | field          | value    |
      | username       | champion |
      | high score     | 75000    |
      | best level     | 18       |
      | games played   | [number] |
```

### Example 4: Team Management Workflows

```gherkin
@team
Feature: Creating and Managing Teams

  Background:
    Given I am logged in as "teamlead"

  Scenario: Creating a public team with shareable link
    When I navigate to "Create Team"
    And I enter team name "Algebra Masters"
    And I select team type "Public"
    And I click "Create Team"
    Then I should see "Team created successfully"
    And I should be redirected to "/teams/algebra-masters"
    And I should see:
      | element        | value          |
      | team name      | Algebra Masters |
      | team type      | Public         |
      | my role        | Owner          |
      | member count   | 1              |
    And I should see a shareable link containing "/teams/algebra-masters/join"

  Scenario: Creating a private team requires password
    When I create a team with:
      | field          | value        |
      | name           | Secret Squad |
      | type           | Private      |
      | password       | elite2026    |
    Then I should be redirected to "/teams/secret-squad"
    And the team should require password for joining

  Scenario: Joining a public team via shareable link
    Given a public team "Math Ninjas" exists at "/teams/math-ninjas"
    And I am logged in as "newmember"
    When I navigate to "/teams/math-ninjas/join"
    And I click "Join Team"
    Then I should see "Successfully joined Math Ninjas"
    And I should be redirected to "/teams/math-ninjas"
    And I should see my username in the members list
    And my role should be "Member"

  Scenario: Joining a private team requires correct password
    Given a private team "Elite Club" exists with password "secret123"
    And I am logged in as "applicant"
    When I navigate to the team join page for "elite-club"
    Then I should see a password prompt
    When I enter password "wrongpassword"
    And I click "Join Team"
    Then I should see error "Incorrect password"
    When I enter password "secret123"
    And I click "Join Team"
    Then I should see "Successfully joined Elite Club"

  Scenario Outline: Team owners can manage member roles
    Given I am the owner of team "My Team"
    And user "<member>" is a "<current_role>" of the team
    When I navigate to team settings
    And I change "<member>" role to "<new_role>"
    Then "<member>" should have role "<new_role>"
    And "<member>" should have permissions: <permissions>

    Examples:
      | member   | current_role | new_role | permissions                    |
      | helper   | Member       | Admin    | Manage members, Edit settings  |
      | trusted  | Member       | Owner    | Full control, Delete team      |
      | downgrade | Admin       | Member   | View only                      |

  Scenario: Viewing team leaderboard shows aggregated scores
    Given I am a member of team "Sum Champions"
    And the team has the following members:
      | username | highScore |
      | ace      | 40000     |
      | pro      | 30000     |
      | novice   | 10000     |
    When I navigate to the team leaderboard
    Then I should see team members ranked by score:
      | rank | player | score |
      | 1    | ace    | 40000 |
      | 2    | pro    | 30000 |
      | 3    | novice | 10000 |
    And the team total score should be "80000"
```

### Example 5: Difficulty Progression System

```gherkin
@game @progression
Feature: 18-Tier Difficulty Progression

  Background:
    Given I am logged in as "learner"

  Scenario Outline: Each tier presents appropriate operation types
    Given I am at difficulty tier <tier>
    When I start a new game
    Then the problem should use operation "<operation>"
    And the numbers should be in range "<number_range>"
    And the time limit should be <time_limit> seconds

    Examples:
      | tier | operation          | number_range | time_limit |
      | 1    | Addition           | 1-9          | 10         |
      | 4    | Subtraction        | 1-9          | 10         |
      | 7    | Multiplication     | 1-9          | 10         |
      | 10   | Division           | 1-9          | 10         |
      | 13   | Fractions          | 1-9          | 10         |
      | 16   | Percentages        | 1-99         | 10         |
      | 18   | Metric Conversion  | 1-500        | 10         |

  Scenario: Time limit decreases within each tier
    Given I am at level 1 of a tier with 10 second time limit
    When I advance to level 2 of the same tier
    Then the time limit should decrease by 10%
    And the time limit should be 9 seconds
    When I advance to level 3 of the same tier
    Then the time limit should be 8 seconds

  Scenario: Time limit resets when advancing to new tier
    Given I am at level 3 of tier 3 with 8 second time limit
    When I complete level 3 and advance to tier 4
    Then the time limit should reset to 10 seconds
    And the operation type should change to "Subtraction"

  Scenario: Progressing through 10 correct answers advances level
    Given I am at level 5 with 0 correct answers this level
    When I correctly answer 10 problems
    Then I should see the "Level Up!" screen
    And my level should be 6
    And my correct answer count should reset to 0
```

---

## Implementation Guidance

### Canvas Testing Strategy Summary

Since Math Space Invaders renders to HTML5 Canvas, element queries like `getByRole('button', { name: 'Answer: 8' })` won't work. Use these strategies:

1. **Test observable UI outside canvas** (HUD, modals, overlays)
2. **Add data attributes to container** (`data-game-state`, `data-current-level`)
3. **Use keyboard shortcuts** (1/2/3 keys to select answers)
4. **Programmatic state injection** via `page.evaluate()` for test setup
5. **Visual snapshots** for canvas content validation
6. **Test outcomes, not rendering** (score changed, not "projectile at coordinates X,Y")

### Page Object Model Pattern

```typescript
// pages/GamePage.ts
export class GamePage {
  constructor(private page: Page) {}

  async startGame() {
    await this.page.click('text=Start Game');
    await this.page.waitForSelector('[data-game-state="playing"]');
  }

  async selectAnswerByKeyboard(answerIndex: 1 | 2 | 3) {
    await this.page.keyboard.press(String(answerIndex));
  }

  async getScore(): Promise<number> {
    const scoreText = await this.page.textContent('[data-testid="score"]');
    return parseInt(scoreText || '0');
  }

  async getLives(): Promise<number> {
    const livesText = await this.page.textContent('[data-testid="lives"]');
    return parseInt(livesText || '0');
  }

  async getCurrentGameState(): Promise<string> {
    return await this.page.getAttribute('[data-game-container]', 'data-game-state') || '';
  }
}
```

### Step Definition Example

```typescript
// steps/gameplay.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { GamePage } from '../pages/GamePage';

Given('I am in an active game', async function() {
  this.gamePage = new GamePage(this.page);
  await this.gamePage.startGame();
});

When('I select the answer {string}', async function(answer: string) {
  // Use test hook or keyboard shortcut instead of clicking canvas coordinates
  await this.page.evaluate((ans) => {
    window.gameTestHooks?.selectAnswer(ans);
  }, answer);
});

Then('my score should increase', async function() {
  const newScore = await this.gamePage.getScore();
  expect(newScore).toBeGreaterThan(this.previousScore || 0);
  this.previousScore = newScore;
});
```

---

## Confidence Assessment

| Area | Level | Rationale |
|------|-------|-----------|
| BDD patterns for games | **HIGH** | Verified with [Playwright documentation](https://playwright.dev/docs/test-snapshots), [Cucumber official guides](https://cucumber.io/docs/bdd/better-gherkin/), and 2026-dated sources |
| Canvas testing strategies | **MEDIUM** | Found experimental library [canvas-grid](https://dev.to/fonzi/testing-html5-canvas-with-canvasgrid-and-playwright-5h4c) and [BioCatch object detection approach](https://medium.com/@BioCatchTechBlog/automating-canvas-testing-with-playwright-and-object-detection-models-8d58235b17b7), but limited production examples |
| Playwright + Cucumber integration | **HIGH** | Well-documented pattern with [official guides](https://www.browserstack.com/guide/playwright-cucumber) and [multiple 2026 tutorials](https://medium.com/@suryaaprabhaa/quick-start-guide-setting-up-a-playwright-project-with-typescript-and-cucumber-for-ui-test-1047fa7b7b24) |
| Firebase E2E testing | **MEDIUM-HIGH** | [@nearform/playwright-firebase plugin](https://github.com/nearform/playwright-firebase) provides solid foundation, verified with [2026 best practices](https://www.browserstack.com/guide/playwright-best-practices) |
| Anti-patterns | **HIGH** | Extensively documented in [Cucumber official anti-patterns series](https://cucumber.io/blog/bdd/cucumber-anti-patterns-part-two/), [Modern E2E Architecture guide](https://www.thunders.ai/articles/modern-e2e-test-architecture-patterns-and-anti-patterns-for-a-maintainable-test-suite) |

---

## Sources

**BDD and Gherkin Patterns:**
- [Writing scenarios with Gherkin syntax | CucumberStudio](https://support.smartbear.com/cucumberstudio/docs/bdd/write-gherkin-scenarios.html)
- [Writing better Gherkin | Cucumber](https://cucumber.io/docs/bdd/better-gherkin/)
- [Behavior-driven development (BDD): an essential guide for 2026](https://monday.com/blog/rnd/behavior-driven-development/)
- [BDD Basics: Gherkin Language and Rules for UI Scenarios](https://jignect.tech/understanding-the-bdd-gherkin-language-main-rules-for-bdd-ui-scenarios/)

**Playwright + Cucumber Integration:**
- [Playwright and Cucumber Automation | BrowserStack](https://www.browserstack.com/guide/playwright-cucumber)
- [How To Integrate Playwright With Cucumber | TestMu AI](https://www.testmu.ai/blog/playwright-cucumber/)
- [Quick Start Guide: Playwright with TypeScript and Cucumber](https://medium.com/@suryaaprabhaa/quick-start-guide-setting-up-a-playwright-project-with-typescript-and-cucumber-for-ui-test-1047fa7b7b24)

**Canvas Testing:**
- [HTML5 Canvas Testing with CanvasGrid and Playwright](https://dev.to/fonzi/testing-html5-canvas-with-canvasgrid-and-playwright-5h4c)
- [Automating Canvas Testing with Playwright and Object Detection Models | BioCatch](https://medium.com/@BioCatchTechBlog/automating-canvas-testing-with-playwright-and-object-detection-models-8d58235b17b7)
- [playwright-canvas: Proof-of-concept for HTML Canvas testing](https://github.com/satelllte/playwright-canvas)

**Visual Regression Testing:**
- [Snapshot Testing with Playwright in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-snapshot-testing)
- [Visual comparisons | Playwright Official Docs](https://playwright.dev/docs/test-snapshots)
- [A Complete Guide To Playwright Visual Regression Testing](https://www.testmu.ai/learning-hub/playwright-visual-regression-testing/)

**Firebase Authentication Testing:**
- [playwright-firebase Plugin | Nearform](https://github.com/nearform/playwright-firebase)
- [Developing a Playwright-Firebase Plugin | Nearform](https://nearform.com/insights/developing-a-playwright-firebase-plugin-to-enable-rapid-test-suite-authentication/)
- [Authentication | Playwright Official Docs](https://playwright.dev/docs/auth)
- [15 Best Practices for Playwright testing in 2026](https://www.browserstack.com/guide/playwright-best-practices)

**E2E Testing Best Practices:**
- [End-To-End Testing: 2026 Guide for E2E Testing](https://www.leapwork.com/blog/end-to-end-testing)
- [End-to-End (E2E) Testing Guide: Best Practices & Strategies](https://talent500.com/blog/end-to-end-testing-guide/)
- [Best Practices for End-to-End Testing in 2025](https://www.bunnyshell.com/blog/best-practices-for-end-to-end-testing-in-2025/)
- [Optimizing End-to-End Testing: Strategies for Speed, Reliability, and Efficiency](https://dev.to/quave/optimizing-end-to-end-testing-strategies-for-speed-reliability-and-efficiency-1idh)

**Anti-Patterns:**
- [Modern E2E Test Architecture: Patterns and Anti-Patterns](https://www.thunders.ai/articles/modern-e2e-test-architecture-patterns-and-anti-patterns-for-a-maintainable-test-suite)
- [Cucumber anti-patterns (part #2) | Cucumber](https://cucumber.io/blog/bdd/cucumber-anti-patterns-part-two/)
- [Cucumber Anti-Patterns](https://www.thinkcode.se/blog/2016/06/22/cucumber-antipatterns)
- [Avoiding Test Automation Pitfalls: 5 Common Anti-Patterns](https://www.testdevlab.com/blog/5-test-automation-anti-patterns-and-how-to-avoid-them)

**Scenario Outlines and Data Tables:**
- [Scenarios (Scenario Outlines) | BDD For All](https://accenture.github.io/bdd-for-all/SCENARIOS.html)
- [Data Tables in Cucumber](https://toolsqa.com/cucumber/data-tables-in-cucumber/)
- [Cucumber Data Tables | Baeldung](https://www.baeldung.com/cucumber-data-tables)

---

**Last updated:** 2026-01-22
**Confidence:** HIGH for general patterns, MEDIUM for canvas-specific strategies
