import { useEffect, useState, useCallback } from 'react';
import { getActiveSession, startSession } from '../db/repository';
import { useDbVersion } from './store';

interface GuardState {
  pendingAction: (() => void) | null;
  open: boolean;
}

/**
 * Hook for editing a song with session guard.
 * If there's no active session, intercept the action, ask user to confirm
 * starting a new session, and only then apply.
 */
export function useSessionGuard(songId: number | null) {
  const dbV = useDbVersion();
  const [state, setState] = useState<GuardState>({ pendingAction: null, open: false });
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    if (songId == null) {
      setHasActive(false);
      return;
    }
    setHasActive(getActiveSession(songId) != null);
  }, [songId, dbV]);

  const guard = useCallback(
    (action: () => void) => {
      if (songId == null) return action();
      const active = getActiveSession(songId);
      if (active) {
        action();
      } else {
        setState({ pendingAction: action, open: true });
      }
    },
    [songId],
  );

  const confirm = useCallback(() => {
    if (songId == null) return;
    startSession(songId);
    const action = state.pendingAction;
    setState({ pendingAction: null, open: false });
    if (action) action();
  }, [songId, state.pendingAction]);

  const cancel = useCallback(() => {
    setState({ pendingAction: null, open: false });
  }, []);

  return {
    guard,
    isModalOpen: state.open,
    confirmAndStartSession: confirm,
    cancel,
    hasActiveSession: hasActive,
  };
}
