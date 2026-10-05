import type { HomeScreenMode } from '../screens/HomeScreen';
import type { WordLength } from '../stats/stats';

export type Route =
  | { readonly screen: 'home' }
  | { readonly screen: 'game'; readonly mode: HomeScreenMode; readonly length: WordLength }
  | { readonly screen: 'howToPlay' }
  | { readonly screen: 'settings' }
  | { readonly screen: 'stats'; readonly length: WordLength };

export interface NavigationState {
  readonly stack: readonly Route[];
}

export type NavigationAction =
  | { readonly type: 'push'; readonly route: Route }
  | { readonly type: 'back' }
  | { readonly type: 'reset' };

const HOME_ROUTE: Route = { screen: 'home' };
const MIN_STACK_SIZE_WITH_BACK = 2;

export function createInitialNavigationState(): NavigationState {
  return { stack: [HOME_ROUTE] };
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
