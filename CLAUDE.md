# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies and browsers
npm install
npx playwright install --with-deps

# Run all tests
npx playwright test

# Run a single test file
npx playwright test e2e/example.spec.ts

# Run tests matching a title pattern
npx playwright test -g "has title"

# Run in interactive UI mode
npx playwright test --ui

# Run in debug mode
npx playwright test --debug

# View HTML report after a run
npx playwright show-report
```

No linter is configured. No custom npm scripts exist — use `npx playwright` directly.

## Architecture

This is a minimal Playwright E2E test project. All tests live in `./e2e/` as `*.spec.ts` files.

**Configuration (`playwright.config.ts`):**
- Runs fully parallel by default; on CI (`process.env.CI`), uses 1 worker and 2 retries
- Targets Chromium, Firefox, and WebKit (all three run for every test)
- Captures traces on first retry; reports via HTML to `playwright-report/`
- Mobile and branded browser projects are defined but commented out
- No local dev server configured (webServer option is commented out)

**CI (`.github/workflows/playwright.yml`):** Triggers on push/PR to main/master, uploads the HTML report as an artifact with 30-day retention.

## Test Patterns

All tests follow the Page Object Model. See `e2e/pages/todo-page.ts` and `e2e/todomvc.spec.ts` as the canonical reference.

**Page objects (`e2e/pages/<name>-page.ts`):**
- One class per page, exported as a named class
- Top of file: a `URL` const and a `LOCATORS` const — all selector strings live here, nowhere else
- Action methods: `async`, return `void`, drive the browser (e.g. `addTodo`, `completeTodo`)
- Locator accessors: synchronous, return `Locator` — used with `expect()` in the spec
- No `expect()` calls inside page objects

**Spec files (`e2e/*.spec.ts`):**
- No raw selectors — all locator access goes through the page object
- No `test.beforeEach` for navigation — each test instantiates its page object and calls `goto()` as its first line
- Test bodies read as a sequence of named steps; assertions use page object locator accessors

## AI Agents (`agents/index.ts`)

Two agents form a scenario-generation pipeline. Run with `npx tsx agents/index.ts`. Requires `ANTHROPIC_API_KEY` set in `.env` (excluded from git).

| Agent | Model | Role |
|---|---|---|
| `sdетAgent(plan)` | `claude-opus-4-6` | Identifies test scenarios from a requirements plan; uses adaptive thinking |
| `reviewerAgent(scenarios)` | `claude-sonnet-4-6` | Reviews scenarios for coverage, gaps, and redundancy |

**`runPipeline(plan)`** chains both agents: SDET output feeds directly into the reviewer.

Both stream output to stdout. Return the final text string for downstream use.
