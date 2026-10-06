import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export function useHardwareBackHandler(handler: () => boolean): void {
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => subscription.remove();
  }, [handler]);
}
