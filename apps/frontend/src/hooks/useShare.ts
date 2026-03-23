import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseShareReturn {
  share: () => Promise<void>;
  copied: boolean;
  failed: boolean;
}

export function useShare(text: string): UseShareReturn {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      if (failedTimerRef.current) clearTimeout(failedTimerRef.current);
    };
  }, []);

  const markCopied = useCallback(() => {
    setCopied(true);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const markFailed = useCallback(() => {
    setFailed(true);
    failedTimerRef.current = setTimeout(() => setFailed(false), 2000);
  }, []);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      markCopied();
    } catch {
      markFailed();
    }
  }, [text, markCopied, markFailed]);

  const share = useCallback(async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
        markCopied();
        return;
      } catch {
        await copyToClipboard();
        return;
      }
    }
    await copyToClipboard();
  }, [text, markCopied, copyToClipboard]);

  return { share, copied, failed };
}
