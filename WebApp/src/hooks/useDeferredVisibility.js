import { useEffect, useRef, useState } from "react";

function useDeferredVisibility(isVisible, delayMs = 180, minVisibleMs = 360) {
  const [shouldRender, setShouldRender] = useState(false);
  const shownAtRef = useRef(0);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    if (showTimerRef.current) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (isVisible) {
      showTimerRef.current = window.setTimeout(() => {
        shownAtRef.current = Date.now();
        setShouldRender(true);
      }, delayMs);

      return () => {
        if (showTimerRef.current) {
          window.clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
        }
      };
    }

    if (!shouldRender) {
      return undefined;
    }

    const elapsed = Date.now() - shownAtRef.current;
    const remaining = Math.max(minVisibleMs - elapsed, 0);

    hideTimerRef.current = window.setTimeout(() => {
      setShouldRender(false);
    }, remaining);

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [delayMs, isVisible, minVisibleMs, shouldRender]);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
      }

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  return shouldRender;
}

export default useDeferredVisibility;
