import { useState, type Dispatch, type SetStateAction } from 'react';

export function useAutoOpenAuthModal(googleAuthFailed: boolean): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [showAuth, setShowAuth] = useState(false);
  const [prevFailed, setPrevFailed] = useState(googleAuthFailed);

  if (googleAuthFailed !== prevFailed) {
    setPrevFailed(googleAuthFailed);
    if (googleAuthFailed) setShowAuth(true);
  }

  return [showAuth, setShowAuth];
}
