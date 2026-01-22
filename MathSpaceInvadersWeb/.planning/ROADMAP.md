# Roadmap: Math Space Invaders Web

**Milestone:** v1.1 E2E Testing with BDD
**Phases:** 6
**Requirements:** 36 mapped (100% coverage)

## Overview

This roadmap establishes comprehensive E2E testing infrastructure for the Math Space Invaders Web game using Playwright and Cucumber BDD. The 6-phase structure progresses from foundation setup through CI/CD integration, with special attention to Canvas-based game element testing.

---

## Phases

### Phase 1: Foundation Setup

**Goal:** Establish core testing infrastructure and configuration for Playwright + Cucumber BDD framework.

**Requirements:**
- INFRA-01: Playwright Installation
- INFRA-02: Directory Structure
- INFRA-03: Cucumber Configuration
- INFRA-04: Playwright Configuration
- INFRA-08: Custom World
- INFRA-09: Hooks Configuration

**Success Criteria:**
1. Developer can run `npm run test:e2e` and see Cucumber test runner initialize successfully
2. Browser launches via Playwright and navigates to localhost:5173
3. Before/After hooks execute for test scenarios with browser lifecycle management
4. Screenshot captured and saved to test-results/ when test fails
5. Custom World provides access to Playwright Page, Browser, and Context in step definitions

**Dependencies:** None

---

### Phase 2: Base Infrastructure

**Goal:** Create reusable abstractions for Page Objects, Canvas interaction, and HUD reading to prevent duplication.

**Requirements:**
- INFRA-05: BasePage Class
- INFRA-06: CanvasInteractor
- INFRA-07: HUD Component Handler

**Success Criteria:**
1. BasePage class provides common methods (goto, waitForPageLoad, expectVisible) inherited by all Page Objects
2. CanvasInteractor converts percentage-based positions to absolute coordinates and clicks canvas elements
3. HUDComponent reads score, level, and lives from application HUD display
4. Application code includes data-testid attributes on Canvas element and HUD components
5. Developer can instantiate GamePage and call canvas.clickAnswerBlock('center') without coordinate math

**Dependencies:** Phase 1

---

### Phase 3: Authentication E2E Tests

**Goal:** Validate end-to-end authentication flows work correctly with simplest feature before Canvas complexity.

**Requirements:**
- AUTH-01: Login Feature
- AUTH-02: Signup Feature
- AUTH-03: AuthPage Object
- AUTH-04: Authentication Steps
- AUTH-05: Session Persistence
- AUTH-06: Logout Flow
- AUTH-07: Auth State Reuse

**Success Criteria:**
1. Test user can complete login flow (enter credentials → click login → verify dashboard access)
2. Test user can complete signup flow (enter new credentials → click signup → verify account created)
3. Invalid credentials display appropriate error message
4. Authenticated session persists across page reload using storageState
5. Logout successfully clears session and returns to login screen
6. Tests tagged with @authenticated skip login step by reusing saved authentication state

**Dependencies:** Phase 2

---

### Phase 4: Gameplay E2E Tests

**Goal:** Validate Canvas interaction pattern works correctly for game mechanics and coordinate accuracy.

**Requirements:**
- GAME-01: Game Start Feature
- GAME-02: Answer Selection Feature
- GAME-03: GamePage Object
- GAME-04: Gameplay Steps
- GAME-05: Canvas Coordinate Validation
- GAME-06: Level Progression
- GAME-07: Game Over State
- GAME-08: Pause/Resume

**Success Criteria:**
1. Test can click "Start Game" button and game transitions to PLAYING state with Canvas rendered
2. Test can click left/center/right answer blocks via coordinate calculation and projectile fires
3. Clicking correct answer increases score and displays score update in HUD
4. Answering 10 questions correctly advances level and displays level-up notification
5. Losing all lives displays Game Over screen with final score
6. Canvas coordinate clicks hit intended answer blocks across 1280x720 and 1920x1080 viewports

**Dependencies:** Phase 3

---

### Phase 5: Feature Coverage

**Goal:** Expand test coverage to remaining features (Leaderboard and Teams) using established patterns.

**Requirements:**
- BOARD-01: Leaderboard Display
- BOARD-02: LeaderboardPage Object
- BOARD-03: Leaderboard Steps
- BOARD-04: Score Submission
- TEAM-01: Create Team Feature
- TEAM-02: Join Team Feature
- TEAM-03: Team Management Feature
- TEAM-04: TeamsPage Object
- TEAM-05: CreateTeamModal Object
- TEAM-06: JoinTeamModal Object
- TEAM-07: Team Steps
- TEAM-08: Team Score Aggregation
- TEAM-09: Team Member Limit

