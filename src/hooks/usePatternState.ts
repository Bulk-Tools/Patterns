import { useEffect, useState } from 'react';
import { FavoritePattern, readFavorites, writeFavorites } from '../lib/favorites';
import { PRESET_PACKS, Preset } from '../lib/presets';
import { RatioKey, ResolutionKey } from '../lib/patternConfig';
import { PatternParams, DEFAULT_PATTERN_PARAMS, clampPatternParams, generateRandomParams } from '../lib/engines';
import { readPatternFromUrl, writePatternToUrl } from '../lib/urlState';

const DEFAULT_RATIO: RatioKey = '16:9';
const DEFAULT_RESOLUTION: ResolutionKey = '8K (7680px)';

export function usePatternState() {
  const [params, setParams] = useState<PatternParams>(() => {
    const fromUrl = typeof window !== 'undefined' ? readPatternFromUrl() : null;
    return fromUrl ?? { ...DEFAULT_PATTERN_PARAMS, ...generateRandomParams(50) };
  });

  const [favorites, setFavorites] = useState<FavoritePattern[]>(() => (typeof window !== 'undefined' ? readFavorites() : []));
  const [complexityLock, setComplexityLock] = useState(50);
  const [exportRatio, setExportRatio] = useState<RatioKey>(DEFAULT_RATIO);
  const [exportRes, setExportRes] = useState<ResolutionKey>(DEFAULT_RESOLUTION);
  const [transparentBg, setTransparentBg] = useState(false);
  const [dpiScale, setDpiScale] = useState(1);
  const [batchAllRatios, setBatchAllRatios] = useState(false);

  useEffect(() => {
    writePatternToUrl(params);
  }, [params]);

  const updateParam = <K extends keyof PatternParams>(key: K, value: PatternParams[K]) => {
    setParams((previous) =>
      clampPatternParams({
        ...previous,
        [key]: value,
        seed: Math.floor(Math.random() * 4294967296),
      }),
    );
  };

  const randomize = () => {
    setParams(generateRandomParams(complexityLock));
  };

  const applyPreset = (preset: Preset) => {
    setParams(
      clampPatternParams({
        ...preset.params,
        seed: Math.floor(Math.random() * 4294967296),
      }),
    );
  };

  const saveFavorite = () => {
    const next: FavoritePattern = {
      id: crypto.randomUUID(),
      name: `${params.engine.toUpperCase()}-${params.seed.toString(16).toUpperCase()}`,
      createdAt: Date.now(),
      params,
    };

    setFavorites((previous) => {
      const merged = [next, ...previous].slice(0, 30);
      writeFavorites(merged);
      return merged;
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((previous) => {
      const merged = previous.filter((item) => item.id !== id);
      writeFavorites(merged);
      return merged;
    });
  };

  const resetGrid = () => {
    setParams((previous) => ({ ...previous, gridX: DEFAULT_PATTERN_PARAMS.gridX, gridY: DEFAULT_PATTERN_PARAMS.gridY }));
  };

  const resetStyling = () => {
    setParams((previous) => ({ ...previous, strokeWeight: DEFAULT_PATTERN_PARAMS.strokeWeight, palette: DEFAULT_PATTERN_PARAMS.palette }));
  };

  const resetExport = () => {
    setExportRatio(DEFAULT_RATIO);
    setExportRes(DEFAULT_RESOLUTION);
    setTransparentBg(false);
    setDpiScale(1);
    setBatchAllRatios(false);
  };

  return {
    params,
    updateParam,
    randomize,
    complexityLock,
    setComplexityLock,
    exportRatio,
    setExportRatio,
    exportRes,
    setExportRes,
    transparentBg,
    setTransparentBg,
    dpiScale,
    setDpiScale,
    batchAllRatios,
    setBatchAllRatios,
    applyPreset,
    presetPacks: PRESET_PACKS,
    favorites,
    saveFavorite,
    removeFavorite,
    setParams,
    resetGrid,
    resetStyling,
    resetExport,
  };
}
