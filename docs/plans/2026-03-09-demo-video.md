# Demo Video Recording — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Record a polished ~2 minute MP4 demo video of the Bondum app using webreel + Expo Web, showcasing all major screens and flows for the MONOLITH hackathon submission.

**Architecture:** Run the app via `npm run web` (Expo Web), then use webreel to script browser interactions in an iPhone viewport. Guest mode bypasses auth. A "demo wallet" address makes screens show real on-chain balances instead of zeroes.

**Tech Stack:** webreel (headless Chrome + ffmpeg), Expo Web, Guest mode with injected wallet address

---

### Task 1: Install webreel

**Files:**
- Modify: `package.json` (devDependencies)
- Modify: `.gitignore` (add `.webreel`)

**Step 1: Install webreel as dev dependency**

Run: `npm install --save-dev webreel`

**Step 2: Add `.webreel` to gitignore**

Append to `.gitignore`:
```
# webreel recording artifacts
.webreel
```

**Step 3: Download webreel dependencies (Chrome + ffmpeg)**

Run: `npx webreel install`
Expected: Chrome and ffmpeg downloaded to `~/.webreel`

**Step 4: Verify installation**

Run: `npx webreel --help`
Expected: CLI help output shows init, record, preview, composite commands

**Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add webreel for demo video recording"
```

---

### Task 2: Verify Expo Web renders correctly

**Files:**
- None (verification only)

**Step 1: Start Expo Web dev server**

Run: `npm run web`
Expected: Expo dev server starts, prints a localhost URL (e.g. `http://localhost:8081`)

**Step 2: Open in browser and verify the welcome screen renders**

Open the localhost URL in Chrome. Verify:
- Welcome screen shows with the Bondum logo
- "Continue as Guest" button is visible
- Styling (purple theme, NativeWind) renders correctly
- No crash-level errors in console

**Step 3: Test guest login**

Click "Continue as Guest". Verify:
- App navigates to the Home tab
- Tab bar renders at bottom with 5 tabs
- No crash from expo-secure-store (if it crashes, see Task 3)

**Step 4: Check each tab renders**

Click through all 5 tabs: Home, Trade, Assets, Rewards, Profile. Note:
- All tabs should render their basic UI
- Balances will show $0 (expected — no wallet address in guest mode)
- QR scan screen will show overlay but no camera feed (expected)

If expo-secure-store crashes on web, proceed to Task 3. Otherwise skip Task 3.

---

### Task 3: Polyfill expo-secure-store for web (CONDITIONAL — only if Task 2 crashes)

**Files:**
- Modify: `src/services/storage/secureStorage.ts`

**Step 1: Read the current secure storage implementation**

Read: `src/services/storage/secureStorage.ts`

**Step 2: Add Platform.OS === 'web' fallback to localStorage**

Wrap `SecureStore.setItemAsync` / `getItemAsync` / `deleteItemAsync` calls with a web check:

```typescript
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const setItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItem = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
};

const deleteItem = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};
```

Apply this pattern to each storage method in the file.

**Step 3: Verify web login works**

Restart Expo Web, click "Continue as Guest", confirm no crash.

**Step 4: Commit**

```bash
git add src/services/storage/secureStorage.ts
git commit -m "fix: polyfill secure storage for web demo"
```

---

### Task 4: Inject demo wallet address into guest mode

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

**Purpose:** Guest mode sets `address: null`, so all balance queries return $0 and screens look empty. For the demo, inject a known wallet address that holds BONDUM/SOL/USDC so screens show realistic data.

**Step 1: Read the auth context**

Read: `src/contexts/AuthContext.tsx`

**Step 2: Add a DEMO_WALLET constant and use it in connectAsGuest**

Near the top of the file, add:

```typescript
// Demo wallet for video recording — has on-chain BONDUM, SOL, USDC balances
const DEMO_WALLET = Platform.OS === 'web'
  ? '<MARCHES_WALLET_ADDRESS>'  // Replace with a real address that has balances
  : null;
```

In the `connectAsGuest` callback, change `address: null` to `address: DEMO_WALLET`:

```typescript
const connectAsGuest = useCallback(() => {
  const user: User = {
    id: 'guest',
    username: 'Bondum User',  // Better name for demo
    avatarUrl: null,
  }
  setAuthState({
    isAuthenticated: true,
    provider: 'guest',
    address: DEMO_WALLET,
    user,
  })
  // ...
}, [])
```

**Step 3: Verify balances show on Home screen**

Start Expo Web → Guest login → Home tab should now show real token balances.

**Step 4: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: inject demo wallet for web video recording"
```

---

### Task 5: Scaffold webreel config

**Files:**
- Create: `webreel.config.json`

**Step 1: Initialize webreel config**

Run: `npx webreel init --name bondum-demo --url http://localhost:8081`

**Step 2: Replace scaffolded config with the full demo script**

Overwrite `webreel.config.json` with:

