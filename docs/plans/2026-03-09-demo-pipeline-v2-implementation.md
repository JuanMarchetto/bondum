# Demo Pipeline v2 + E2E Pipeline — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend demo-pipeline with flow discovery, state emulation, and device-only video; create e2e-pipeline as sister skill with real assertions.

**Architecture:** Evolve existing SKILL.md with two new phases (DISCOVER, STATE SETUP), add state-injection.md and flow-map template. Create e2e-pipeline as separate skill sharing discovery logic. Both are Claude Code skills (markdown prompts, not executable code).

**Tech Stack:** Claude Code skills (Markdown), Maestro, adb, deep links, AsyncStorage injection

---

### Task 1: Add Phase 0 (DISCOVER) to demo-pipeline SKILL.md

**Files:**
- Modify: `~/.agents/skills/demo-pipeline/SKILL.md`

**Step 1: Update the pipeline description**

In `SKILL.md`, replace line 22:
```markdown
**Pipeline:** DETECT → PARSE → EXECUTE → COMPILE
```
with:
```markdown
**Pipeline:** DISCOVER → DETECT → STATE SETUP → PARSE → EXECUTE → COMPILE
```

**Step 2: Update Quick Start**

In `SKILL.md`, replace lines 29-33 (the numbered list under Quick Start):
```markdown
1. Discover all screens, states, and flows via static analysis
2. Detect the project type and running state
3. Set up demo state injection (if demo_mode is enabled)
4. Generate a unified YAML script from the description
5. Present YAML for user approval
6. Execute with the right tool (Maestro or webreel)
7. Collect screenshots, video, and generate report
```

**Step 3: Insert Phase 0 before Phase 1**

Insert the following section BEFORE "## Phase 1: DETECT" (before line 35):

```markdown
## Phase 0: DISCOVER — Flow & State Analysis

Analyze the codebase to map all screens, states, flows, and native dependencies.

### Step 1: Discover screens

Read the file-based routing structure:
```bash
find src/app -name "*.tsx" -not -name "_layout.tsx" -not -name "+not-found.tsx" | sort
```

For each screen file, extract the route path from its filesystem location.

### Step 2: Identify states per screen

For each screen file, search for UI conditionals that reveal possible states:

```bash
grep -n "loading\|isLogged\|isEmpty\|error\|balance.*>\|\.length.*==.*0" src/app/**/*.tsx
```

Common patterns to look for:
- `{loading ? <Skeleton/> : ...}` → `loading` state
- `{isLoggedIn && ...}` or `{user ? ... : ...}` → `guest` vs `logged-in`
- `{items.length === 0 ? <EmptyState/> : ...}` → `empty` state
- `{balance > 0 ? ... : ...}` → `empty-balance` vs `has-balance`
- `{error ? <Error/> : ...}` → `error` state

### Step 3: Map navigation flows

Search for navigation calls to build a flow graph:

```bash
grep -rn "router\.push\|router\.replace\|href=" src/app/ src/components/
```

Group into named flows (e.g., "Full reward claim": home → rewards → [id] → scan → confirmation).

### Step 4: Identify native dependencies

Search for native module usage per screen:

```bash
grep -rn "expo-camera\|CameraView\|useMobileWallet\|SeedVault\|Linking\|expo-local-authentication" src/
```

Mark each screen's native dependencies. These will be flagged as `native: real | mock` in the YAML.

### Step 5: Present flow map

Generate a flow map in YAML format (see [templates/flow-map.yaml](templates/flow-map.yaml)) and present to user:

> "I discovered N screens with M possible states and K flows. Here's the map:
> [flow map YAML]
> Which flows do you want in the demo?"

Then proceed to Phase 1.
```

**Step 4: Verify**

```bash
grep "Phase 0" ~/.agents/skills/demo-pipeline/SKILL.md
```

Expected: matches found

**Step 5: Commit**

```bash
git add ~/.agents/skills/demo-pipeline/SKILL.md
git commit -m "feat(demo-pipeline): add Phase 0 DISCOVER — static flow analysis"
```

---

### Task 2: Add Phase 1.5 (STATE SETUP) to demo-pipeline SKILL.md

**Files:**
- Modify: `~/.agents/skills/demo-pipeline/SKILL.md`

**Step 1: Insert Phase 1.5 between Phase 1 and Phase 2**

Insert the following section AFTER the "Phase 1: DETECT" section and BEFORE "## Phase 2: PARSE":

