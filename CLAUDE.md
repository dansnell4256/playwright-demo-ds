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

A four-phase pipeline that takes a plain-English feature plan and produces passing Playwright tests. Requires `ANTHROPIC_API_KEY` set in `.env` (excluded from git).

```bash
# Run the full pipeline
npx tsx agents/index.ts

# Resume from a specific phase using a prior run's artifacts
npx tsx agents/index.ts --resume-from=phase3 --run-id=2026-04-08T16-05-23
npx tsx agents/index.ts --resume-from phase4 --run-id 2026-04-08T16-05-23
```

The run ID is printed at the start of every fresh run — note it if you may want to resume later.

### Phases

| Phase | Agents | Model | Input → Output |
|---|---|---|---|
| 1 — Scenarios | `scenarioAgent` + `scenarioReviewerAgent` | Opus 4.6 / Sonnet 4.6 | Feature plan → deduplicated test scenarios |
| 2 — Structure | `structurePlannerAgent` + `structureReviewerAgent` | Opus 4.6 / Sonnet 4.6 | Scenarios → Page Object Model structure plan |
| 3 — Authoring | `authorAgent` + `authorReviewerAgent` + `writeTestFiles` | Opus 4.6 / Sonnet 4.6 | Structure plan → TypeScript files written to `e2e/` |
| 4 — Execution | `testExecutorAgent` + `verifierAgent` | — / Sonnet 4.6 | Runs `npx playwright test`; re-runs once if results look flaky |

All Opus 4.6 agents use adaptive thinking. All agents stream output to stdout.

### Artifacts

Each run creates a directory under `agents/output/runs/{runId}/` with per-phase output files:

```
agents/output/runs/{runId}/
  meta.json                          # run metadata and completed phases
  phase1-scenarios.txt
  phase1-approved-scenarios.txt
  phase2-structure-plan.txt
  phase2-approved-structure-plan.txt
  phase3-author-output.txt
  phase3-approved-author-output.txt
  phase4-execution.json
  phase4-verification.json
```

A full Markdown summary is also written to `agents/output/pipeline-{timestamp}.md`.

### Resuming a Phase

Use `--resume-from` to skip completed phases and re-run from any point. All phases prior to the resume point are loaded from disk — no LLM calls are made for them.

```bash
# Re-run only test execution (phases 1–3 already done)
npx tsx agents/index.ts --resume-from=phase4 --run-id=2026-04-08T16-05-23

# Re-author and re-execute (phases 1–2 already done)
npx tsx agents/index.ts --resume-from=phase3 --run-id=2026-04-08T16-05-23

# Re-plan structure and everything after (phase 1 already done)
npx tsx agents/index.ts --resume-from=phase2 --run-id=2026-04-08T16-05-23
```

`--run-id` is required when using `--resume-from`. The pipeline validates that all phases before the resume point are marked complete in `meta.json` before proceeding.

### Agent Source Layout

```
agents/
  index.ts              # pipeline orchestrator (runPipeline, CLI entry point)
  phases/
    scenario.ts         # Phase 1 agents
    structure.ts        # Phase 2 agents
    author.ts           # Phase 3 agents + writeTestFiles
    executor.ts         # Phase 4 agents
  lib/
    artifacts.ts        # artifact save/load, run metadata, CLI arg validation
    stream.ts           # Claude streaming helpers
    reviewer.ts         # createReviewer factory (shared by phases 1–3)
```
