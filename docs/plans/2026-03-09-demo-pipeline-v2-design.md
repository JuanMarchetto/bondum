# Demo Pipeline v2 + E2E Pipeline — Design Document

**Date:** 2026-03-09
**Skills affected:** `demo-pipeline` (evolve), `e2e-pipeline` (new)
**Location:** `~/.agents/skills/demo-pipeline/`, `~/.agents/skills/e2e-pipeline/`

## Overview

Extend `demo-pipeline` with state emulation, flow auto-discovery, and device-only video recording. Create `e2e-pipeline` as a sister skill that shares discovery but generates real assertion-based tests.

## Extended Pipeline Flow

```
0. DISCOVER  →  1. DETECT  →  1.5. STATE SETUP  →  2. PARSE  →  3. EXECUTE  →  4. COMPILE
```

- **Phase 0 (DISCOVER)** — static analysis of codebase to map all screens, states, flows, and native dependencies
- **Phase 1.5 (STATE SETUP)** — inject mock states via `__DEV__ && global.DEMO_MODE`, AsyncStorage, and deep links
- Rest of pipeline unchanged, with YAML extensions

## Phase 0: DISCOVER — Static Analysis

Analyzes the codebase to map all possible flows and states.

**What it analyzes:**
- **Routes** — reads `src/app/` (Expo Router file-based routing) to discover all screens
- **UI conditionals** — searches for `{isLoggedIn && ...}`, `{balance > 0 ? ...}`, `{loading ? <Skeleton/> : ...}` to identify states per screen
- **Navigation** — searches for `router.push()`, `router.replace()`, `<Link href=...>` to map transitions
- **Native flows** — identifies Camera, Seed Vault, MWA usage, marks as `native: real | mock`

**Output:**

```yaml
screens:
  - path: /(tabs)/(home)
    states: [guest, logged-in, loading, empty-balance, has-balance]
    native_deps: []

  - path: /(tabs)/(rewards)/[id]
    states: [available, claimed, expired]
    native_deps: []

  - path: /scan
    states: [scanning, result-reward, result-invalid]
    native_deps: [camera]

flows:
  - name: "Full reward claim"
    path: home → rewards → [id] → scan → claim-confirmation
  - name: "Send tokens"
    path: home → send → confirmation
```

Skill presents this map and asks: "Which flows do you want in the demo?"

## Phase 1.5: STATE SETUP — State Injection

### Mechanism (minimal code change)

One isolated bootstrap file, only runs in `__DEV__`:

```typescript
// src/demo/bootstrap.ts
if (__DEV__ && global.DEMO_MODE) {
  // Read mock state from AsyncStorage (injected by skill via adb)
  // Populate providers/contexts with mock data
}
```

### How the skill injects states

```bash
# 1. Activate demo mode via env
DEMO_MODE=true npx expo start

# 2. Inject mock data via adb broadcast
adb shell am broadcast -a xyz.bondum.mobile.DEMO_STATE \
  --es state '{"wallet":"0x123","balance":5000,"streak":7}'

# 3. Navigate to specific state via deep link
adb shell am start -a android.intent.action.VIEW \
  -d "bondum://demo?screen=rewards&id=panicafe-10k&state=claimed"
```

### Native flows (per-step control)

- `native: real` — no injection, real native flow executes
- `native: mock` — inject result via AsyncStorage, app skips native module

### Cleanup

```bash
adb shell am broadcast -a xyz.bondum.mobile.DEMO_CLEAR
```

## Extended YAML Format

```yaml
target: expo-mobile
app_id: xyz.bondum.mobile

demo_mode: true
env:
  DEMO_MODE: "true"

steps:
  - name: "Home con balance"
    state:
      wallet: "0x123...abc"
      balance: 5000
      streak: 7
    actions:
      - wait_for: "Home"
      - screenshot: "01-home"

  - name: "Scan QR"
    native: mock
    state:
      scan_result: { type: "reward", id: "panicafe-10k" }
    actions:
      - tap: "Scan"
      - screenshot: "02-scan-result"

  - name: "Camera real"
    native: real
    actions:
      - tap: "Scan"
      - wait: 3s
      - screenshot: "03-camera"

output:
  video: ./videos/demo.mp4
  video_mode: device-only     # device-only | full
  screenshots: ./screenshots/
  report: ./docs/demo-report.md
```

## Video: device-only Mode

Records only the device screen, no terminal logs:

```bash
# Start device screen recording in parallel
adb shell screenrecord /sdcard/demo.mp4 &
RECORD_PID=$!

# Run Maestro flow (test mode, no Maestro recording)
maestro test maestro/demo-recording.yaml

# Stop and extract
adb shell kill $RECORD_PID
adb pull /sdcard/demo.mp4 videos/demo.mp4
adb shell rm /sdcard/demo.mp4
```

**Limitation:** `adb screenrecord` max 3 minutes. For longer demos, skill chains multiple recordings and concatenates with ffmpeg.

## E2E Pipeline — Sister Skill

**Trigger:** "run e2e", "test flows"
**Location:** `~/.agents/skills/e2e-pipeline/`

### Differences from demo-pipeline

| Aspect | demo-pipeline | e2e-pipeline |
|--------|--------------|--------------|
| State | Injected (mock) | Real |
| Video | Yes, primary output | Optional (evidence) |
| Assertions | No — capture only | Yes — verify behavior |
| Trigger | "record demo" | "run e2e", "test flows" |
| Output | Video + screenshots + report | Pass/fail + report + failure screenshots |

### Generated from discovery

```yaml
flow: "Full reward claim"
steps:
  - name: "Navigate to rewards"
    actions:
      - tap: "Rewards"
      - assert_visible: "Available Rewards"
      - screenshot_on_fail: true

  - name: "Open PaniCafe"
    actions:
      - tap: "Panicafe Rewards"
      - assert_visible: "PaniCafe"
```

Translates to Maestro YAML with `assertVisible` instead of just `takeScreenshot`.

## File Structure Changes

```
~/.agents/skills/demo-pipeline/
  SKILL.md               ← extend with Phase 0 + Phase 1.5 + video_mode
  reference.md           ← add state/native/video_mode fields
  state-injection.md     ← NEW: injection techniques per platform
  templates/
    maestro-flow.yaml
    webreel-config.json
    demo-report.md
    flow-map.yaml        ← NEW: discovery output template

~/.agents/skills/e2e-pipeline/
  SKILL.md               ← NEW: discovery + test generation + execution
  reference.md           ← NEW: assertion actions + report format
  templates/
    maestro-test.yaml    ← NEW: test flow template
    test-report.md       ← NEW: pass/fail report template
```

## Key Design Decisions

1. **`__DEV__ && global.DEMO_MODE`** — minimal code change, zero production impact
2. **Per-step `native: real | mock`** — granular control over what's real vs emulated
3. **`video_mode: device-only`** — clean demo output via `adb screenrecord` in parallel
4. **Discovery shared by both skills** — same static analysis, duplicated in each SKILL.md (~30 lines)
5. **Separate skills** — clear separation of concerns between demo recording and E2E testing
6. **Deep links + AsyncStorage** — state injection without modifying app components