```markdown
## Phase 1.5: STATE SETUP — Demo State Injection

**Only runs when the unified YAML has `demo_mode: true`.** Skip this phase entirely for regular demos without state emulation.

### Step 1: Check if demo mode is needed

If any step in the YAML has a `state:` block or `native: mock`, demo mode is required.

### Step 2: Inject state via adb

For each step that has a `state:` block, inject the mock data before executing that step's actions.

**Injection mechanism:**
```bash
# Write mock state to AsyncStorage via adb
adb shell "run-as <APP_ID> sh -c 'cat > /data/data/<APP_ID>/files/demo-state.json'" <<< '{"wallet":"0x123","balance":5000}'
```

Alternative — use deep links to navigate to specific states:
```bash
adb shell am start -a android.intent.action.VIEW \
  -d "<SCHEME>://demo?screen=<SCREEN>&state=<STATE_JSON_ENCODED>"
```

### Step 3: Handle native mocks

For steps with `native: mock`:
- Inject the mock result into AsyncStorage before the step executes
- The app's demo bootstrap reads this and skips the native module, showing the result directly

For steps with `native: real` (or no `native` field):
- No injection — let the real native flow execute

### Step 4: Cleanup after recording

After all steps complete:
```bash
adb shell "run-as <APP_ID> sh -c 'rm -f /data/data/<APP_ID>/files/demo-state.json'"
```

### Important: App-side requirement

The project needs a demo bootstrap file. If it doesn't exist, tell the user:

> "Demo mode requires a bootstrap file. I'll create `src/demo/bootstrap.ts` — a dev-only file that reads mock state from AsyncStorage. This file has zero impact on production builds since it's gated behind `__DEV__`."

See [state-injection.md](state-injection.md) for the full bootstrap implementation.
```

**Step 2: Verify**

```bash
grep "Phase 1.5" ~/.agents/skills/demo-pipeline/SKILL.md
```

Expected: matches found

**Step 3: Commit**

```bash
git add ~/.agents/skills/demo-pipeline/SKILL.md
git commit -m "feat(demo-pipeline): add Phase 1.5 STATE SETUP — demo state injection"
```

---

### Task 3: Add video_mode and extended YAML fields to SKILL.md

**Files:**
- Modify: `~/.agents/skills/demo-pipeline/SKILL.md`

**Step 1: Update Phase 3 EXECUTE — add device-only video mode**

Find the section "### Mobile Path: Maestro" in Phase 3. After the existing "Copy screenshots" block (after line ~181), insert:

```markdown
### Video Mode: device-only

When `output.video_mode` is `device-only`, record only the device screen (no terminal/Maestro UI):

```bash
# Start device screen recording in parallel
adb shell screenrecord /sdcard/demo-recording.mp4 &
RECORD_PID=$!

# Run Maestro flow in test-only mode
maestro test maestro/demo-recording.yaml

# Stop recording and extract
kill $RECORD_PID 2>/dev/null
adb shell "kill $(adb shell ps | grep screenrecord | awk '{print $2}')" 2>/dev/null
sleep 1
adb pull /sdcard/demo-recording.mp4 videos/demo.mp4
adb shell rm /sdcard/demo-recording.mp4
```

**Limitation:** `adb screenrecord` max 3 minutes per recording. For longer demos, chain multiple recordings and concatenate:
```bash
ffmpeg -f concat -safe 0 -i segments.txt -c copy videos/demo.mp4
```

When `video_mode` is `full` (default), use `maestro record` as before.
```

**Step 2: Update the YAML structure in Phase 2**

Find the YAML template in Phase 2 (the `output:` section, around line 118-121). Replace:

```yaml
output:
  screenshots: ./screenshots/
  video: ./videos/demo.mp4
  report: ./docs/demo-report.md
```

with:

```yaml
demo_mode: false               # true to enable state injection
env:                           # environment variables (optional)
  DEMO_MODE: "true"

# ... steps ...

output:
  screenshots: ./screenshots/
  video: ./videos/demo.mp4
  video_mode: device-only      # device-only | full
  report: ./docs/demo-report.md
```

**Step 3: Add `state` and `native` to the step format in Phase 2**

Find the step format example in Phase 2. Update to show the new fields:

```yaml
steps:
  - name: "<Screen Name>"
    state:                       # optional — mock state to inject
      key: value
    native: real                 # optional — real | mock (default: real)
    actions:
      - <action>: <value>
      - screenshot: "<NN-name>"
```

