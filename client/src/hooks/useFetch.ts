import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { getErrorMessage, isNotFound } from '../lib/errors';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

// Loads data with loading / error / not-found state and a reload() function.
// Re-runs whenever `deps` change; late responses from older requests are ignored.
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]) {
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null, notFound: false });
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null, notFound: false }));

    fetcher(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null, notFound: false });
      })
      .catch((err) => {
        if (controller.signal.aborted || axios.isCancel(err)) return;
        setState((s) => ({ ...s, loading: false, error: getErrorMessage(err), notFound: isNotFound(err) }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadTick]);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);
  return { ...state, reload };
}
