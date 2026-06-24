import { PatternParams, clampPatternParams } from './engines';

export const QUERY_KEY = 'pattern';

export function encodePattern(params: PatternParams): string {
  return btoa(JSON.stringify(params));
}

export function decodePattern(encoded: string): PatternParams | null {
  try {
    const decoded = atob(encoded);
    return clampPatternParams(JSON.parse(decoded));
  } catch {
    return null;
  }
}

export function readPatternFromUrl(): PatternParams | null {
  const query = new URLSearchParams(window.location.search);
  const encoded = query.get(QUERY_KEY);
  if (!encoded) return null;
  return decodePattern(encoded);
}

export function writePatternToUrl(params: PatternParams) {
  const query = new URLSearchParams(window.location.search);
  query.set(QUERY_KEY, encodePattern(params));
  const next = `${window.location.pathname}?${query.toString()}`;
  window.history.replaceState(null, '', next);
}
