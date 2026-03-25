import { useReducer, useCallback } from 'react';

const SESSION_TARGET = 5;

interface SessionState {
  won: number;
  completed: boolean;
}

type SessionAction = { type: 'win' } | { type: 'lose' };

function reducer(state: SessionState, action: SessionAction): SessionState {
  if (state.completed) return state;
  if (action.type === 'win') {
    const won = state.won + 1;
    return { won, completed: won >= SESSION_TARGET };
  }
  return state;
}

export interface SessionChallenge {
  won: number;
  target: number;
  completed: boolean;
  record: (didWin: boolean) => void;
}

export function useSessionChallenge(): SessionChallenge {
  const [state, dispatch] = useReducer(reducer, { won: 0, completed: false });
  const record = useCallback((didWin: boolean) => {
    dispatch({ type: didWin ? 'win' : 'lose' });
  }, []);
  return { won: state.won, target: SESSION_TARGET, completed: state.completed, record };
}
