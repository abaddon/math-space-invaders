# Math Space Invaders Web

## What This Is

An educational math game where players control a starship, shooting at falling answer blocks to solve math problems. Features 8 operation types across an 18-tier progression system, user authentication, global leaderboards, and team-based competitive play.

## Core Value

Players can practice math skills in an engaging, game-like environment that adapts to their skill level.

## Current Milestone: v1.1 E2E Testing with BDD

**Goal:** Establish comprehensive end-to-end test coverage using Playwright and Cucumber (BDD) to ensure all user journeys work correctly.

**Target features:**
- Playwright + Cucumber testing infrastructure
- BDD scenarios covering all existing features
- Page Object Model for test maintainability
- CI/CD integration with GitHub Actions

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ **GAME-01**: 8 math operation types (add, subtract, multiply, divide, fractions, improper fractions, percentages, metrics)
- ✓ **GAME-02**: 18-tier difficulty progression (54+ levels)
- ✓ **GAME-03**: HTML5 Canvas rendering at 60 FPS
- ✓ **GAME-04**: Keyboard and touch controls
- ✓ **GAME-05**: Sound effects and visual particles
- ✓ **GAME-06**: Time-based difficulty (decay per level)
- ✓ **AUTH-01**: Username/password signup
- ✓ **AUTH-02**: Login with existing account
- ✓ **AUTH-03**: Session persistence across refresh
- ✓ **AUTH-04**: Logout functionality
- ✓ **PROFILE-01**: Player stats tracking (high score, best level, games played)
- ✓ **BOARD-01**: Global leaderboard with rankings
- ✓ **TEAM-01**: Create public teams
- ✓ **TEAM-02**: Create private teams (password-protected)
- ✓ **TEAM-03**: Join teams via shareable links
- ✓ **TEAM-04**: Team leaderboards
- ✓ **TEAM-05**: Member management
- ✓ **TEAM-06**: Team settings
- ✓ **INFRA-01**: Firebase Firestore backend
- ✓ **INFRA-02**: Google Analytics 4 integration
- ✓ **INFRA-03**: GitHub Pages deployment
- ✓ **INFRA-04**: Unit test suite (169 tests with Vitest)

### Active

<!-- Current scope. Building toward these. -->

- [ ] E2E testing infrastructure (Playwright + Cucumber)
- [ ] Authentication E2E test scenarios
- [ ] Gameplay E2E test scenarios
- [ ] Leaderboard E2E test scenarios
- [ ] Team features E2E test scenarios
- [ ] CI/CD pipeline for E2E tests

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Mobile app E2E tests — Focus on web version only
- Performance/load testing — Separate concern, not BDD
- Visual regression testing — May add later, not v1.1 scope
- API-level testing — Focus is user journey, not API contracts

## Context

- **Tech stack**: React 19 + TypeScript + Vite + Firebase
- **Testing**: Vitest for unit tests (existing), adding Playwright + Cucumber for E2E
- **Challenge**: Game renders to HTML5 Canvas, requiring special testing strategies
- **CI**: GitHub Actions already used for deployment

## Constraints

- **Canvas rendering**: Cannot query DOM for game elements — need alternative testing strategies
- **Firebase**: Tests need isolation from production data
- **Browser support**: Chrome primary, consider Firefox/Safari for CI matrix

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Playwright over Cypress | Faster execution, better TypeScript support, built-in parallelization | — Pending |
| Cucumber for BDD | Industry standard Gherkin syntax, good ecosystem | — Pending |
| Page Object Model | Maintainable test code, reusable components | — Pending |

---
*Last updated: 2026-01-22 after milestone v1.1 initialization*
