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
    
    // Listen for FCM Token from native bridge (iOS sends FCM token via notification)
    const handleFCMToken = (event: CustomEvent<{ token: string }>) => {
      console.log('FCM Token received from native:', event.detail.token);
      if (event.detail.token) {
        setToken(event.detail.token);
      }
    };
    
    window.addEventListener('FCMToken' as any, handleFCMToken);
    
    return () => {
      window.removeEventListener('FCMToken' as any, handleFCMToken);
    };
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

      // Listen for token from Capacitor plugin
      // Note: On iOS, this returns APNs token. We prefer FCM token from native bridge.
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Capacitor push registration token:', token.value);
        // Only use this if we haven't received FCM token from native
        // FCM tokens start with a project-specific prefix followed by :APA91b
        if (!token.value.includes(':APA91b')) {
          // This is likely an APNs token on iOS, we'll wait for FCM token
          console.log('Received APNs token, waiting for FCM token from native bridge...');
        } else {
          // This is already an FCM token (Android or properly bridged iOS)
          setToken(token.value);
        }
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
      console.log('Saving push token for user:', userId);
      
      const platform = Capacitor.getPlatform();
      
      // Upsert the token (insert or update if exists)
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: userId,
            token: pushToken,
            platform: platform,
            device_info: navigator.userAgent,
          },
          {
            onConflict: 'user_id,token',
          }
        );

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const removePushToken = async () => {
    if (!token || !user?.id) return;

    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);

      if (error) {
        console.error('Error removing push token:', error);
      }
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  };

  return {
    token,
    isSupported,
    removePushToken
  };
};
