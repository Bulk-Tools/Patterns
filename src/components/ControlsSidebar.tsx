import { Download, Heart, RefreshCw, Settings2, Share2, Trash2 } from 'lucide-react';
import { PatternParams, PALETTES, PaletteType } from '../lib/engines';
import { ENGINE_REGISTRY } from '../lib/engineRegistry';
import { RatioKey, RATIOS, ResolutionKey, RESOLUTIONS } from '../lib/patternConfig';
import { FavoritePattern } from '../lib/favorites';
import { PresetPack } from '../lib/presets';

interface ControlsSidebarProps {
  params: PatternParams;
  updateParam: <K extends keyof PatternParams>(key: K, value: PatternParams[K]) => void;
  complexityLock: number;
  setComplexityLock: (value: number) => void;
  onRandomize: () => void;
  exportRatio: RatioKey;
  setExportRatio: (ratio: RatioKey) => void;
  exportRes: ResolutionKey;
  setExportRes: (resolution: ResolutionKey) => void;
  transparentBg: boolean;
  setTransparentBg: (value: boolean) => void;
  dpiScale: number;
  setDpiScale: (value: number) => void;
  batchAllRatios: boolean;
  setBatchAllRatios: (value: boolean) => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onCopyShare: () => void;
  onSaveFavorite: () => void;
  favorites: FavoritePattern[];
  onLoadFavorite: (favorite: FavoritePattern) => void;
  onRemoveFavorite: (id: string) => void;
  presetPacks: PresetPack[];
  onApplyPreset: (packId: string, presetId: string) => void;
  resetGrid: () => void;
  resetStyling: () => void;
  resetExport: () => void;
  exportBusy: boolean;
}

