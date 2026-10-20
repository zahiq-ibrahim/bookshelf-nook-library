import { useEffect, useState } from "react";
import { Api } from "@/lib/api";

/** Pings the health endpoint; retries every 5s while down. */
export function useHealth() {
  const [down, setDown] = useState(false);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const ping = async () => {
      try {
        await Api.health();
        if (alive) setDown(false);
      } catch {
        if (alive) { setDown(true); timer = setTimeout(ping, 5000); }
      }
    };
    ping();
    return () => { alive = false; clearTimeout(timer); };
  }, []);
  return down;
}
