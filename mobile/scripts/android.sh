#!/usr/bin/env bash
# Builds the Android app. Usage: bash scripts/android.sh apk|aab
set -euo pipefail
cd "$(dirname "$0")/.."

# Capacitor 8 needs JDK 21. Prefer Android Studio's bundled JDK even if JAVA_HOME points at an older one.
STUDIO_JDK="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
if [ -x "$STUDIO_JDK/bin/java" ]; then JAVA_HOME="$STUDIO_JDK"; fi
: "${JAVA_HOME:?Set JAVA_HOME to a JDK 21 install}"
: "${ANDROID_HOME:=$HOME/Library/Android/sdk}"
export JAVA_HOME ANDROID_HOME PATH="$JAVA_HOME/bin:$PATH"

case "${1:-apk}" in
  apk) pnpm sync && (cd android && ./gradlew assembleDebug) && echo "APK: mobile/android/app/build/outputs/apk/debug/app-debug.apk" ;;
  aab) pnpm sync && (cd android && ./gradlew bundleRelease) && echo "AAB: mobile/android/app/build/outputs/bundle/release/app-release.aab" ;;
  *) echo "usage: android.sh apk|aab" >&2; exit 1 ;;
esac