```json
{
  "$schema": "https://webreel.dev/schema/v1.json",
  "outDir": "videos/",
  "baseUrl": "http://localhost:8081",
  "viewport": { "width": 393, "height": 852 },
  "defaultDelay": 800,
  "clickDwell": 300,
  "theme": {
    "cursor": {
      "size": 28,
      "hotspot": "center"
    }
  },
  "videos": {
    "bondum-demo": {
      "url": "/",
      "waitFor": "Continue as Guest",
      "output": "bondum-demo.mp4",
      "fps": 30,
      "quality": 90,
      "steps": [
        { "action": "pause", "ms": 1500, "description": "Show welcome screen" },

        { "action": "click", "text": "Continue as Guest", "delay": 2000, "description": "Login as guest" },

        { "action": "wait", "text": "Home", "timeout": 5000, "description": "Wait for home screen" },
        { "action": "pause", "ms": 2000, "description": "Show home dashboard" },
        { "action": "scroll", "y": 300, "delay": 1500, "description": "Scroll to see streak & rewards" },
        { "action": "scroll", "y": 300, "delay": 1500, "description": "Scroll more to see featured" },
        { "action": "scroll", "y": -600, "delay": 1000, "description": "Scroll back to top" },

        { "action": "click", "text": "Rewards", "delay": 2000, "description": "Navigate to Rewards tab" },
        { "action": "pause", "ms": 1500, "description": "Show rewards list" },
        { "action": "scroll", "y": 250, "delay": 1500, "description": "Browse rewards" },
        { "action": "scroll", "y": -250, "delay": 1000, "description": "Back to top" },

        { "action": "click", "text": "Trade", "delay": 2000, "description": "Navigate to Trade tab" },
        { "action": "pause", "ms": 1500, "description": "Show swap interface" },
        { "action": "moveTo", "selector": "input", "delay": 500, "description": "Hover amount input" },

        { "action": "click", "text": "Assets", "delay": 2000, "description": "Navigate to Assets tab" },
        { "action": "pause", "ms": 1500, "description": "Show token portfolio" },
        { "action": "scroll", "y": 200, "delay": 1500, "description": "Browse assets" },
        { "action": "scroll", "y": -200, "delay": 1000, "description": "Back to top" },

        { "action": "click", "text": "Profile", "delay": 2000, "description": "Navigate to Profile tab" },
        { "action": "pause", "ms": 2000, "description": "Show profile info" },

        { "action": "click", "text": "Home", "delay": 2000, "description": "Back to home" },
        { "action": "pause", "ms": 2000, "description": "Final home screen shot" }
      ]
    }
  }
}
```

> **Note:** This is a starting config. The exact selectors and text values will need tuning after previewing. The `description` fields document intent — they're ignored at runtime.

**Step 3: Validate config**

Run: `npx webreel validate`
Expected: No errors

**Step 4: Commit**

```bash
git add webreel.config.json
git commit -m "feat: add webreel demo video config"
```

---

### Task 6: Preview and iterate on the demo script

**Files:**
- Modify: `webreel.config.json` (iteratively)

**Step 1: Start Expo Web in one terminal**

Run (in background): `npm run web`

**Step 2: Run webreel preview**

Run: `npx webreel preview bondum-demo --verbose`

This opens a visible browser and plays through the steps. Watch for:
- ❌ Steps that fail to find elements (wrong `text` or `selector`)
- ❌ Steps that happen too fast (increase `delay`)
- ❌ Screens that look broken on web
- ❌ Scroll amounts that are too much/little

**Step 3: Fix element targets**

Common fixes needed:
- Tab bar text might differ from expected (check actual rendered text)
- Some elements may need `selector` instead of `text`
- `waitFor` selectors may need adjusting based on actual DOM

After each fix, re-run preview to verify.

**Step 4: Tune timing**

Adjust `delay` values so the video feels natural:
- Pause longer on visually rich screens (home, rewards)
- Quick transitions between simple screens
- Total duration target: ~100-120 seconds

**Step 5: Add any missing interactions**

Consider adding:
- Hover effects on reward cards
- Tapping into a reward detail and back
- Interacting with the swap input on Trade
- Scrolling through NFTs on Assets

**Step 6: Commit when satisfied**

```bash
git add webreel.config.json
git commit -m "chore: tune demo video timing and selectors"
```

---

### Task 7: Record the final video

**Files:**
- Output: `videos/bondum-demo.mp4`

**Step 1: Ensure Expo Web is running**

Run: `npm run web`
Verify localhost is responding.

**Step 2: Record the video**

Run: `npx webreel record bondum-demo --verbose`
Expected: Recording starts, frames captured, ffmpeg encodes to `videos/bondum-demo.mp4`

**Step 3: Review the output**

Open `videos/bondum-demo.mp4` and verify:
- All screens visible and well-timed
- No visual glitches or failed steps
- Duration is approximately 2 minutes
- Resolution looks good at 393x852 (iPhone viewport)

**Step 4: (Optional) Re-composite with different theme**

If you want to tweak cursor style or HUD overlays without re-recording:

Run: `npx webreel composite bondum-demo`

**Step 5: (Optional) Generate a GIF version**

Add a second video entry in the config with `"output": "bondum-demo.gif"` for social media sharing, or use ffmpeg:

```bash
ffmpeg -i videos/bondum-demo.mp4 -vf "fps=15,scale=393:-1" -loop 0 videos/bondum-demo.gif
```

**Step 6: Commit**

```bash
git add webreel.config.json videos/bondum-demo.mp4
git commit -m "feat: record Bondum demo video for MONOLITH hackathon"
```

---

## Execution Notes

**Prerequisites before starting:**
1. Expo Web must compile and run (`npm run web`)
2. A wallet address with BONDUM/SOL balances for realistic data
3. Chrome and ffmpeg (auto-installed by `npx webreel install`)

**Known limitations:**
- QR camera won't show feed on web (screen still renders the overlay UI)
- Wallet signing flows can't be demonstrated (no MWA on web)
- Haptics silently fail on web (no impact on video)

**If Expo Web doesn't work well enough:**
Fall back to Android emulator + `adb shell screenrecord`:
```bash
adb shell screenrecord /sdcard/demo.mp4 --time-limit 120
adb pull /sdcard/demo.mp4 videos/bondum-demo.mp4
```
This requires a running emulator with the app installed.
