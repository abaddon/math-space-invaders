# Research Summary: E2E Test Organization

**Project:** Math Space Invaders Web
**Domain:** Playwright + Cucumber BDD E2E Testing Architecture
**Researched:** 2026-01-22
**Overall confidence:** HIGH

## Executive Summary

This research addresses the architectural organization of E2E tests for a Canvas-based React educational game using Playwright and Cucumber BDD. The investigation focused on directory structure, Page Object Model patterns for Canvas elements, fixture organization, and step definition architecture.

The recommended approach uses a **separate `/e2e` directory** at the project root (not in `/src`), **domain-driven organization** (by feature area), and a **Custom World pattern** to integrate Cucumber with Playwright fixtures. Special attention was given to handling **HTML5 Canvas game elements**, which require coordinate-based interaction patterns rather than traditional DOM selectors.

Key architectural decisions are backed by official Playwright documentation, Cucumber best practices, and 2026 industry patterns for scalable BDD test frameworks.

## Key Findings

**Architecture:** Separate `/e2e` directory with domain-driven organization (auth, gameplay, teams, leaderboard). Tests organized by feature area, not by page or Gherkin keyword.

**Canvas Testing:** Coordinate-based interaction pattern using percentage-based positioning. CanvasInteractor abstraction handles coordinate calculation and click actions. HUD elements use data-testid attributes for reliable selection.

**Page Object Model:** Domain-driven POM with BasePage abstraction. Page Objects represent feature areas (not strict pages) to suit modal-heavy architecture. Composition pattern for Canvas (CanvasInteractor) and HUD (HUDComponent) components.

**Fixtures Integration:** Custom World pattern extends Cucumber World with Playwright Page/Browser/Context. Hooks handle Before/After lifecycle. Tagged hooks for scenario-specific setup (e.g., @authenticated, @canvas).

**Locator Strategy:** Priority order: Role-based (preferred) → Label/Text → data-testid (Canvas/dynamic) → CSS/XPath (last resort). Follows 2026 Playwright best practices emphasizing accessibility.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation Setup (4-6 hours)
**Rationale:** Establish testing infrastructure before writing tests
- Install Playwright, Cucumber, ts-node dependencies
- Create `/e2e` directory structure
- Configure `cucumber.config.ts` and `playwright.config.ts`
- Implement Custom World + hooks
- **No blockers:** Standard setup, well-documented patterns

### Phase 2: Base Infrastructure (6-8 hours)
**Rationale:** Create reusable abstractions to avoid duplication
- Create BasePage class with common methods
- Create CanvasInteractor for coordinate-based interactions
- Create common step definitions (navigation, wait, generic interactions)
- Add data-testid to critical Canvas/HUD elements in application
- **Requires Phase 1:** Depends on World/hooks setup

### Phase 3: Authentication Flow (4-6 hours)
**Rationale:** Prove end-to-end flow with simplest feature (no Canvas complexity)
- Create `auth.feature` with login/signup scenarios
- Create AuthPage using role-based locators
- Create `authentication.steps.ts`
- Run first complete test, verify screenshot-on-failure works
- **Requires Phase 2:** Needs BasePage abstraction
- **Research flag:** Minimal - authentication patterns are standard

### Phase 4: Gameplay Flow (8-10 hours)
**Rationale:** Validate Canvas interaction pattern with most complex feature
- Create `gameplay.feature` with answer selection scenarios
- Create GamePage + CanvasInteractor + HUDComponent
- Create `gameplay.steps.ts`
- Test coordinate accuracy, adjust positioning percentages
- **Requires Phase 3:** Depends on working test infrastructure
- **Research flag:** MODERATE - Canvas coordinate accuracy needs validation through testing

### Phase 5: Feature Coverage (12-16 hours)
**Rationale:** Expand to remaining features using established patterns
- Leaderboard feature (LeaderboardPage + steps)
- Teams feature (TeamsPage + modals + steps)
- Settings feature (SettingsPage + steps)
- **Requires Phase 4:** Uses Canvas patterns from gameplay
- **Research flag:** Minimal - follows established patterns

### Phase 6: CI/CD Integration (2-4 hours)
**Rationale:** Automate in pipeline once tests are stable
- Create GitHub Actions workflow
- Configure test artifacts (screenshots, videos, reports)
- Optimize parallel execution and retries
- **Requires Phase 5:** Needs stable test suite
- **Research flag:** None - standard CI configuration

### Total Estimated Timeline: 36-50 hours

## Phase Ordering Rationale

**Why this order:**
1. **Infrastructure before tests**: Foundation (Phase 1) and abstractions (Phase 2) prevent duplication and rework
2. **Simple before complex**: Authentication (Phase 3) validates the testing approach without Canvas complexity
3. **Canvas validation early**: Gameplay (Phase 4) is the highest-risk feature; validating coordinate accuracy early prevents rework
4. **Parallel feature expansion**: Leaderboard, Teams, Settings (Phase 5) can be built in parallel once patterns are established
5. **CI last**: Automation after tests are stable reduces CI troubleshooting cycles

