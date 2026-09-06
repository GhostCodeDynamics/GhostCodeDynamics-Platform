import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal data-fetching hook: loading / error / retry / abort support
 * without any external state library.
 *
 * The fetcher receives ({ signal }) and must return the resolved value.
 * Re-runs when `deps` change. Stale responses are discarded via
 * AbortController + a request id guard.
 */
export function useAsync(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ status: "idle", data: undefined, error: null });
  const requestIdRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    if (!enabled) {
      setState({ status: "idle", data: undefined, error: null });
      return () => {};
    }
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    setState((s) => ({
      status: "loading",
      data: s.data,
      error: null,
    }));

    fetcherRef
      .current({ signal: controller.signal })
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        setState({ status: "success", data, error: null });
      })
      .catch((error) => {
        if (requestId !== requestIdRef.current) return;
        if (error && error.name === "AbortError") return;
        setState((s) => ({ status: "error", data: s.data, error }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(run, [run]);

  const retry = useCallback(() => {
    run();
  }, [run]);

  return { ...state, retry };
}
