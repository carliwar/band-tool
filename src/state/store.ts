import { useEffect, useState } from 'react';
import { subscribe } from '../db/database';

/**
 * Subscribe to any DB change. Returns a counter that increments on each notify.
 * Use it as a dependency in effects/memos that read from the repository.
 */
export function useDbVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    return subscribe(() => setV((x) => x + 1));
  }, []);
  return v;
}
