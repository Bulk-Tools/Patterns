import { PatternParams } from './engines';

export interface FavoritePattern {
  id: string;
  name: string;
  createdAt: number;
  params: PatternParams;
}

const KEY = 'pattern-forge:favorites';

export function readFavorites(): FavoritePattern[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoritePattern[];
  } catch {
    return [];
  }
}

export function writeFavorites(items: FavoritePattern[]) {
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 30)));
}
