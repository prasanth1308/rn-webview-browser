# test-app

A React Native WebView browser app built with Expo. Features a full browser screen with navigation controls, a settings screen, and a push/in-app notification foundation.

---

## Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android builds)
- Xcode (for iOS builds, macOS only)

---

## One-time machine setup (macOS — MDM-managed devices)

> **Skip this section if your machine is not MDM-managed.**

Gradle's Java Toolchain feature tries to auto-download JDK 17 from Eclipse Adoptium when building the Android app. On MDM-managed Macs this triggers a privileged application approval dialog and blocks the build.

The fix is to create a space-free symlink to Android Studio's bundled JDK 21 (which satisfies any JDK 17+ requirement) and point Gradle at it.

### 1. Create the JDK symlink

Run once per machine:

```bash
ln -sfn "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ~/android-studio-jdk
```

Verify it works:

```bash
~/android-studio-jdk/bin/java -version
# Expected: openjdk version "21.x.x" ...
```

### 2. Register the JDK with macOS

This makes `java_home` aware of it (used by Gradle's auto-detection):

```bash
mkdir -p ~/Library/Java/JavaVirtualMachines
ln -sfn "/Applications/Android Studio.app/Contents/jbr" ~/Library/Java/JavaVirtualMachines/jbr-21.jdk
```

Verify:

```bash
/usr/libexec/java_home -V
# Expected: 21.x.x ... "JetBrains s.r.o." listed
```

### 3. Set JAVA_HOME in your shell

Add to `~/.zshrc`:

```bash
export JAVA_HOME="$HOME/android-studio-jdk"
export PATH="$JAVA_HOME/bin:$PATH"
```

Then reload:

```bash
source ~/.zshrc
```

### 4. Configure Gradle globally

```bash
mkdir -p ~/.gradle
cat > ~/.gradle/gradle.properties << 'EOF'
org.gradle.java.home=/Users/YOUR_USERNAME/android-studio-jdk
org.gradle.java.installations.paths=/Users/YOUR_USERNAME/android-studio-jdk
org.gradle.java.installations.auto-download=false
EOF
```

Replace `YOUR_USERNAME` with your actual username (`echo $USER`).

---

## Getting started

```bash
npm install
```

The `postinstall` hook (`scripts/patch-gradle-jdk.js`) automatically injects a `gradle.properties` into `node_modules/@react-native/gradle-plugin/`. This patches the React Native included build to use Android Studio's JDK instead of downloading one. Run `npm install` again any time that directory is missing (e.g. after `node_modules` is deleted).

---

## Running the app

### iOS (simulator)

```bash
npm run ios
```

### Android (device or emulator)

```bash
npm run android
```

> **Note:** `react-native-webview` does not work in Expo Go. You must use a development build (`npm run android` / `npm run ios`).

### Web (limited — WebView not available)

```bash
npm run web
```

---

## Project structure

```
app/
  _layout.tsx              # Root layout — wraps SettingsProvider, InAppNotificationProvider
  (tabs)/
    index.tsx              # Browser screen (WebView + nav controls)
    settings.tsx           # Settings screen

components/
  browser/
    BrowserBar.tsx         # Back/forward/reload/home + URL display
    ProgressBar.tsx        # Animated loading progress bar (Reanimated)
    BookmarkPicker.tsx     # Slide-up modal for switching preset URLs
  notifications/
    InAppNotificationBanner.tsx  # Slide-in toast banner (Reanimated)
  settings/
    ProfileSection.tsx     # User name + avatar
    NotificationToggle.tsx # Push notification toggle + token display
    PresetUrlsManager.tsx  # Add/remove bookmarked URLs
    ClearCacheRow.tsx      # Clear WebView cache

contexts/
  SettingsContext.tsx       # AsyncStorage-backed settings (preset URLs, profile, etc.)
  InAppNotificationContext.tsx  # In-app toast queue and provider

hooks/
  use-settings.ts          # Shorthand for SettingsContext
  use-in-app-notification.ts  # Shorthand for InAppNotificationContext
  use-notifications.ts     # Push notification registration + listeners

constants/
  defaults.ts              # DEFAULT_HOME_URL, DEFAULT_PRESET_URLS, STORAGE_KEYS

scripts/
  patch-gradle-jdk.js      # Postinstall — patches @react-native/gradle-plugin for MDM Macs
```

---

## Push notifications

Push notifications are scaffolded but require a dev build and a real device. The `use-notifications` hook:

1. Requests permission on first launch
2. Registers the device and returns an **Expo Push Token**
3. Sets up foreground notification handlers

The token is displayed in **Settings → Notifications**. Send notifications from any backend using this token:

- **Expo Push API:** `https://exp.host/--/api/v2/push/send`
- **AWS SNS:** Register the token with SNS as an FCM/APNs endpoint

No code changes are needed to switch backends — just change where you POST the token.

---

## Troubleshooting

### Android build fails with "Cannot find a Java installation matching languageVersion=17"

Your `~/android-studio-jdk` symlink is missing or the postinstall patch wasn't applied. Run:

```bash
ln -sfn "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ~/android-studio-jdk
npm install   # re-runs postinstall
```

### MDM blocks JDK download (Privileged Application Access dialog)

Follow the [one-time machine setup](#one-time-machine-setup-macos--mdm-managed-devices) section above. The `org.gradle.java.installations.auto-download=false` setting in `~/.gradle/gradle.properties` permanently prevents Gradle from attempting any JDK download.

### WebView shows blank on iOS simulator

Use a physical device or check that the URL starts with `https://`. iOS requires ATS (App Transport Security) for non-localhost URLs.
