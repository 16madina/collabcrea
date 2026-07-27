import type { CapacitorConfig } from '@capacitor/cli';



// Live web shell (like KiDi+): UI/JS updates without a new Play build.
// Local hot-reload: set NATIVE_APP_URL=http://YOUR_LAN_IP:5173 before cap sync.
const nativeAppUrl = process.env.NATIVE_APP_URL || "https://collabcrea.com";

const config: CapacitorConfig = {
  appId: 'com.collabcrea.app',
  appName: 'collabcrea',
  webDir: 'dist',
  server: {
    url: nativeAppUrl,
    cleartext: nativeAppUrl.startsWith("http://"),
    androidScheme: "https",
    allowNavigation: [
      "collabcrea.com",
      "www.collabcrea.com",
      "collabcrea.lovable.app",
      "*.lovable.app",
      "*.lovableproject.com",
      "*.stripe.com",
      "*.paypal.com",
    ],
  },

  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#0a0612",
      showSpinner: false,
      launchFadeOutDuration: 0
    }
  }
};

export default config;
