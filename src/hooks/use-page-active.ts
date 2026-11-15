import { useEffect, useState } from "react";

/** False while the reader is in another tab or window. */
export function usePageActive() {
  const [active, setActive] = useState(() => document.visibilityState !== "hidden");

  useEffect(() => {
    let windowFocused = true;
    const onBlur = () => {
      windowFocused = false;
      setActive(false);
    };
    const onFocus = () => {
      windowFocused = true;
      setActive(document.visibilityState !== "hidden");
    };
    const onVisibilityChange = () => setActive(windowFocused && document.visibilityState !== "hidden");
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return active;
}
