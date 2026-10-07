import { describe, expect, it } from 'vitest';
import { canGoBack, createInitialNavigationState, currentRoute, reduceNavigation } from './routes';
import type { NavigationState } from './routes';

describe('routes', () => {
  it('should start on the home route with no back available', () => {
    const state = createInitialNavigationState();
    expect(currentRoute(state)).toEqual({ screen: 'home' });
    expect(canGoBack(state)).toBe(false);
  });

  it('should push a new route onto the stack', () => {
    const state = createInitialNavigationState();
    const next = reduceNavigation(state, { type: 'push', route: { screen: 'settings' } });
    expect(currentRoute(next)).toEqual({ screen: 'settings' });
    expect(canGoBack(next)).toBe(true);
  });

  it('should pop the stack on back', () => {
    const state: NavigationState = { stack: [{ screen: 'home' }, { screen: 'howToPlay' }] };
    const next = reduceNavigation(state, { type: 'back' });
    expect(currentRoute(next)).toEqual({ screen: 'home' });
    expect(canGoBack(next)).toBe(false);
  });

  it('should leave the state unchanged when back is pressed from home', () => {
    const state = createInitialNavigationState();
    const next = reduceNavigation(state, { type: 'back' });
    expect(next).toBe(state);
  });

  it('should reset to the home stack', () => {
    const state: NavigationState = { stack: [{ screen: 'home' }, { screen: 'settings' }, { screen: 'howToPlay' }] };
    const next = reduceNavigation(state, { type: 'reset' });
    expect(currentRoute(next)).toEqual({ screen: 'home' });
    expect(canGoBack(next)).toBe(false);
  });

  it('should start with How to play on top of home when first launch has not seen it (011-AE5)', () => {
    const state = createInitialNavigationState(false);
    expect(currentRoute(state)).toEqual({ screen: 'howToPlay' });
    expect(canGoBack(state)).toBe(true);
    const next = reduceNavigation(state, { type: 'back' });
    expect(currentRoute(next)).toEqual({ screen: 'home' });
  });

  it('should push a game route carrying mode and length', () => {
    const state = createInitialNavigationState();
    const next = reduceNavigation(state, { type: 'push', route: { screen: 'game', mode: 'unlimited', length: 6 } });
    expect(currentRoute(next)).toEqual({ screen: 'game', mode: 'unlimited', length: 6 });
  });
});
