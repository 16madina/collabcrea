import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePushNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications not supported on web');
      return;
    }

    setIsSupported(true);
    registerPushNotifications();
  }, []);

  // Save token to database when user is authenticated
  useEffect(() => {
    if (token && user?.id) {
      savePushToken(token, user.id);
    }
  }, [token, user?.id]);

  const registerPushNotifications = async () => {
    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Register with FCM
      await PushNotifications.register();

      // Listen for token
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        setToken(token.value);
      });

      // Handle registration errors
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', error);
      });

      // Handle received notifications when app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
      });

      // Handle notification tap
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed:', notification);
        // Navigate to relevant screen based on notification data
        const data = notification.notification.data;
        if (data?.route) {
          window.location.href = data.route;
        }
      });

    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  const savePushToken = async (pushToken: string, userId: string) => {
    try {
      // You can save the token to your database to send targeted notifications
      console.log('Saving push token for user:', userId);
      // Example: Save to a push_tokens table
      // await supabase.from('push_tokens').upsert({
      //   user_id: userId,
      //   token: pushToken,
      //   platform: Capacitor.getPlatform()
      // });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  return {
    token,
    isSupported
  };
};