**Dependency chain:**
```
Phase 1 (Foundation)
  ↓
Phase 2 (Infrastructure)
  ↓
Phase 3 (Auth) → Validates full flow
  ↓
Phase 4 (Gameplay) → Validates Canvas pattern
  ↓
Phase 5 (Features) → Can be parallelized
  ↓
Phase 6 (CI/CD)
```

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Directory Structure | **HIGH** | Based on official Playwright docs and 2026 community patterns. Verified with multiple sources. |
| Page Object Model | **HIGH** | Official Playwright POM documentation + TypeScript best practices. Patterns are well-established. |
| Canvas Testing | **MEDIUM** | Coordinate-based pattern is documented, but coordinate accuracy requires empirical testing. Percentage-based positioning may need adjustment based on actual UI. |
| Fixtures & Hooks | **HIGH** | Custom World pattern is standard for Cucumber-Playwright integration. Multiple authoritative sources. |
| Step Definitions | **HIGH** | Official Cucumber documentation for domain-based organization. Clear anti-patterns documented. |
| Locator Strategy | **HIGH** | Official Playwright best practices from 2026. Role-based locators prioritized for accessibility. |

## Gaps to Address

### Canvas Coordinate Accuracy (Phase 4 concern)
**Gap:** Percentage-based coordinate calculations are theoretical until tested with actual Canvas rendering.

**Mitigation:**
- Use Playwright Codegen to capture actual click coordinates during development
- Implement screenshot debugging for click positions
- Create visual debugging mode that shows click locations on Canvas
- May need to adjust coordinate percentages empirically

**When:** Phase 4 (Gameplay Flow)

### Authentication State Reuse (Performance optimization)
**Gap:** Research covered basic auth hooks but not persistent storage state for speed.

**Known solution:** Playwright's `storageState()` API can save/restore auth tokens
```typescript
await context.storageState({ path: 'auth-state.json' });
```

**When:** Phase 3 or 5 (Auth or optimization pass)

### Parallel Execution Tuning (CI optimization)
**Gap:** Optimal worker count and retry configuration for CI environment unknown until tests run.

**Approach:** Start with conservative settings (parallel: 2, retry: 1), tune based on CI performance

**When:** Phase 6 (CI/CD Integration)

### Test Data Management (Not yet addressed)
**Gap:** Research focused on architecture, not test data strategy (fixture data, test users, cleanup).

**Recommendation:** Address in Phase 2 or 3 when creating first tests. Consider:
- JSON fixtures in `/e2e/config/test-data.json`
- Dedicated test Firebase environment
- Cleanup hooks for test data

**When:** Phase 2 or 3

## Open Questions for Implementation

1. **Canvas rendering consistency:** Do answer blocks render at consistent coordinates across browsers? (Firefox vs Chrome vs Safari)
   - **Answer approach:** Test in Phase 4, may need browser-specific coordinate adjustments

2. **HUD implementation:** Is HUD DOM-based or Canvas-rendered?
   - **Impact:** Determines locator strategy (role-based vs coordinate-based)
   - **Answer approach:** Check application code in Phase 2

3. **Modal z-index strategy:** Do modals block Canvas interactions?
   - **Impact:** May need explicit modal close steps before Canvas interaction
   - **Answer approach:** Test in Phase 4/5

4. **Test execution speed:** How long does average Canvas test take?
   - **Impact:** Determines parallelization strategy and CI timeout settings
   - **Answer approach:** Measure in Phase 4, optimize in Phase 6

## Anti-Patterns Identified

Research revealed common mistakes to avoid:

1. **Feature-coupled step definitions:** Steps that only work for one feature file
   - **Prevention:** Domain-based organization, parameterized steps

2. **Logic in step definitions:** Implementing page interactions directly in steps
   - **Prevention:** Delegate all logic to Page Objects

3. **Hardcoded Canvas coordinates:** Brittle absolute pixel positions
   - **Prevention:** Percentage-based coordinate calculation

4. **Mixing unit and E2E tests:** E2E tests living in `/src` directory
   - **Prevention:** Separate `/e2e` directory at project root

5. **CSS selector brittleness:** Relying on `.class:nth-child(2)` type selectors
   - **Prevention:** Role-based locators, data-testid for Canvas elements

## Ready for Roadmap

Research is comprehensive and provides clear architectural guidance for roadmap creation. All major architectural decisions are documented with HIGH confidence, backed by official sources.

**Key deliverable:** ARCHITECTURE.md provides:
- Complete directory structure
- Code examples for all patterns (BasePage, CanvasInteractor, Page Objects, Step Definitions)
- Configuration files (Cucumber, Playwright, TypeScript)
- 6-phase build order with dependencies and estimates
- Locator strategy with priority order
- Anti-patterns to avoid

**Recommended next step:** Create detailed roadmap with milestones based on 6-phase structure. Each phase can become a milestone with specific tasks.
