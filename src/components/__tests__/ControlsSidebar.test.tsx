import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ControlsSidebar } from '../ControlsSidebar';
import { DEFAULT_PATTERN_PARAMS } from '../../lib/engines';
import { PRESET_PACKS } from '../../lib/presets';

function createProps() {
  return {
    params: { ...DEFAULT_PATTERN_PARAMS },
    updateParam: vi.fn(),
    complexityLock: 50,
    setComplexityLock: vi.fn(),
    onRandomize: vi.fn(),
    exportRatio: '16:9' as const,
    setExportRatio: vi.fn(),
    exportRes: '8K (7680px)' as const,
    setExportRes: vi.fn(),
    transparentBg: false,
    setTransparentBg: vi.fn(),
    dpiScale: 1,
    setDpiScale: vi.fn(),
    batchAllRatios: false,
    setBatchAllRatios: vi.fn(),
    onExportSVG: vi.fn(),
    onExportPNG: vi.fn(),
    onCopyShare: vi.fn(),
    onSaveFavorite: vi.fn(),
    favorites: [],
    onLoadFavorite: vi.fn(),
    onRemoveFavorite: vi.fn(),
    presetPacks: PRESET_PACKS,
    onApplyPreset: vi.fn(),
    resetGrid: vi.fn(),
    resetStyling: vi.fn(),
    resetExport: vi.fn(),
    exportBusy: false,
  };
}

describe('ControlsSidebar', () => {
  it('renders grouped controls and empty favorites state', () => {
    render(<ControlsSidebar {...createProps()} />);

    expect(screen.getByRole('heading', { name: 'Engine' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Export Settings' })).toBeInTheDocument();
    expect(screen.getByText('No favorites saved yet.')).toBeInTheDocument();
  });

  it('triggers preset application', () => {
    const props = createProps();
    render(<ControlsSidebar {...props} />);

    fireEvent.click(screen.getByRole('button', { name: PRESET_PACKS[0].presets[0].name }));

    expect(props.onApplyPreset).toHaveBeenCalled();
  });
});
