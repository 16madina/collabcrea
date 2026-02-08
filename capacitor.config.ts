import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.collabcrea.app',
  appName: 'collabcrea',
  webDir: 'dist',
  server: {
    url: 'https://10ffe8ef-2a67-4f9b-bb4a-3a8eec126aa0.lovableproject.com?forceHideBadge=true',
    cleartext: true
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