**Step 4: Commit**

```bash
git add ~/.agents/skills/demo-pipeline/SKILL.md
git commit -m "feat(demo-pipeline): add video_mode device-only, state and native YAML fields"
```

---

### Task 4: Create state-injection.md

**Files:**
- Create: `~/.agents/skills/demo-pipeline/state-injection.md`

**Step 1: Write the state injection reference**

Write to `~/.agents/skills/demo-pipeline/state-injection.md`:

```markdown
# Demo Pipeline — State Injection Reference

How demo state injection works across platforms.

## Expo / React Native (Mobile)

### App-side bootstrap

Create `src/demo/bootstrap.ts` in the target project (dev-only, zero production impact):

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_STATE_KEY = '__DEMO_STATE__';

export async function loadDemoState(): Promise<Record<string, any> | null> {
  if (!__DEV__) return null;

  try {
    const raw = await AsyncStorage.getItem(DEMO_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearDemoState(): Promise<void> {
  await AsyncStorage.removeItem(DEMO_STATE_KEY);
}
```

### Import in app entry

In `src/app/_layout.tsx` or equivalent, add at the top:

```typescript
import { loadDemoState } from '../demo/bootstrap';

// In the root component useEffect:
useEffect(() => {
  if (__DEV__) {
    loadDemoState().then(state => {
      if (state) {
        // Apply mock state to your context/providers
        console.log('[DEMO] Loaded mock state:', state);
      }
    });
  }
}, []);
```

### Injection via adb (done by the skill)

```bash
# Inject state before running demo
adb shell "run-as <APP_ID> sh -c \"
  mkdir -p /data/data/<APP_ID>/files/
  echo '{\"wallet\":\"0x123\",\"balance\":5000}' > /data/data/<APP_ID>/files/demo-state.json
\""

# Alternative: use AsyncStorage directly (RN stores in SQLite)
adb shell "run-as <APP_ID> sqlite3 /data/data/<APP_ID>/databases/RKStorage" \
  "INSERT OR REPLACE INTO catalystLocalStorage VALUES ('__DEMO_STATE__', '{\"wallet\":\"0x123\"}');"
```

### Injection via deep links

Register a demo-only deep link handler:

```typescript
// In _layout.tsx or navigation config
if (__DEV__) {
  Linking.addEventListener('url', ({ url }) => {
    const parsed = new URL(url);
    if (parsed.pathname === '/demo') {
      const state = JSON.parse(decodeURIComponent(parsed.searchParams.get('state') || '{}'));
      // Apply state to providers
    }
  });
}
```

Skill triggers via:
```bash
adb shell am start -a android.intent.action.VIEW \
  -d "bondum://demo?state=%7B%22balance%22%3A5000%7D"
```

### Native mock pattern

For native modules (Camera, Seed Vault, etc.), the bootstrap can override:

```typescript
if (__DEV__ && demoState?.scan_result) {
  // Skip camera, return mock result directly
  global.__DEMO_SCAN_RESULT__ = demoState.scan_result;
}
```

In the scan screen, check before opening camera:
```typescript
if (__DEV__ && global.__DEMO_SCAN_RESULT__) {
  handleScanResult(global.__DEMO_SCAN_RESULT__);
  return;
}
// ... normal camera flow
```

### Cleanup

```bash
adb shell "run-as <APP_ID> sqlite3 /data/data/<APP_ID>/databases/RKStorage" \
  "DELETE FROM catalystLocalStorage WHERE key = '__DEMO_STATE__';"
```

## Web (Next.js / Generic)

### Injection via localStorage

```bash
# webreel/Playwright can inject via JavaScript evaluation
page.evaluate(() => {
  localStorage.setItem('__DEMO_STATE__', JSON.stringify({
    wallet: '0x123',
    balance: 5000
  }));
  location.reload();
});
```

### Cleanup

```javascript
localStorage.removeItem('__DEMO_STATE__');
```
```

**Step 2: Verify**

```bash
wc -l ~/.agents/skills/demo-pipeline/state-injection.md
```

Expected: ~130+ lines

**Step 3: Commit**

```bash
git add ~/.agents/skills/demo-pipeline/state-injection.md
git commit -m "feat(demo-pipeline): add state-injection.md reference"
```

---

### Task 5: Create flow-map.yaml template

**Files:**
- Create: `~/.agents/skills/demo-pipeline/templates/flow-map.yaml`

**Step 1: Write the template**

Write to `~/.agents/skills/demo-pipeline/templates/flow-map.yaml`:

```yaml
# Demo Pipeline — Flow Map Template
# Generated by Phase 0: DISCOVER
# Replace {{PLACEHOLDERS}} with discovered values

