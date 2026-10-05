import { useEffect, useState } from 'react';

const WELCOME_DURATION_MS = 3000;

export function useLoginWelcomeMessage(
  justLoggedIn: boolean,
  username: string | undefined,
  clearJustLoggedIn: () => void
): string {
  const [message, setMessage] = useState('');
  const [prevJustLoggedIn, setPrevJustLoggedIn] = useState(justLoggedIn);

  if (justLoggedIn !== prevJustLoggedIn) {
    setPrevJustLoggedIn(justLoggedIn);
    if (justLoggedIn && username) setMessage(`Hoş geldin, ${username}!`);
  }

  useEffect(() => {
    if (!justLoggedIn || !username) return undefined;
    const timer = setTimeout(() => {
      setMessage('');
      clearJustLoggedIn();
    }, WELCOME_DURATION_MS);
    return () => clearTimeout(timer);
  }, [justLoggedIn, username, clearJustLoggedIn]);

  return message;
}
