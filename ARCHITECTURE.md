# Architecture Guide

This document covers strategic and implementation decisions for the Solai mobile app — a React Native Expo WebView shell wrapping `solaiexp.vercel.app`.

---

## Table of Contents

1. [AWS Cognito Login](#1-aws-cognito-login)
2. [Session Management](#2-session-management)
3. [App Store Migration — Keeping Ratings & Reviews](#3-app-store-migration)
4. [Deep Linking to Vehicles & Auctions](#4-deep-linking)
5. [Reusing Mobile-Responsive Web Components](#5-reusing-web-components)
6. [Bottom Navigation — Native vs Web](#6-bottom-navigation)
6b. [Native-Like Page Transitions (Lightweight)](#6b-native-like-page-transitions-lightweight)
7. [Floating Auction Bar](#7-floating-auction-bar)
8. [WebView ↔ Native Bridge](#8-webview--native-bridge)
9. [In-App Banners / Toast Notifications](#9-in-app-banners)

---

## 1. AWS Cognito Login

### Current state
Login is detected purely by URL — when the WebView navigates away from `loginPath`, the app infers the user is logged in. There is no native auth layer.

### Recommended: Native Login Screen (SRP username/password)

Build a fully native login form in React Native that authenticates directly against Cognito before the WebView ever loads.

**Packages needed:**
```
expo-secure-store          # iOS Keychain / Android Keystore for token storage
amazon-cognito-identity-js # SRP-based auth — no AWS Amplify bloat
```

**New files:**

| File | Purpose |
|---|---|
| `constants/cognito.ts` | User Pool ID, App Client ID, region |
| `contexts/AuthContext.tsx` | `isAuthenticated`, `idToken`, `signIn()`, `signOut()`, `refreshSession()` |
| `hooks/use-auth.ts` | Re-exports `useAuthContext` as `useAuth` |
| `components/auth/LoginScreen.tsx` | Form component (email + password + Sign In button) |
| `app/login.tsx` | Expo Router screen wrapping `LoginScreen` |

**AuthContext startup flow:**
1. Read `@auth/id_token` and `@auth/refresh_token` from SecureStore
2. If found → call Cognito `refreshSession()` silently
3. If refresh succeeds → `isAuthenticated = true`, skip login screen
4. If refresh fails (expired) → `isAuthenticated = false`, show login screen
5. `isAuthLoading = true` during this check (app shows nothing / splash)

**Cognito App Client requirements:**
- Auth flow: `USER_SRP_AUTH` must be enabled
- **No client secret** on the mobile client (secrets can't be kept safe in a mobile app)
- Allowed callback URL: not needed for SRP flow (only for Hosted UI)

**`constants/cognito.ts` (fill in before release):**
```ts
export const COGNITO = {
  region:     'us-east-1',
  userPoolId: 'us-east-1_XXXXXXXXX',
  clientId:   'XXXXXXXXXXXXXXXXXXXXXXXXXX',
};
```

### Alternative: Cognito Hosted UI (simpler, web-based)
Load Cognito's Hosted UI in a browser via `expo-auth-session`. The OAuth PKCE flow runs entirely in a browser; the app receives tokens via a redirect URI callback. Less native-feeling but requires no Cognito SDK.

---

## 2. Session Management

### Layers

| Layer | Mechanism | Status |
|---|---|---|
| WebView ↔ server | `sharedCookiesEnabled = true` — HTTP session cookies persist and are sent automatically | ✅ Already in place |
| Cognito tokens (native) | SecureStore (`@auth/id_token`, `@auth/refresh_token`) | Planned |
| Native ↔ WebView | `postMessage` / `injectJavaScript` bridge | Planned (see §8) |
| Logout | `clearCache(true)` + JS cookie wipe + SecureStore clear | Partial (needs Cognito wiring) |

### Handing the Cognito session to the web app

After native sign-in, the web app needs to know who the user is. Two options:

#### Option A — `/auth/native` endpoint (recommended)

After native auth, WebView loads:
```
https://solaiexp.vercel.app/auth/native?token={idToken}
```

The web app's `/auth/native` route:
1. Verifies the Cognito JWT against Cognito's JWKS endpoint
2. Creates a server-side session cookie
3. Redirects to `/home`

The WebView inherits the session cookie automatically. No ongoing token injection needed. The web app behaves exactly as if the user logged in through its own UI.

**Pros:** Clean separation. Web app owns its own session. Works with any web framework.  
**Cons:** Requires a one-time endpoint on the web app.

#### Option B — JWT header on every WebView request

```tsx
<WebView
  source={{ uri: baseUrl, headers: { Authorization: `Bearer ${idToken}` } }}
/>
```

The web app verifies the Cognito JWT on every API request.

**Pros:** No web app session needed. Stateless.  
**Cons:** Only works if the web app is purely API-driven (no server-side sessions / cookies). Does not work with Next.js middleware, cookie-based auth, or SSR sessions.

### Token refresh strategy
Cognito ID tokens expire after 1 hour. Refresh tokens last up to 30 days (configurable).

- On app foreground (`AppState` change to `active`): check if `idToken` is within 5 minutes of expiry and refresh silently
- If refresh fails: call `signOut()` → redirect to login screen
- Never store the raw password

---

## 3. App Store Migration

### Critical rule
**Reviews, ratings, and download counts are permanently tied to the bundle identifier (iOS) and package name (Android). They cannot be migrated between listings — they must be preserved by using the exact same identifiers.**

### Steps

1. **Find the existing identifiers** from the current live app:
   - iOS: Open the app's App Store page → check App Store Connect → look under App Information → Bundle ID
   - Android: Check the Play Store URL: `play.google.com/store/apps/details?id=<PACKAGE_NAME>`

2. **Set them in `app.json` before any release build:**
   ```json
   {
     "expo": {
       "ios":     { "bundleIdentifier": "com.oldapp.bundleid" },
       "android": { "package":          "com.oldapp.packagename" }
     }
   }
   ```
   > The current placeholder `com.solai.app` **must** be replaced with the production values.

3. **Submit as an update** to the existing store listing — not a new app.

4. **Use the same developer accounts:**
   - iOS: Same Apple Developer account that owns the existing app
   - Android: Same Google Play Console account, or use Play Console's "Transfer app" feature (preserves everything)

### If the previous developer won't hand over accounts
- **iOS:** Reviews cannot be transferred between Apple accounts. Starting a new listing means losing all reviews. Contact Apple Developer Support — in rare cases they can assist.
- **Android:** Play Console has an official app transfer mechanism. Request the transfer from the previous developer. Reviews, ratings, and install history are preserved.

---

## 4. Deep Linking

### Two layers needed

#### Layer 1 — Universal Links / App Links (preferred)

`https://solaiexp.vercel.app/auction/123` opens the app directly when installed. Falls back to the browser if not installed.

**Web app changes:**

Host these files on `solaiexp.vercel.app`:

```
/.well-known/apple-app-site-association   (iOS)
/.well-known/assetlinks.json              (Android)
```

`apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "<TEAM_ID>.com.solai.app",
      "paths": ["/auction/*", "/vehicle/*", "/lot/*"]
    }]
  }
}
```

`assetlinks.json`:
```json
[{
  "relation":  ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace":              "android_app",
    "package_name":           "com.solai.app",
    "sha256_cert_fingerprints": ["<YOUR_SIGNING_CERT_SHA256>"]
  }
}]
```

**`app.json` additions:**
```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:solaiexp.vercel.app"]
    },
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{ "scheme": "https", "host": "solaiexp.vercel.app" }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
```

#### Layer 2 — Custom URL scheme

`solai://auction/123` — used from push notifications, marketing emails, QR codes.

**`app.json`:** Change `"scheme": "testapp"` → `"scheme": "solai"`

**`app/index.tsx` handler:**
```ts
import * as Linking from 'expo-linking';

const url = Linking.useURL();

useEffect(() => {
  if (!url || !isAuthenticated) return;
  const { path } = Linking.parse(url);
  if (path) {
    webViewRef.current?.injectJavaScript(
      `window.location.href = ${JSON.stringify(baseUrl + '/' + path)}; true;`
    );
  }
}, [url, isAuthenticated]);
```

### Deep link examples

| Link | Opens |
|---|---|
| `solai://auction/456` | Auction detail page 456 |
| `solai://vehicle/789` | Vehicle detail page 789 |
| `https://solaiexp.vercel.app/auction/456` | Same page (universal link) |

---

### Deep link → WebView navigation (in-app handling)

When the OS delivers a deep link to the running app, the link must be translated into a WebView navigation. There are two scenarios.

#### Scenario A — Cold start (app was closed)

The OS launches the app because the user tapped a link. The WebView hasn't loaded yet.

```
User taps link
  → OS launches app
  → Splash screen shows
  → Auth check runs (SecureStore / Cognito refresh)
  → If authenticated: app/index.tsx mounts, WebView loads baseUrl
  → Deep link URL retrieved via Linking.getInitialURL()
  → Wait for onLoadEnd to fire on the WebView
  → injectJavaScript: window.location.href = targetUrl
```

**Implementation in `app/index.tsx`:**
```ts
import * as Linking from 'expo-linking';

const [pendingDeepLink, setPendingDeepLink] = useState<string | null>(null);

// On mount: grab the URL that cold-started the app
useEffect(() => {
  Linking.getInitialURL().then((url) => {
    if (url) setPendingDeepLink(url);
  });
}, []);

// On warm open: URL arrives while app is already running
const incomingUrl = Linking.useURL();
useEffect(() => {
  if (incomingUrl) setPendingDeepLink(incomingUrl);
}, [incomingUrl]);

// When WebView finishes loading AND we have a pending link: navigate
function handleLoadEnd() {
  setIsLoading(false);
  setLoadingProgress(1);
  if (pendingDeepLink) {
    navigateWebViewToLink(pendingDeepLink);
    setPendingDeepLink(null);
  }
}

function navigateWebViewToLink(url: string) {
  const parsed = Linking.parse(url);
  // parsed.path = 'auction/456' for solai://auction/456
  // For universal links the full https URL can be used directly
  const target = url.startsWith('http')
    ? url                            // universal link → use as-is
    : baseUrl + '/' + parsed.path;   // custom scheme → map to baseUrl path
  webViewRef.current?.injectJavaScript(
    `window.location.href = ${JSON.stringify(target)}; true;`
  );
}
```

#### Scenario B — Warm start (app already open)

The user taps a link while the app is in the foreground or background. The WebView is already loaded.

`Linking.useURL()` fires immediately → `setPendingDeepLink` → `navigateWebViewToLink` runs right away (no need to wait for `onLoadEnd`):

```ts
useEffect(() => {
  if (incomingUrl && !isLoading) {
    navigateWebViewToLink(incomingUrl);
  } else if (incomingUrl && isLoading) {
    setPendingDeepLink(incomingUrl); // wait for load to finish
  }
}, [incomingUrl]);
```

#### Unauthenticated deep link

If the link arrives but the user is not logged in, store the link and redirect to login. After successful sign-in, consume the stored link:

```ts
// In AuthContext.signIn() success callback:
if (pendingDeepLink) {
  navigateWebViewToLink(pendingDeepLink);
  setPendingDeepLink(null);
}
```

#### Path mapping table

| Incoming link | Target WebView URL |
|---|---|
| `solai://auction/123` | `https://solaiexp.vercel.app/auction/123` |
| `solai://vehicle/456` | `https://solaiexp.vercel.app/vehicle/456` |
| `https://solaiexp.vercel.app/auction/123` | `https://solaiexp.vercel.app/auction/123` (unchanged) |
| `solai://watchlist` | `https://solaiexp.vercel.app/watchlist` |

#### Restrictions & edge cases

- `Linking.getInitialURL()` returns `null` on normal app launches (no link) — always null-check
- Universal links only work if the `.well-known/apple-app-site-association` and `.well-known/assetlinks.json` files are served correctly with `Content-Type: application/json` and no redirect
- On Android, universal link verification (`autoVerify: true`) can take up to 20 seconds on first install
- If the WebView is navigating when the link arrives, wait for `onLoadEnd` before injecting

---

## 5. Reusing Web Components

### Good news: nothing to duplicate

The entire content area is a WebView. Any mobile-responsive component the web team ships is immediately visible in the app — no React Native equivalent needed. The web platform is the single source of truth for UI.

### When native IS justified

| Feature | Why native |
|---|---|
| Camera / file picker | OS permission UX, performance, background upload |
| Push notifications | Only possible natively (already implemented) |
| Haptic feedback | Web vibration API unreliable across devices |
| Biometric auth (Face ID / fingerprint) | Not accessible from a WebView |
| Widgets / lock screen | Native-only |

### Bridge pattern for web-triggered native features

Web page requests a native capability:
```js
// Web (runs in WebView)
window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'openCamera' }));
```

Native handles it and returns the result:
```ts
// app/index.tsx
onMessage={(event) => {
  const msg = JSON.parse(event.nativeEvent.data);
  if (msg.type === 'openCamera') {
    // launch expo-image-picker
    // then inject result back
    webViewRef.current?.injectJavaScript(
      `window.dispatchEvent(new CustomEvent('native:cameraResult', {
        detail: { uri: "${photoUri}" }
      })); true;`
    );
  }
}}
```

**Rule of thumb:** If a feature can be done in the web, do it in the web. Only cross the bridge when the device OS requires it.

---

## 6. Bottom Navigation

### Recommendation: keep native (already built)

| | Native (current) | Web-rendered tabs |
|---|---|---|
| Response time | Instant | Requires page navigation |
| Haptic feedback | ✅ (already wired) | ✗ |
| Safe area handling | ✅ automatic | CSS coordination required |
| App-like feel | ✅ | Feels like a website |
| Offline resilience | ✅ | No content if no network |
| Maintenance | One place | Diverges: web + native |

### How tab navigation works today

Tab press → `injectJavaScript(`window.location.href = url`)` → web app's client-side router handles the navigation instantly (no server round-trip for SPAs). This is effectively native-speed navigation.

### When to add native screen transitions

If a screen is **entirely native** (camera, AR viewer, native form), push it onto a React Navigation `Stack.Navigator` layered above the WebView shell. The WebView stays mounted underneath (session preserved), and the native screen slides in/out with OS-native animations.

---

## 6b. Native-Like Page Transitions (Lightweight)

The WebView renders web pages — by default navigating between pages has no animation, which feels un-app-like. The following approaches give a native feel with minimal code.

### Option A — Fade overlay on load (recommended, ~15 lines)

Show a brief fade-to-white (or fade-to-background) overlay whenever the WebView starts loading a new page. Already has everything needed — Reanimated is installed.

```tsx
// In app/index.tsx — add these two pieces:

const fadeAnim = useRef(new Animated.Value(0)).current;

function handleLoadStart() {
  setIsLoading(true);
  setLoadingProgress(0);
  Animated.timing(fadeAnim, {
    toValue: 1, duration: 80, useNativeDriver: true,
  }).start();
}

function handleLoadEnd() {
  setIsLoading(false);
  setLoadingProgress(1);
  Animated.timing(fadeAnim, {
    toValue: 0, duration: 180, useNativeDriver: true,
  }).start();
}

// In JSX — overlay on top of WebView:
<Animated.View
  pointerEvents="none"
  style={[StyleSheet.absoluteFill, { opacity: fadeAnim, backgroundColor: '#fff', zIndex: 5 }]}
/>
```

**Result:** pages fade in instead of snapping. Feels like a native push transition without any routing change. The `pointerEvents="none"` means it never blocks taps.

---

### Option B — Slide animation via CSS injection (web-side, zero native code)

Inject a CSS class into every page that slides new content in from the right — exactly like a native push navigation:

```ts
// In injectedJavaScript prop on WebView:
const TRANSITION_CSS = `
  (function() {
    var style = document.createElement('style');
    style.textContent = \`
      @keyframes slideIn {
        from { opacity: 0; transform: translateX(18px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      body { animation: slideIn 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94); }
    \`;
    document.head.appendChild(style);
  })(); true;
`;
```

Add to `<WebView injectedJavaScript={TRANSITION_CSS + injectedCSS} .../>`.

**Result:** every page load slides in from the right. Works for any web framework. No dependencies needed.

**Caveat:** only fires on full page loads. SPA client-side navigation (React Router, Next.js router) won't trigger it — the web app needs its own route-change animation for those.

---

### Option C — Native Stack for specific screens (full native feel)

For screens that need a true native slide (e.g. a detail page, camera, or checkout flow), mount them as a native Stack screen above the WebView:

```tsx
// app/_layout.tsx
<Stack>
  <Stack.Screen name="index"        options={{ headerShown: false }} />
  <Stack.Screen name="auction/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
  <Stack.Screen name="login"        options={{ headerShown: false, animation: 'fade' }} />
</Stack>
```

The WebView stays alive underneath (session preserved). The new screen slides over it with the OS's native animation curve.

**Use this when:** the destination screen is fully native. Not suitable for WebView-rendered content (would require loading a second WebView, breaking cookie sharing).

---

### Comparison

| Option | Code to add | Works for SPA nav | Feels native |
|---|---|---|---|
| A — Fade overlay | ~15 lines native | ✅ (every load) | ✅ subtle & clean |
| B — CSS slide injection | ~10 lines CSS | ✗ (full loads only) | ✅ slide-in feel |
| C — Native Stack screen | Config only | N/A | ✅✅ full OS animation |

**Recommended:** combine A + C. Fade overlay for WebView navigations, native Stack for any fully-native screens.

---

## 7. Floating Auction Bar

A persistent native bar sits just above the bottom tab bar, showing live auction data polled from the API.

### Layout

```
┌─────────────────────────────────────┐
│           WebView content           │
│                                     │
├─────────────────────────────────────┤  ← AuctionBar  (~48 px)
│  🔴  Lot 42 · $1,200  ↑ Outbid     │
│  👁 Watching 3  ·  🏆 Winning 1    │
├─────────────────────────────────────┤  ← AppTabBar   (56 px)
│   Auctions   Watchlist  Sell   ⚙   │
└─────────────────────────────────────┘
```

The bar is `position: absolute`, `bottom = TAB_BAR_HEIGHT + insets.bottom`.  
The CSS padding injected into the WebView must increase by `AUCTION_BAR_HEIGHT` when the bar is visible.

### Files to create

**`hooks/use-auction-bar.ts`**
```ts
// Polls GET /api/auction/live-summary every 10 seconds while authenticated
// Sends Authorization: Bearer {idToken} header
// Returns AuctionSummary | null
// Clears data on signOut

type AuctionSummary = {
  activeLotId:   string;
  lotTitle:      string;
  currentBid:    number;
  currency:      string;
  status:        'winning' | 'outbid' | 'watching' | 'idle';
  watchingCount: number;
  winningCount:  number;
  auctionPath:   string; // '/auctions/123' — WebView navigates here on tap
};
```

**`components/auction/AuctionBar.tsx`**
```tsx
// Slim bar, ~48px tall
// Left: lot title + current bid
// Right: status chip (Winning / Outbid / Watching)
// Full-row tap → injects window.location.href to auctionPath in WebView
// Animated: SlideInUp on first data, SlideOutDown when status=idle
// Color: green border = winning, orange = outbid, grey = watching
```

### Polling vs WebSocket

| | Polling (start here) | WebSocket (upgrade path) |
|---|---|---|
| Complexity | Low | Medium |
| Latency | Up to interval (10s) | ~Real-time |
| Battery | Slightly higher | Lower (no repeated connections) |
| Server requirement | Any REST API | Requires WS server |

The hook interface is the same either way — swap the internals without changing `AuctionBar.tsx`.

### `app/index.tsx` changes needed
```ts
import { AuctionBar, AUCTION_BAR_HEIGHT } from '@/components/auction/AuctionBar';
import { useAuctionBar } from '@/hooks/use-auction-bar';

const { auctionData, navigateToAuction } = useAuctionBar();

// Update injected padding:
const bottomPad = TAB_BAR_HEIGHT
  + (auctionData ? AUCTION_BAR_HEIGHT : 0)
  + insets.bottom;

// In JSX (between WebView and AppTabBar):
{isAuthenticated && auctionData && (
  <AuctionBar
    data={auctionData}
    onPress={() => navigateToAuction(webViewRef)}
  />
)}
```

---

## 8. WebView ↔ Native Bridge

### Native → WebView (`injectJavaScript`)

Used for: tab navigation, padding updates, pushing auth tokens to the web app, sending auction data updates.

```ts
webViewRef.current?.injectJavaScript(`
  window.dispatchEvent(new CustomEvent('native:auctionUpdate', {
    detail: ${JSON.stringify(payload)}
  }));
  true;
`);
```

Web app listens:
```ts
window.addEventListener('native:auctionUpdate', (e) => {
  console.log(e.detail); // AuctionSummary
});
```

**Rules:**
- Must end with `true;` (WebView logs a warning otherwise)
- Runs in the page's `window` context — can access any JS on the page
- Cannot be called before `onLoadEnd` fires

### WebView → Native (`postMessage` / `onMessage`)

Used for: receiving auth tokens from the web app after web login, requesting native capabilities (camera, haptics), signalling server-side logout.

```ts
// Web page (inside WebView):
window.ReactNativeWebView?.postMessage(JSON.stringify({
  type: 'auth',
  idToken: 'eyJ...'
}));
```

```tsx
// app/index.tsx:
<WebView
  onMessage={(event) => {
    const msg = JSON.parse(event.nativeEvent.data);
    switch (msg.type) {
      case 'auth':      handleWebAuth(msg.idToken); break;
      case 'haptic':    Haptics.impactAsync(msg.style); break;
      case 'navigateTo': handleTabPress(msg.path); break;
    }
  }}
/>
```

**Rules:**
- Messages are **strings only** — always `JSON.stringify` / `JSON.parse`
- `window.ReactNativeWebView` is `undefined` in a normal browser — always guard: `window.ReactNativeWebView?.postMessage(...)`
- Cannot send a response back directly — use `injectJavaScript` to reply

### Recommended: typed message registry

```ts
// constants/bridge-messages.ts
export type NativeToWebMessage =
  | { type: 'auctionUpdate'; data: AuctionSummary }
  | { type: 'authConfirmed' }
  | { type: 'sessionExpired' };

export type WebToNativeMessage =
  | { type: 'auth';       idToken: string }
  | { type: 'haptic';     style: 'light' | 'medium' | 'heavy' }
  | { type: 'navigateTo'; path: string }
  | { type: 'openCamera' }
  | { type: 'bid';        lotId: string; amount: number };
```

Typed unions catch unhandled message types at compile time.

### Full comparison

| | `postMessage` (web → native) | `injectJavaScript` (native → web) |
|---|---|---|
| Direction | Web → Native | Native → Web |
| Data type | String (JSON.stringify required) | Any JS expression |
| Latency | ~1 frame | ~1 frame |
| Error handling | None built-in | No return value; errors silent |
| Security concern | Validate `msg.type` — any injected ad/script can also postMessage | Full DOM access — sanitise any user data you interpolate |
| Offline | Queued until WebView processes it | Fails silently if page not loaded |
| Alternative | `onShouldStartLoadWithRequest` URL interception | Set `injectedJavaScript` prop for page-load-time scripts |

### Gotchas

1. **`injectedJavaScript` prop** runs once on every page load — use it for setup code (e.g. injecting padding).
2. **`injectJavaScript()` method** runs on demand — use it for events (e.g. pushing an auction update).
3. Deep links that open the app are handled via `expo-linking`'s `useURL()` hook — not via the bridge.
4. Never interpolate untrusted user data directly into `injectJavaScript` strings — escape with `JSON.stringify`.

---

## 9. In-App Banners

### Short answer: yes, the existing system handles it — just add one `postMessage` case

The app already has a fully built in-app notification banner system in:
- [`contexts/InAppNotificationContext.tsx`](contexts/InAppNotificationContext.tsx) — queue, timer, `showNotification()`
- [`components/notifications/InAppNotificationBanner.tsx`](components/notifications/InAppNotificationBanner.tsx) — animated banner, 3 styles

### What already works (native-triggered)

```ts
const { showNotification } = useInAppNotification();

showNotification('Cache & cookies cleared', 'success');  // green
showNotification('Network error', 'error');              // red
showNotification('Lot 42 updated', 'info');             // blue (default)

// Optional custom duration (ms):
showNotification('Bid placed!', 'success', 5000);
```

The banner slides in from the top with a spring animation (Reanimated), sits at `insets.top + 8`, and auto-dismisses. Multiple calls queue up and show one by one with a 300 ms gap.

### Banner appearance

```
┌─────────────────────────────────────┐
│  ✓  Bid placed successfully!        │  ← green (success)
└─────────────────────────────────────┘
     ↕ slides in from top, auto-dismisses after 3s

┌─────────────────────────────────────┐
│  ✕  Network error — try again       │  ← red (error)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ℹ  Lot 42 price updated            │  ← blue (info)
└─────────────────────────────────────┘
```

Position: `position: absolute`, top-of-screen, `zIndex: 9999` — renders above everything including the settings overlay and auction bar.

### Triggering banners from the web app (via postMessage)

The web app can trigger a native banner with one `postMessage` call. This is the right pattern — the messaging bridge already handles web → native communication.

**Web side (inside the WebView page):**
```js
window.ReactNativeWebView?.postMessage(JSON.stringify({
  type:     'banner',
  message:  'Your bid was accepted!',
  style:    'success',   // 'info' | 'success' | 'error'
  duration: 4000,        // optional, ms — default 3000
}));
```

**Native side — add one case to `onMessage` in `app/index.tsx`:**
```tsx
<WebView
  onMessage={(event) => {
    const msg = JSON.parse(event.nativeEvent.data);
    switch (msg.type) {
      case 'banner':
        showNotification(
          msg.message,
          msg.style ?? 'info',
          msg.duration ?? 3000,
        );
        break;
      // ... other cases
    }
  }}
/>
```

That's the entire implementation — 5 lines of native code.

### Banner vs push notification — when to use which

| Scenario | Use |
|---|---|
| App is open, action completed (bid placed, item added to watchlist) | In-app banner (`postMessage`) |
| App is in background or closed | Push notification (`expo-notifications`) |
| Persistent status (current auction, outbid) | Floating Auction Bar (§7) |
| Critical alert requiring user decision | `Alert.alert()` (native dialog) |

### Update the bridge message type registry

Add `banner` to the typed registry in `constants/bridge-messages.ts`:
```ts
export type WebToNativeMessage =
  | { type: 'banner'; message: string; style?: 'info' | 'success' | 'error'; duration?: number }
  | { type: 'auth';       idToken: string }
  | { type: 'haptic';     style: 'light' | 'medium' | 'heavy' }
  | { type: 'navigateTo'; path: string }
  | { type: 'openCamera' }
  | { type: 'bid';        lotId: string; amount: number };
```

### Restrictions

- Banner is purely visual — no action/tap target (dismisses on its own). If you need a tappable notification that navigates somewhere, either add an `onPress` prop to `InAppNotificationBanner` or use the Floating Auction Bar instead.
- One banner at a time — extras queue up. If the web app fires many banners rapidly, they'll display sequentially. Keep durations short (2–3 s) in high-frequency scenarios.
- The banner renders above the WebView via `InAppNotificationContext` which is mounted at the root layout level — it works even when the settings overlay is open.

---

## Implementation Priority

| # | Feature | Effort | Dependency |
|---|---|---|---|
| 1 | Fix bundle IDs (§3) | Low | Old dev hands over IDs |
| 2 | Deep link custom scheme (§4) | Low | None |
| 3 | WebView ↔ Native bridge types (§8) | Low | None |
| 4 | In-app banners via postMessage (§9) | Low | None — system already built |
| 5 | Deep link → WebView navigation (§4) | Low | None |
| 6 | Cognito native login (§1) | Medium | Cognito pool IDs from AWS |
| 7 | Web session handshake endpoint (§2) | Medium | Web team builds `/auth/native` |
| 8 | Floating auction bar (§7) | Medium | API endpoint spec from backend team |
| 9 | Universal links (§4) | Medium | Web team hosts `.well-known` files |
