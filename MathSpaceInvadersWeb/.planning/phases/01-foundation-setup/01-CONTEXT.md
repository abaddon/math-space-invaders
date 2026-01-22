# Phase 1: Foundation Setup - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish core testing infrastructure and configuration for Playwright + Cucumber BDD framework. This includes installing dependencies, configuring both tools, setting up the directory structure, and creating the Custom World and hooks for browser lifecycle management.

</domain>

<decisions>
## Implementation Decisions

### Test output & feedback
- Minimal verbosity — only show failures and final summary
- Running count for passes (e.g., "12/45 passed")
- Per-scenario timing displayed next to results
- HTML report generated after every run, opens automatically

### Failure handling
- Screenshots named by scenario (e.g., `login-invalid-credentials-FAILED.png`)
- No video capture — screenshots only
- Artifacts organized by feature (e.g., `test-results/auth/`, `test-results/gameplay/`)
- Clean test-results/ directory before each run

### Feature file structure
- Organized by user journey (`features/onboarding/`, `features/playing/`, `features/social/`)
- Kebab-case naming (e.g., `user-login.feature`, `game-start.feature`)
- Minimal tagging strategy — `@smoke` and `@wip` only
- Multiple related scenarios per feature file

### Browser & timeout config
- Default browser: Chromium
- Headless mode by default, `--headed` flag to watch
- Viewport: 1920x1080 (Full HD)
- Default action timeout: 10 seconds

### Claude's Discretion
- Exact HTML report template/styling
- Step definition file organization
- Retry configuration for flaky tests
- Trace capture settings

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for Playwright + Cucumber setup.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-setup*
*Context gathered: 2026-01-22*
