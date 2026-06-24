import { EngineType } from './engines';

export interface EnginePlugin {
  id: EngineType;
  label: string;
  description: string;
}

export const ENGINE_REGISTRY: EnginePlugin[] = [
  { id: 'isometric', label: 'Isometric Lattice v2.4', description: 'Angular geometric lattices' },
  { id: 'wave', label: 'Harmonic Wave Synthesis', description: 'Concentric wave fields' },
  { id: 'ribbon', label: 'Parametric Ribbon Curve', description: 'Flowing sine-based loops' },
  { id: 'truchet', label: 'Truchet Maze Matrix', description: 'Arc-based maze tessellation' },
  { id: 'hexagonal', label: 'Hexagonal Tessellation', description: 'Honeycomb structures' },
  { id: 'spirograph', label: 'Orbital Spirograph', description: 'Hypotrochoid and epitrochoid forms' },
];
