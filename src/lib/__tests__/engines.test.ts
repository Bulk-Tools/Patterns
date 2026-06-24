import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PATTERN_PARAMS,
  SVGGraphics,
  clampPatternParams,
  drawTile,
  getTileDimensions,
} from '../engines';

describe('engines', () => {
  it('normalizes out-of-range values', () => {
    const clamped = clampPatternParams({
      ...DEFAULT_PATTERN_PARAMS,
      gridX: 100,
      gridY: 1,
      strokeWeight: 99,
      complexity: 0,
      seed: -10,
    });

    expect(clamped.gridX).toBe(50);
    expect(clamped.gridY).toBe(2);
    expect(clamped.strokeWeight).toBe(25);
    expect(clamped.complexity).toBe(1);
    expect(clamped.seed).toBeGreaterThanOrEqual(0);
  });

  it('uses deterministic output for the same seed', () => {
    const params = {
      ...DEFAULT_PATTERN_PARAMS,
      seed: 99,
      engine: 'wave' as const,
      complexity: 70,
      gridX: 8,
      gridY: 8,
    };

    const first = new SVGGraphics(1000, 1000);
    const second = new SVGGraphics(1000, 1000);
    const dims = getTileDimensions(params);

    drawTile(first, params, dims.W, dims.H, dims.effGridX, dims.effGridY);
    drawTile(second, params, dims.W, dims.H, dims.effGridX, dims.effGridY);

    expect(first.getTileSVG()).toEqual(second.getTileSVG());
  });

  it('enforces seamless tiling constraints per engine', () => {
    const truchet = getTileDimensions({ ...DEFAULT_PATTERN_PARAMS, engine: 'truchet', gridX: 18, gridY: 7 });
    const isometric = getTileDimensions({ ...DEFAULT_PATTERN_PARAMS, engine: 'isometric', gridX: 7, gridY: 11 });

    expect(truchet.effGridY).toBe(truchet.effGridX);
    expect(isometric.effGridY % 2).toBe(0);
  });
});
