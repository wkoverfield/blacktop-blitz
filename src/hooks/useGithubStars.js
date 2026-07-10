import { useEffect, useState } from "react";

/**
 * GitHub star count for the STAR ON GITHUB chip/button — packet 003.
 *
 * Client-side fetch of the public repos endpoint, cached in localStorage for
 * an hour (the unauthenticated API allows 60 req/hr per IP). Returns a number
 * once known, or null while loading / on any failure — callers render exactly
 * the pre-packet chip when null (no error UI, no layout shift).
 */

const API_URL = "https://api.github.com/repos/wkoverfield/blacktop-blitz";
const CACHE_KEY = "blacktop-blitz-stars";
const CACHE_TTL_MS = 60 * 60 * 1000;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { count, ts } = JSON.parse(raw);
    if (typeof count !== "number" || Date.now() - ts > CACHE_TTL_MS) return null;
    return count;
  } catch {
    return null;
  }
}

function writeCache(count) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ count, ts: Date.now() }));
  } catch {
    /* private mode — just refetch next load */
  }
}

export function formatStars(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

export default function useGithubStars() {
  const [stars, setStars] = useState(readCache);

  useEffect(() => {
    if (readCache() !== null) return; // fresh cache — no request
    let cancelled = false;
    fetch(API_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (typeof data.stargazers_count !== "number") return;
        writeCache(data.stargazers_count);
        if (!cancelled) setStars(data.stargazers_count);
      })
      .catch(() => {
        /* silent — chip renders exactly as before (contract 11) */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return stars;
}
