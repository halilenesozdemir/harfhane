import { useState, useEffect, useCallback } from 'react';
import { subscribePush, unsubscribePush } from '../lib/auth-api';

const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? '';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = Uint8Array.from(rawData, (c) => c.charCodeAt(0));
  return arr.buffer as ArrayBuffer;
}

type NotificationState = 'unsupported' | 'default' | 'granted' | 'denied';

interface UseNotificationsReturn {
  state: NotificationState;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function useNotifications(token: string | null): UseNotificationsReturn {
  const [state, setState] = useState<NotificationState>('unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    setState(Notification.permission as NotificationState);

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(sub !== null);
      }).catch(() => undefined);
    }).catch(() => undefined);
  }, []);

  const subscribe = useCallback(async (): Promise<void> => {
    if (!token || !VAPID_PUBLIC_KEY) return;
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setState(permission as NotificationState);
      if (permission !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      const keys = json.keys as Record<string, string> | undefined;
      await subscribePush(token, {
        endpoint: sub.endpoint,
        p256dh: keys?.['p256dh'] ?? '',
        auth: keys?.['auth'] ?? '',
      });

      setIsSubscribed(true);
    } catch {
      setState(Notification.permission as NotificationState);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!token) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(token, sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  return { state, isSubscribed, isLoading, subscribe, unsubscribe };
}
