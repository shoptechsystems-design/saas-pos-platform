import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Change before your first store upload; it can never be changed afterwards.
  appId: "com.omnipos.app",
  appName: "OmniPOS",
  webDir: "dist",
  // CAP_DEV=1 allows plain-http API calls while testing against a local server. Never ship that build.
  server: { androidScheme: process.env.CAP_DEV ? "http" : "https", cleartext: Boolean(process.env.CAP_DEV) },
  android: { backgroundColor: "#FFFFFF" },
  ios: { backgroundColor: "#FFFFFF", contentInset: "never" },
  plugins: {
    // Route fetch() through the native HTTP stack: no browser CORS restrictions, works with any server URL.
    CapacitorHttp: { enabled: true },
    SplashScreen: { launchShowDuration: 700, backgroundColor: "#0F172A", showSpinner: false },
    Keyboard: { resizeOnFullScreen: true },
  },
};

export default config;