screens:
  - path: "{{SCREEN_PATH}}"
    states: [{{COMMA_SEPARATED_STATES}}]
    native_deps: [{{COMMA_SEPARATED_NATIVE_DEPS}}]

flows:
  - name: "{{FLOW_NAME}}"
    path: "{{SCREEN_A}} → {{SCREEN_B}} → {{SCREEN_C}}"
    steps:
      - screen: "{{SCREEN_A}}"
        state: "{{INITIAL_STATE}}"
      - action: "{{ACTION}}"
      - screen: "{{SCREEN_B}}"
        state: "{{RESULT_STATE}}"
```

**Step 2: Verify**

```bash
cat ~/.agents/skills/demo-pipeline/templates/flow-map.yaml
```

**Step 3: Commit**

```bash
git add ~/.agents/skills/demo-pipeline/templates/flow-map.yaml
git commit -m "feat(demo-pipeline): add flow-map.yaml discovery template"
```

---

### Task 6: Update reference.md with new YAML fields

**Files:**
- Modify: `~/.agents/skills/demo-pipeline/reference.md`

**Step 1: Add new fields to YAML Structure Reference**

Replace the existing "## YAML Structure Reference" section (lines 126-143) with:

```markdown
## YAML Structure Reference

```yaml
target: expo-mobile | web | expo-universal
app_id: com.example.app          # mobile only
base_url: http://localhost:3000  # web only

demo_mode: false                 # true to enable state injection
env:                             # environment variables (optional)
  DEMO_MODE: "true"

steps:
  - name: "<Step Name>"
    state:                       # optional — mock state to inject for this step
      key: value
    native: real                 # optional — real | mock (default: real)
    actions:
      - <action>: <value>
      - screenshot: "<NN-name>"

output:
  screenshots: ./screenshots/
  video: ./videos/demo.mp4
  video_mode: device-only        # device-only | full (default: full)
  report: ./docs/demo-report.md
```

## Step-Level Fields

### state (optional)

Mock state to inject before this step's actions execute. Only used when `demo_mode: true`.

```yaml
state:
  wallet: "0x123...abc"
  balance: 5000
  streak: 7
```

The skill injects this via AsyncStorage/adb before the step runs.

### native (optional)

Controls native module behavior for this step. Default: `real`.

```yaml
native: mock    # inject mock result, skip native module
native: real    # let native flow execute normally
```

### video_mode

Controls video recording method.

- `device-only` — records only device screen via `adb screenrecord` (clean, no terminal logs)
- `full` — records via `maestro record` (includes Maestro UI, default)
```

**Step 2: Commit**

```bash
git add ~/.agents/skills/demo-pipeline/reference.md
git commit -m "feat(demo-pipeline): add state, native, video_mode to reference.md"
```

---

### Task 7: Create e2e-pipeline skill — directory + SKILL.md

**Files:**
- Create: `~/.agents/skills/e2e-pipeline/SKILL.md`
- Create: `~/.agents/skills/e2e-pipeline/reference.md`
- Create: `~/.agents/skills/e2e-pipeline/templates/maestro-test.yaml`
- Create: `~/.agents/skills/e2e-pipeline/templates/test-report.md`

**Step 1: Create directory**

```bash
mkdir -p ~/.agents/skills/e2e-pipeline/templates
```

**Step 2: Write SKILL.md**

Write to `~/.agents/skills/e2e-pipeline/SKILL.md`:

```markdown
---
name: e2e-pipeline
description: "Generate and run E2E tests for mobile and web apps. Discovers all screens, states, and flows via static analysis, generates Maestro test flows with real assertions, executes them, and reports pass/fail results. Use when: run e2e, test flows, e2e tests, generate tests, test all flows, automated testing."
version: 1.0.0
category: toolchain
tags:
  - e2e
  - testing
  - maestro
  - expo
  - react-native
  - assertions
  - quality
---

# E2E Pipeline

Generate and run comprehensive E2E tests from static analysis of your codebase. Discovers all screens, states, and flows, generates Maestro test flows with real assertions, and reports results.

