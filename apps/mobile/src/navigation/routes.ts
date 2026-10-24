import type { HomeScreenMode } from '../screens/HomeScreen';
import type { FeedbackPrefill } from '../lib/api';
import type { WordLength } from '../stats/stats';

export type Route =
  | { readonly screen: 'home' }
  | { readonly screen: 'game'; readonly mode: HomeScreenMode; readonly length: WordLength }
  | { readonly screen: 'howToPlay' }
  | { readonly screen: 'settings' }
  | { readonly screen: 'stats'; readonly length: WordLength }
  | {
      readonly screen: 'feedback';
      readonly initialKind: 'general' | 'word_report';
      readonly prefill?: FeedbackPrefill;
    };

export interface NavigationState {
  readonly stack: readonly Route[];
}

export type NavigationAction =
  | { readonly type: 'push'; readonly route: Route }
  | { readonly type: 'back' }
  | { readonly type: 'reset' };

const HOME_ROUTE: Route = { screen: 'home' };
const MIN_STACK_SIZE_WITH_BACK = 2;

// R7/AE5: a first launch that has not seen How to play yet starts with it
// pushed on top of home, so the hardware back button (and the screen's own
// close action) return to home exactly like opening it from the menu would.
export function createInitialNavigationState(hasSeenHowToPlay = true): NavigationState {
  if (hasSeenHowToPlay) return { stack: [HOME_ROUTE] };
  return { stack: [HOME_ROUTE, { screen: 'howToPlay' }] };
}

export function canGoBack(state: NavigationState): boolean {
  return state.stack.length >= MIN_STACK_SIZE_WITH_BACK;
}

export function currentRoute(state: NavigationState): Route {
  return state.stack[state.stack.length - 1] ?? HOME_ROUTE;
}

export function reduceNavigation(state: NavigationState, action: NavigationAction): NavigationState {
  if (action.type === 'push') return { stack: [...state.stack, action.route] };
  if (action.type === 'reset') return createInitialNavigationState();
  if (!canGoBack(state)) return state;
  return { stack: state.stack.slice(0, -1) };
}
