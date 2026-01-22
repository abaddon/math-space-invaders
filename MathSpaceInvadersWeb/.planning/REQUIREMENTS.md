# Requirements: Math Space Invaders E2E Testing

**Defined:** 2026-01-22
**Core Value:** Ensure game quality through comprehensive automated E2E testing that validates all user journeys

## v1.1 Requirements

Requirements for E2E testing milestone. Each maps to roadmap phases.

### Testing Infrastructure

- [ ] **INFRA-01**: Playwright and Cucumber dependencies installed and configured
- [ ] **INFRA-02**: TypeScript configuration for E2E tests (separate tsconfig.e2e.json)
- [ ] **INFRA-03**: Custom Cucumber World integrates with Playwright fixtures
- [ ] **INFRA-04**: Before/After hooks manage browser lifecycle and cleanup
- [ ] **INFRA-05**: BasePage abstraction provides common page interaction methods
- [ ] **INFRA-06**: CanvasInteractor handles coordinate-based game interactions
- [ ] **INFRA-07**: data-testid attributes added to key DOM elements
- [ ] **INFRA-08**: Firebase Emulator configured for test data isolation
- [ ] **INFRA-09**: npm scripts for running E2E tests locally

### Authentication E2E Tests

- [ ] **AUTH-01**: User can sign up with valid username and password
- [ ] **AUTH-02**: User cannot sign up with existing username (error shown)
- [ ] **AUTH-03**: User can login with valid credentials
- [ ] **AUTH-04**: User cannot login with invalid credentials (error shown)
- [ ] **AUTH-05**: User can logout and is redirected to login screen
- [ ] **AUTH-06**: User session persists across browser refresh
- [ ] **AUTH-07**: Unauthenticated user is redirected to login

### Gameplay E2E Tests

- [ ] **GAME-01**: User can start a new game from the main menu
- [ ] **GAME-02**: User can select correct answer and see score increase
- [ ] **GAME-03**: User can select wrong answer and see lives decrease
- [ ] **GAME-04**: User advances to next level after 10 correct answers
- [ ] **GAME-05**: User sees level-up animation between levels
- [ ] **GAME-06**: Game ends when all lives are lost
- [ ] **GAME-07**: Game over screen shows final score and options
- [ ] **GAME-08**: User can pause and resume game

### Leaderboard E2E Tests

- [ ] **BOARD-01**: User can view global leaderboard with rankings
- [ ] **BOARD-02**: Leaderboard displays player nicknames and scores
- [ ] **BOARD-03**: User's score is saved to leaderboard after game over
- [ ] **BOARD-04**: User can view their own stats (high score, best level)

### Team E2E Tests

- [ ] **TEAM-01**: User can create a public team
- [ ] **TEAM-02**: User can create a private team with password
- [ ] **TEAM-03**: User can join a public team via link
- [ ] **TEAM-04**: User can join a private team with correct password
- [ ] **TEAM-05**: User cannot join private team with wrong password
- [ ] **TEAM-06**: User can view team leaderboard
- [ ] **TEAM-07**: User can view team members list
- [ ] **TEAM-08**: Team creator can access team settings
- [ ] **TEAM-09**: User can leave a team

### CI/CD Integration

- [ ] **CI-01**: GitHub Actions workflow runs E2E tests on pull requests
- [ ] **CI-02**: Tests run in parallel for faster execution
- [ ] **CI-03**: Failed tests capture screenshots and videos
- [ ] **CI-04**: Test reports are published as workflow artifacts
- [ ] **CI-05**: Firebase Emulator runs in CI environment

## Future Requirements

Deferred to future milestone. Tracked but not in current scope.

### Visual Regression

- **VIS-01**: Screenshot comparison for game rendering consistency
- **VIS-02**: Canvas visual regression baselines for each difficulty tier

### Performance Testing

- **PERF-01**: Page load time assertions
- **PERF-02**: Game frame rate monitoring

### Accessibility Testing

- **A11Y-01**: Keyboard navigation for all UI elements
- **A11Y-02**: Screen reader compatibility testing

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile app E2E tests | Focus on web version only for v1.1 |
| API-level testing | BDD focuses on user journeys, not API contracts |
| Load/stress testing | Different tooling and concern, not BDD scope |
| Unit test migration | Existing Vitest tests remain unchanged |
| Cross-browser matrix | Start with Chrome, expand later if needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| INFRA-05 | Phase 2 | Pending |
| INFRA-06 | Phase 2 | Pending |
| INFRA-07 | Phase 2 | Pending |
| INFRA-08 | Phase 1 | Pending |
| INFRA-09 | Phase 1 | Pending |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| AUTH-04 | Phase 3 | Pending |
| AUTH-05 | Phase 3 | Pending |
| AUTH-06 | Phase 3 | Pending |
| AUTH-07 | Phase 3 | Pending |
| GAME-01 | Phase 4 | Pending |
| GAME-02 | Phase 4 | Pending |
| GAME-03 | Phase 4 | Pending |
| GAME-04 | Phase 4 | Pending |
| GAME-05 | Phase 4 | Pending |
| GAME-06 | Phase 4 | Pending |
| GAME-07 | Phase 4 | Pending |
| GAME-08 | Phase 4 | Pending |
| BOARD-01 | Phase 5 | Pending |
| BOARD-02 | Phase 5 | Pending |
| BOARD-03 | Phase 5 | Pending |
| BOARD-04 | Phase 5 | Pending |
| TEAM-01 | Phase 5 | Pending |
| TEAM-02 | Phase 5 | Pending |
| TEAM-03 | Phase 5 | Pending |
| TEAM-04 | Phase 5 | Pending |
| TEAM-05 | Phase 5 | Pending |
| TEAM-06 | Phase 5 | Pending |
| TEAM-07 | Phase 5 | Pending |
| TEAM-08 | Phase 5 | Pending |
| TEAM-09 | Phase 5 | Pending |
| CI-01 | Phase 6 | Pending |
| CI-02 | Phase 6 | Pending |
| CI-03 | Phase 6 | Pending |
| CI-04 | Phase 6 | Pending |
| CI-05 | Phase 6 | Pending |

**Coverage:**
- v1.1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after initial definition*