**Pipeline:** DISCOVER → DETECT → GENERATE → EXECUTE → REPORT

## Quick Start

User says: "run e2e" or "test flows"

You:
1. Discover all screens, states, and flows via static analysis
2. Detect project type and running state
3. Generate test flows with assertions for each discovered flow
4. Present test plan for user approval
5. Execute all test flows
6. Report pass/fail results with failure screenshots

## Phase 0: DISCOVER — Flow & State Analysis

Identical to demo-pipeline Phase 0. Analyze the codebase to map all screens, states, flows, and native dependencies.

### Step 1: Discover screens

Read the file-based routing structure:
```bash
find src/app -name "*.tsx" -not -name "_layout.tsx" -not -name "+not-found.tsx" | sort
```

### Step 2: Identify states per screen

Search for UI conditionals:
```bash
grep -n "loading\|isLogged\|isEmpty\|error\|balance.*>\|\.length.*==.*0" src/app/**/*.tsx
```

### Step 3: Map navigation flows

```bash
grep -rn "router\.push\|router\.replace\|href=" src/app/ src/components/
```

### Step 4: Identify native dependencies

```bash
grep -rn "expo-camera\|CameraView\|useMobileWallet\|SeedVault" src/
```

### Step 5: Present flow map

Present the discovered map and ask:
> "I discovered N screens with M states and K flows. Which flows do you want to test? (default: all)"

## Phase 1: DETECT — Project Type & State

Same as demo-pipeline Phase 1. Detect project type (Expo/web) and check running state (device/emulator/server).

## Phase 2: GENERATE — Create Test Flows

For each selected flow, generate a Maestro test YAML with assertions.

### Assertion mapping

| Unified | Maestro |
|---------|---------|
| `assert_visible: "Text"` | `- assertVisible: "Text"` |
| `assert_visible: { id: "elem" }` | `- assertVisible:\n    id: "elem"` |
| `assert_not_visible: "Text"` | `- assertNotVisible: "Text"` |
| `assert_contains: { id: "elem", text: "val" }` | `- assertVisible:\n    id: "elem"\n    text: "val"` |

### Test YAML format

```yaml
flow: "<Flow Name>"
steps:
  - name: "<Step Name>"
    actions:
      - tap: "Element"
      - assert_visible: "Expected Result"
      - screenshot_on_fail: true
```

### Present for approval

Show all generated tests to user:
> "I generated N test flows covering M screens. Review and approve, or select which to run."

**HARD GATE: Do NOT execute until user approves.**

## Phase 3: EXECUTE — Run Tests

### Step 1: Generate Maestro test files

For each approved test flow, create a `.yaml` file in `./maestro/tests/`:

```bash
mkdir -p maestro/tests
```

### Step 2: Run all tests

```bash
maestro test maestro/tests/
```

Or run individually:
```bash
maestro test maestro/tests/flow-name.yaml
```

### Step 3: Capture failure screenshots

Maestro auto-captures on failure. Copy to project:
```bash
mkdir -p screenshots/failures
cp ~/.maestro/tests/*/screenshots/* screenshots/failures/ 2>/dev/null || true
```

## Phase 4: REPORT — Results

### Step 1: Parse results

Collect pass/fail from Maestro output.

### Step 2: Generate report

Create `./docs/test-report.md` using [templates/test-report.md](templates/test-report.md):

```markdown
# E2E Test Report — YYYY-MM-DD

## Summary
- Total: N flows
- Passed: X
- Failed: Y

| Flow | Steps | Result | Failure Screenshot |
|------|-------|--------|--------------------|
| ... | ... | ✅/❌ | path or N/A |
```

### Step 3: Present summary

> **E2E tests complete!**
> - Passed: X/N flows
> - Failed: Y (see screenshots in `./screenshots/failures/`)
> - Report: `./docs/test-report.md`
```

**Step 3: Verify**

```bash
head -5 ~/.agents/skills/e2e-pipeline/SKILL.md
```

Expected: frontmatter starting with `---`

**Step 4: Commit**

```bash
git add ~/.agents/skills/e2e-pipeline/SKILL.md
git commit -m "feat(e2e-pipeline): create SKILL.md with discovery + test generation"
```

---

### Task 8: Create e2e-pipeline reference.md + templates

**Files:**
- Create: `~/.agents/skills/e2e-pipeline/reference.md`
- Create: `~/.agents/skills/e2e-pipeline/templates/maestro-test.yaml`
- Create: `~/.agents/skills/e2e-pipeline/templates/test-report.md`

**Step 1: Write reference.md**

Write to `~/.agents/skills/e2e-pipeline/reference.md`:

```markdown
# E2E Pipeline — Action & Assertion Reference

