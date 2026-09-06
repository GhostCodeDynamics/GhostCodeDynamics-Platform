import { useCallback, useEffect, useRef } from "react";
import { useBlocker } from "react-router";

const CONFIRM_MESSAGE =
  "You have unsaved changes. Leave this editor and discard them?";

/**
 * Guards an editor against losing unsaved changes:
 * - intercepts in-app navigation via useBlocker and asks for confirmation;
 * - intercepts tab close / reload via beforeunload.
 *
 * Returns { markClean }, which an editor MUST call in the same tick a save
 * succeeds, BEFORE navigating away, so the guard is disarmed for the next
 * transition instead of showing a false "unsaved changes" prompt.
 *
 * Why refs instead of the `dirty` value alone: useBlocker registers the block
 * function with the router inside an effect, and the router consults the last
 * REGISTERED function at the moment navigate() runs. React batches setState,
 * so setting dirty=false immediately before a navigation would not reach the
 * router before the transition is checked. Reading the latest dirty/released
 * state from refs at block time makes every transition decision accurate even
 * in the same synchronous tick as a successful save.
 */
export function useUnsavedChangesGuard(dirty) {
  const dirtyRef = useRef(dirty);
  const releasedRef = useRef(false);

  // Mirror the latest value synchronously; re-arm the guard whenever the form
  // becomes dirty again (e.g. "save → clean → edit again → leave").
  dirtyRef.current = dirty;
  if (dirty) releasedRef.current = false;

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) => {
        if (releasedRef.current) return false;
        return (
          dirtyRef.current && currentLocation.pathname !== nextLocation.pathname
        );
      },
      []
    )
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return undefined;
    const leave = window.confirm(CONFIRM_MESSAGE);
    if (leave) blocker.proceed();
    else blocker.reset();
    return undefined;
  }, [blocker]);

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (event) => {
      // Read the latest state so a stale listener (attached before a save
      // flushed) can never warn from an already-clean form.
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = ""; // legacy Chrome/Edge requirement
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const markClean = useCallback(() => {
    dirtyRef.current = false;
    releasedRef.current = true;
  }, []);

  return { markClean };
}