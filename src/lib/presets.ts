import { PatternParams } from './engines';

export interface Preset {
  id: string;
  name: string;
  params: Omit<PatternParams, 'seed'>;
}

export interface PresetPack {
  id: string;
  name: string;
  presets: Preset[];
}

export const PRESET_PACKS: PresetPack[] = [
  {
    id: 'geometry-basics',
    name: 'Geometry Basics',
    presets: [
      {
        id: 'iso-grid',
        name: 'Iso Grid',
        params: { engine: 'isometric', gridX: 12, gridY: 12, strokeWeight: 2, complexity: 52, palette: 'Monochrome' },
      },
      {
        id: 'hex-flow',
        name: 'Hex Flow',
        params: { engine: 'hexagonal', gridX: 14, gridY: 14, strokeWeight: 2, complexity: 68, palette: 'Oceanic' },
      },
    ],
  },
  {
    id: 'ornamental',
    name: 'Ornamental',
    presets: [
      {
        id: 'orbital-ribbons',
        name: 'Orbital Ribbons',
        params: { engine: 'spirograph', gridX: 10, gridY: 10, strokeWeight: 2, complexity: 76, palette: 'Neon' },
      },
      {
        id: 'maze-lines',
        name: 'Maze Lines',
        params: { engine: 'truchet', gridX: 16, gridY: 16, strokeWeight: 3, complexity: 61, palette: 'Bauhaus' },
      },
    ],
  },
];