## Test Actions

All actions from demo-pipeline are supported: `tap`, `type`, `scroll`, `swipe`, `wait`, `wait_for`, `screenshot`.

## Assertion Actions

### assert_visible

Assert an element is visible on screen.

```yaml
- assert_visible: "Welcome"
```
- Maestro: `- assertVisible: "Welcome"`

**By testID:**
```yaml
- assert_visible: { id: "home-balance" }
```
- Maestro: `- assertVisible: { id: "home-balance" }`

### assert_not_visible

Assert an element is NOT on screen.

```yaml
- assert_not_visible: "Error"
```
- Maestro: `- assertNotVisible: "Error"`

### assert_contains

Assert an element contains specific text.

```yaml
- assert_contains: { id: "balance-display", text: "5,000" }
```
- Maestro: `- assertVisible: { id: "balance-display", text: "5,000" }`

### screenshot_on_fail

Capture screenshot only if a previous assertion fails. Applied per step.

```yaml
- screenshot_on_fail: true
```

## Test YAML Structure

```yaml
flow: "<Flow Name>"
steps:
  - name: "<Step Name>"
    actions:
      - <action or assertion>
      - screenshot_on_fail: true    # optional
```
```

**Step 2: Write maestro-test.yaml template**

Write to `~/.agents/skills/e2e-pipeline/templates/maestro-test.yaml`:

```yaml
# E2E Pipeline — Maestro Test Template
# Replace {{PLACEHOLDERS}} with actual values
appId: {{APP_ID}}
---
# Test: {{FLOW_NAME}}

# {{STEP_NAME}}
- tapOn: "{{ELEMENT}}"
- assertVisible: "{{EXPECTED_TEXT}}"
- takeScreenshot: "{{SCREENSHOT_NAME}}"
```

**Step 3: Write test-report.md template**

Write to `~/.agents/skills/e2e-pipeline/templates/test-report.md`:

```markdown
# E2E Test Report — {{DATE}}

## Summary
- Total: {{TOTAL}} flows
- Passed: {{PASSED}}
- Failed: {{FAILED}}
- Duration: {{DURATION}}

| # | Flow | Steps | Result | Failure Screenshot |
|---|------|-------|--------|--------------------|
| {{TEST_ROWS}} |

## Failed Tests
{{FAILURE_DETAILS}}

## Environment
- Device: {{DEVICE}}
- App: {{APP_ID}}
- Tool: {{TOOL}}
```

**Step 4: Verify all files**

```bash
find ~/.agents/skills/e2e-pipeline -type f | sort
```

Expected:
```
SKILL.md
reference.md
templates/maestro-test.yaml
templates/test-report.md
```

**Step 5: Commit**

```bash
git add ~/.agents/skills/e2e-pipeline/
git commit -m "feat(e2e-pipeline): add reference.md and templates"
```

---

### Task 9: Test demo-pipeline v2 — verify discovery phase

**Step 1: Invoke the skill on bondum-mobile**

In the bondum-mobile directory, say: "record demo"

Verify the skill now:
1. Runs Phase 0 DISCOVER — scans `src/app/` for routes, finds conditionals, maps navigation
2. Presents a flow map to the user
3. Proceeds through the rest of the pipeline as before

**Step 2: Verify new YAML fields are recognized**

Check that the skill generates YAML with `demo_mode`, `state`, `native`, and `video_mode` fields when appropriate.

**Step 3: Fix any issues found**

If discovery misses screens or generates wrong states, adjust the grep patterns in SKILL.md.

---

### Task 10: Test e2e-pipeline — verify test generation

**Step 1: Invoke the skill on bondum-mobile**

In the bondum-mobile directory, say: "run e2e"

Verify the skill:
1. Discovers screens and flows
2. Generates Maestro test YAMLs with `assertVisible` assertions
3. Presents test plan for approval

**Step 2: Run a single generated test**

```bash
maestro test maestro/tests/<generated-test>.yaml
```

Verify it runs and reports pass/fail correctly.

**Step 3: Fix any issues**

Adjust assertion generation or Maestro action mapping if needed.
