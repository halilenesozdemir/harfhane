import { renderHook } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { useHardwareBackHandler } from './useHardwareBackHandler';

describe('useHardwareBackHandler', () => {
  it('should register a hardwareBackPress listener and remove it on unmount', async () => {
    const addSpy = jest.spyOn(BackHandler, 'addEventListener');
    const handler = jest.fn(() => true);
    const { unmount } = await renderHook(() => useHardwareBackHandler(handler));

    expect(addSpy).toHaveBeenCalledWith('hardwareBackPress', handler);
    const subscription = addSpy.mock.results[0]?.value as { remove: jest.Mock };
    const removeSpy = jest.spyOn(subscription, 'remove');

    await unmount();

    expect(removeSpy).toHaveBeenCalledTimes(1);
    addSpy.mockRestore();
  });
});