export function ControlsSidebar(props: ControlsSidebarProps) {
  return (
    <aside className="w-[360px] flex-shrink-0 border-r border-[#45A29E]/20 bg-[#1F2833] flex flex-col relative z-10 shadow-2xl">
      <header className="p-6 border-b border-[#45A29E]/10">
        <h1 className="text-[#66FCF1] font-black tracking-tighter text-xl">PATTERN FORGE</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-semibold mt-1">Advanced procedural pattern toolkit</p>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <section aria-labelledby="engine-controls" className="space-y-3">
          <div className="flex items-center justify-between">
            <label id="engine-controls" htmlFor="engine-select" className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1]">
              Engine
            </label>
          </div>
          <select
            id="engine-select"
            className="w-full bg-[#0B0C10] border border-[#45A29E]/30 rounded p-2 text-sm focus:outline-none focus:border-[#66FCF1]"
            value={props.params.engine}
            onChange={(event) => props.updateParam('engine', event.target.value as PatternParams['engine'])}
          >
            {ENGINE_REGISTRY.map((engine) => (
              <option key={engine.id} value={engine.id}>
                {engine.label}
              </option>
            ))}
          </select>
        </section>

        <section aria-labelledby="grid-controls" className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 id="grid-controls" className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1]">
              Grid & Detail
            </h2>
            <button onClick={props.resetGrid} className="text-[10px] uppercase text-[#66FCF1] hover:text-white" type="button">
              Reset
            </button>
          </div>

          <label className="text-[10px] block">
            Grid X ({props.params.gridX})
            <input aria-label="Grid X" type="range" min="2" max="50" value={props.params.gridX} onChange={(event) => props.updateParam('gridX', parseInt(event.target.value, 10))} className="w-full" />
          </label>
          <label className="text-[10px] block">
            Grid Y ({props.params.gridY})
            <input aria-label="Grid Y" type="range" min="2" max="50" value={props.params.gridY} onChange={(event) => props.updateParam('gridY', parseInt(event.target.value, 10))} className="w-full" />
          </label>
          <label className="text-[10px] block">
            Complexity ({props.params.complexity})
            <input aria-label="Complexity" type="range" min="1" max="100" value={props.params.complexity} onChange={(event) => props.updateParam('complexity', parseInt(event.target.value, 10))} className="w-full" />
          </label>
        </section>

        <section aria-labelledby="style-controls" className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 id="style-controls" className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1]">
              Styling
            </h2>
            <button onClick={props.resetStyling} className="text-[10px] uppercase text-[#66FCF1] hover:text-white" type="button">
              Reset
            </button>
          </div>
          <label className="text-[10px] block">
            Stroke Weight ({props.params.strokeWeight}px)
            <input aria-label="Stroke Weight" type="range" min="1" max="25" value={props.params.strokeWeight} onChange={(event) => props.updateParam('strokeWeight', parseInt(event.target.value, 10))} className="w-full" />
          </label>
          <label htmlFor="palette-select" className="text-[10px] uppercase block">Palette</label>
          <select
            id="palette-select"
            className="w-full bg-[#0B0C10] border border-[#45A29E]/30 rounded p-2 text-sm"
            value={props.params.palette}
            onChange={(event) => props.updateParam('palette', event.target.value as PaletteType)}
          >
            {Object.keys(PALETTES).map((paletteName) => (
              <option key={paletteName} value={paletteName}>
                {paletteName}
              </option>
            ))}
          </select>
        </section>

        <section aria-labelledby="presets" className="space-y-2">
          <h2 id="presets" className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1]">
            Preset Packs
          </h2>
          {props.presetPacks.map((pack) => (
            <div key={pack.id} className="bg-[#0B0C10]/70 rounded border border-[#45A29E]/20 p-2">
              <div className="text-[10px] font-semibold uppercase mb-2">{pack.name}</div>
              <div className="flex flex-wrap gap-2">
                {pack.presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="text-[10px] px-2 py-1 rounded border border-[#45A29E]/30 hover:border-[#66FCF1]"
                    onClick={() => props.onApplyPreset(pack.id, preset.id)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      <footer className="p-6 bg-[#0B0C10]/50 border-t border-[#45A29E]/10 space-y-5">
        <section className="space-y-2" aria-labelledby="randomizer">
          <div className="flex justify-between items-center">
            <h2 id="randomizer" className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1] flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5" />
              Randomizer Lock
            </h2>
            <span className="text-[10px] font-mono">{props.complexityLock}%</span>
          </div>
          <input aria-label="Randomizer lock" type="range" min="1" max="100" value={props.complexityLock} onChange={(event) => props.setComplexityLock(parseInt(event.target.value, 10))} className="w-full" />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={props.onRandomize} type="button" className="col-span-2 bg-[#66FCF1] text-[#0B0C10] font-black py-3 rounded text-sm hover:bg-white transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Randomize
            </button>
            <button type="button" onClick={props.onCopyShare} className="px-3 py-2 bg-[#1F2833] border border-[#45A29E]/30 rounded text-[11px] uppercase flex items-center justify-center gap-2">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button type="button" onClick={props.onSaveFavorite} className="px-3 py-2 bg-[#1F2833] border border-[#45A29E]/30 rounded text-[11px] uppercase flex items-center justify-center gap-2">
              <Heart className="w-3.5 h-3.5" />
              Favorite
            </button>
          </div>
        </section>

        <section className="space-y-2 border-t border-[#45A29E]/20 pt-4" aria-labelledby="export-settings">
          <div className="flex justify-between items-center">
            <h2 id="export-settings" className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1]">
              Export Settings
            </h2>
            <button onClick={props.resetExport} className="text-[10px] uppercase text-[#66FCF1] hover:text-white" type="button">
              Reset
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={props.exportRatio} onChange={(event) => props.setExportRatio(event.target.value as RatioKey)} className="w-full bg-[#1F2833] border border-[#45A29E]/30 rounded p-2 text-xs">
              {Object.keys(RATIOS).map((ratio) => (
                <option key={ratio} value={ratio}>
                  Ratio {ratio}
                </option>
              ))}
            </select>
            <select value={props.exportRes} onChange={(event) => props.setExportRes(event.target.value as ResolutionKey)} className="w-full bg-[#1F2833] border border-[#45A29E]/30 rounded p-2 text-xs">
              {Object.keys(RESOLUTIONS).map((resolution) => (
                <option key={resolution} value={resolution}>
                  {resolution}
                </option>
              ))}
            </select>
          </div>
          <label className="text-[10px] flex items-center gap-2">
            <input type="checkbox" checked={props.transparentBg} onChange={(event) => props.setTransparentBg(event.target.checked)} />
            Transparent background
          </label>
          <label className="text-[10px] flex items-center gap-2">
            DPI scale
            <input type="number" min={1} max={4} step={0.5} value={props.dpiScale} onChange={(event) => props.setDpiScale(Number(event.target.value) || 1)} className="bg-[#1F2833] border border-[#45A29E]/30 rounded px-2 py-1 w-20" />
          </label>
          <label className="text-[10px] flex items-center gap-2">
            <input type="checkbox" checked={props.batchAllRatios} onChange={(event) => props.setBatchAllRatios(event.target.checked)} />
            Batch export all ratios
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={props.onExportSVG} type="button" disabled={props.exportBusy} className="px-4 py-2 bg-[#66FCF1] text-[#0B0C10] border border-[#66FCF1] rounded text-[11px] font-bold uppercase tracking-widest flex justify-center items-center gap-2 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> SVG
            </button>
            <button onClick={props.onExportPNG} type="button" disabled={props.exportBusy} className="px-4 py-2 bg-[#1F2833] border border-[#45A29E]/30 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-[#45A29E] hover:text-white transition-all flex justify-center items-center gap-2 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> PNG
            </button>
          </div>
        </section>

        <section className="space-y-2 border-t border-[#45A29E]/20 pt-4" aria-labelledby="favorites-list">
          <h2 id="favorites-list" className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1]">
            Favorites
          </h2>
          <div className="max-h-28 overflow-y-auto space-y-1">
            {props.favorites.length === 0 && <p className="text-[10px] opacity-60">No favorites saved yet.</p>}
            {props.favorites.map((favorite) => (
              <div key={favorite.id} className="text-[10px] flex gap-2 items-center justify-between bg-[#1F2833]/70 rounded px-2 py-1">
                <button type="button" className="truncate text-left flex-1 hover:text-[#66FCF1]" onClick={() => props.onLoadFavorite(favorite)}>
                  {favorite.name}
                </button>
                <button type="button" onClick={() => props.onRemoveFavorite(favorite.id)} aria-label={`Remove ${favorite.name}`}>
                  <Trash2 className="w-3 h-3 text-[#FF8A8A]" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </footer>
    </aside>
  );
}
