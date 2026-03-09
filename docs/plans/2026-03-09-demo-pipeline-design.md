# Demo Pipeline Skill — Design Document

**Date:** 2026-03-09
**Skill name:** `demo-pipeline`
**Location:** `~/.agents/skills/demo-pipeline/`
**Trigger:** "record demo"

## Overview

A unified Claude Code skill that takes a natural language demo script, translates it to an executable config, captures screenshots, records video, and generates a report. Works with any Expo mobile or web project.

## Pipeline Flow

```
1. DETECT  →  2. PARSE  →  3. EXECUTE  →  4. COMPILE
```

### Phase 1: DETECT

Auto-detect project type and running state:

| Signal | Type | Tool |
|--------|------|------|
| `app.json` with `expo` | Expo mobile | Maestro |
| `next.config.*` | Next.js web | webreel |
| `index.html` / static server | Web | webreel or Playwright |
| Expo + `web` platform config | Expo universal | Maestro (mobile) + webreel (web) |

Check if the app is running:
- Mobile: `adb devices` / `xcrun simctl list`
- Web: probe `localhost:3000`, `localhost:8081`, etc.

### Phase 2: PARSE

Convert natural language script to unified YAML format.

**Input (user writes):**
> "Mostrá el login, luego navegá a rewards, mostrá los cupones de PaniCafe, y terminá en el perfil"

**Output (skill generates for approval):**

```yaml
target: expo-mobile
app_id: xyz.bondum.mobile  # from app.json

steps:
  - name: "Login"
    actions:
      - wait: 2s
      - screenshot: "01-login"

  - name: "Rewards"
    actions:
      - tap: "tab-rewards"
      - wait: 1s
      - screenshot: "02-rewards"

  - name: "PaniCafe coupons"
    actions:
      - tap: "reward-panicafe"
      - wait: 1s
      - screenshot: "03-panicafe-detail"

  - name: "Profile"
    actions:
      - tap: "tab-profile"
      - wait: 1s
      - screenshot: "04-profile"

output:
  screenshots: ./screenshots/
  video: ./videos/demo.mp4
  report: ./docs/demo-report.md
```

**User approves or edits before execution.**

### Unified action set

| Action | Description | Maestro equivalent | webreel equivalent |
|--------|-------------|--------------------|--------------------|
| `tap: "id"` | Tap element by testID | `tapOn: { id: "..." }` | `click: { selector: "#..." }` |
| `tap: "Text"` | Tap element by text | `tapOn: "Text"` | `click: { text: "Text" }` |
| `type: { target: "id", text: "..." }` | Type into input | `inputText: "..."` | `type: { selector: "#...", text: "..." }` |
| `scroll: down` | Scroll down | `scroll` | `scroll: { y: 500 }` |
| `swipe: left` | Swipe gesture | `swipe: { direction: LEFT }` | `drag: { from, to }` |
| `wait: 2s` | Fixed pause | `(no-op, Maestro auto-waits)` | `pause: { ms: 2000 }` |
| `wait_for: "id"` | Wait until visible | `extendedWaitUntil: { visible: { id: "..." } }` | `wait: { selector: "#..." }` |
| `screenshot: "name"` | Capture screenshot | `takeScreenshot: name` | `screenshot: { output: "name.png" }` |
| `navigate: "url"` | Go to URL (web only) | N/A | `navigate: { url: "..." }` |
| `key: "Enter"` | Press key (web only) | N/A | `key: { key: "Enter" }` |

### Phase 3: EXECUTE

Translate unified YAML → tool-specific config → run:

**Mobile (Maestro):**
1. Generate `.yaml` Maestro flow from unified YAML
2. Run `maestro record <flow.yaml>` → captures video natively
3. Screenshots captured via `takeScreenshot` steps

**Web (webreel):**
1. Generate `webreel.config.json` from unified YAML
2. Run `npx webreel record` → MP4/GIF output with cursor animation
3. Screenshots captured via `screenshot` steps

**Web (Playwright fallback):**
1. Generate TypeScript recording script
2. Run with `npx tsx <script.ts>`
3. Convert WebM → MP4 via ffmpeg

### Phase 4: COMPILE

Generate all outputs:

**Screenshots** → `./screenshots/` (numbered, descriptive names)
```
screenshots/
  01-login.png
  02-rewards.png
  03-panicafe-detail.png
  04-profile.png
```

**Video** → `./videos/demo.mp4`

**Report** → `./docs/demo-report.md`
```markdown
# Demo Report — YYYY-MM-DD

## Project: <name> (<type>)
## Tool: <maestro|webreel|playwright>
## Duration: <Xs>

| Step | Name | Screenshot | Status |
|------|------|------------|--------|
| 1 | Login | screenshots/01-login.png | ✅ |
| ... | ... | ... | ... |

## Output
- Video: videos/demo.mp4
- Screenshots: N captured
- Errors: <none|list>
```

## Skill File Structure

```
~/.agents/skills/demo-pipeline/
  SKILL.md              # Main skill — triggers, full pipeline instructions
  reference.md          # Action reference with Maestro/webreel mappings
  templates/
    maestro-flow.yaml   # Template for Maestro flow generation
    webreel-config.json # Template for webreel config generation
    demo-report.md      # Template for report generation
```

## Detection Logic (SKILL.md instructions)

```
1. Check for app.json → read expo config
   - Has "expo" key? → Expo project
   - Has "web" platform? → Expo universal
2. Check for next.config.* → Next.js
3. Check for package.json scripts with "dev" or "start" → generic web
4. Check running processes:
   - adb devices → Android emulator/device
   - xcrun simctl list booted → iOS simulator
   - curl localhost:3000/8081/5173 → dev server
5. If ambiguous → ask user
```

## Key Design Decisions

1. **Unified YAML as intermediate format** — single source of truth, human-editable
2. **Approval gate before execution** — user always reviews generated YAML
3. **Tool-agnostic actions** — `tap`, `scroll`, `wait` map to any backend
4. **Auto-detection over configuration** — minimize user setup
5. **Screenshots at every named step** — unless explicitly excluded
6. **Report always generated** — lightweight, useful for QA and documentation
