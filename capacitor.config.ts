import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.10ffe8ef2a674f9bbb4a3a8eec126aa0',
  appName: 'collabcrea',
  webDir: 'dist',
  server: {
    url: 'https://10ffe8ef-2a67-4f9b-bb4a-3a8eec126aa0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
