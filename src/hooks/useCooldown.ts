import { useEffect, useState } from "react";

/** Countdown in seconds; start(n) begins a cooldown. */
export function useCooldown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, start: (s = 45) => setLeft(s) };
}