**Success Criteria:**
1. Test can navigate to Leaderboard page and read top 10 score entries with usernames and scores
2. Game over triggers score submission and new score appears in leaderboard for authenticated user
3. Test can create new team (open modal → enter name/description → submit → team appears in list)
4. Test can join existing team via invite code and see team members list
5. Test can leave team and team disappears from user's team list
6. Team scores aggregate correctly from member individual scores
7. Modal Page Objects (CreateTeamModal, JoinTeamModal) handle open/close lifecycle correctly

**Dependencies:** Phase 4

---

### Phase 6: CI/CD Integration

**Goal:** Automate E2E test execution in GitHub Actions pipeline with artifact collection.

**Requirements:**
- CI-01: GitHub Actions Workflow
- CI-02: Test Artifacts Upload
- CI-03: Parallel Execution
- CI-04: Retry Configuration
- CI-05: Firebase Emulator

**Success Criteria:**
1. GitHub Actions workflow triggers E2E tests on push to main and PR creation
2. Failed test screenshots, videos, and HTML report uploaded as workflow artifacts
3. Firebase Emulator runs in CI environment to isolate test data from production
4. Tests execute with retry:2 configuration to handle transient failures
5. Workflow completes in under 10 minutes with parallel execution optimized for CI workers

**Dependencies:** Phase 5

---

## Coverage Matrix

| Category | Requirements | Phase |
|----------|-------------|-------|
| Infrastructure (Foundation) | INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-08, INFRA-09 | Phase 1 |
| Infrastructure (Abstractions) | INFRA-05, INFRA-06, INFRA-07 | Phase 2 |
| Authentication | AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07 | Phase 3 |
| Gameplay | GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, GAME-07, GAME-08 | Phase 4 |
| Leaderboard | BOARD-01, BOARD-02, BOARD-03, BOARD-04 | Phase 5 |
| Teams | TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05, TEAM-06, TEAM-07, TEAM-08, TEAM-09 | Phase 5 |
| CI/CD | CI-01, CI-02, CI-03, CI-04, CI-05 | Phase 6 |

**Total: 36 requirements | 6 phases | 100% coverage ✓**

---

## Phase Dependencies

```
Phase 1 (Foundation Setup)
  ↓
Phase 2 (Base Infrastructure)
  ↓
Phase 3 (Authentication Tests) → Validates full flow without Canvas
  ↓
Phase 4 (Gameplay Tests) → Validates Canvas pattern (highest risk)
  ↓
Phase 5 (Feature Coverage) → Parallel expansion using established patterns
  ↓
Phase 6 (CI/CD Integration)
```

---

## Research Context

This roadmap structure derives from comprehensive research documented in `.planning/research/ARCHITECTURE.md` and `.planning/research/SUMMARY.md`. Key architectural decisions:

- **Separate /e2e directory:** E2E tests isolated from source code at project root
- **Domain-driven POM:** Page Objects organized by feature area (auth, gameplay, teams)
- **Custom World pattern:** Cucumber World extended with Playwright fixtures
- **Coordinate-based Canvas testing:** Percentage-based positioning for viewport responsiveness
- **Role-based locators preferred:** Accessibility-first with data-testid for Canvas elements

**Confidence levels:**
- Infrastructure, Auth, Leaderboard, Teams, CI/CD: **HIGH** (established patterns)
- Canvas coordinate accuracy: **MEDIUM** (requires empirical validation in Phase 4)

---

## Progress Tracking

| Phase | Status | Requirements | Completion |
|-------|--------|--------------|------------|
| Phase 1 | Pending | 6 | 0% |
| Phase 2 | Pending | 3 | 0% |
| Phase 3 | Pending | 7 | 0% |
| Phase 4 | Pending | 8 | 0% |
| Phase 5 | Pending | 13 | 0% |
| Phase 6 | Pending | 5 | 0% |

**Overall Progress: 0/36 requirements (0%)**

---

## Next Actions

1. Review this roadmap structure for approval
2. Once approved, initiate Phase 1 via `/gsd:plan-phase 1`
3. Phase 1 will decompose Foundation Setup into executable implementation plan
