import { useCallback, useEffect, useRef, useState } from "react";
import { Api, parseApiError } from "@/lib/api";
import type { SearchResult } from "@/lib/books";

/** Debounced title search with stale-request cancellation. */
export function useBookSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const ctrl = useRef<AbortController | null>(null);

  const run = useCallback(async (q: string) => {
    const term = q.trim();
    if (!term) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setLoading(true);
    setError("");
    try {
      const r = await Api.searchByName(term, c.signal);
      if (!c.signal.aborted) setResults(r);
    } catch (e) {
      if (!c.signal.aborted) {
        const m = parseApiError(e, "Search failed.").message;
        if (m) setError(m);
      }
    } finally {
      if (!c.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(() => run(query), 500);
    return () => clearTimeout(t);
  }, [query, run]);

  useEffect(() => () => ctrl.current?.abort(), []);

  const clear = () => {
    ctrl.current?.abort();
    setResults(null);
    setError("");
    setLoading(false);
  };

  return { query, setQuery, results, loading, error, submit: () => run(query), clear };
}
