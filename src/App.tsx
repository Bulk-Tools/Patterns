import { useMemo, useRef, useState } from 'react';
import { ControlsSidebar } from './components/ControlsSidebar';
import { PreviewCanvas } from './components/PreviewCanvas';
import { usePatternRenderer } from './hooks/usePatternRenderer';
import { usePatternState } from './hooks/usePatternState';
import { PatternParams, PALETTES } from './lib/engines';
import { RATIOS, RESOLUTIONS } from './lib/patternConfig';

function getExportDimensions(ratioKey: keyof typeof RATIOS, resolutionKey: keyof typeof RESOLUTIONS) {
  const ratio = RATIOS[ratioKey];
  const resolution = RESOLUTIONS[resolutionKey];
  if (ratio >= 1) {
    return { width: resolution, height: Math.round(resolution / ratio) };
  }
  return { width: Math.round(resolution * ratio), height: resolution };
}

function downloadFile(filename: string, href: string) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
}

export default function App() {
  const {
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
    presetPacks,
    favorites,
    saveFavorite,
    removeFavorite,
    setParams,
    resetGrid,
    resetStyling,
    resetExport,
  } = usePatternState();

  const { canvasRef, containerRef, view, renderMs, warning, patternCanvasRef } = usePatternRenderer(params);
  const [exportBusy, setExportBusy] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const ratiosToExport = useMemo(() => {
    if (!batchAllRatios) return [exportRatio];
    return Object.keys(RATIOS) as Array<keyof typeof RATIOS>;
  }, [batchAllRatios, exportRatio]);

  const ensureWorker = () => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./workers/exportWorker.ts', import.meta.url), { type: 'module' });
    }
    return workerRef.current;
  };

  const runWorkerExport = <T,>(message: unknown) =>
    new Promise<T>((resolve, reject) => {
      const worker = ensureWorker();
      const onMessage = (event: MessageEvent) => {
        const payload = event.data;
        if (payload?.id !== (message as { id: string }).id) return;

        worker.removeEventListener('message', onMessage);
        if (!payload.ok) {
          reject(new Error(payload.error || 'Worker export failed'));
          return;
        }
        resolve(payload);
      };

      worker.addEventListener('message', onMessage);
      worker.postMessage(message);
    });

  const exportGuardrails = (currentParams: PatternParams, width: number, height: number) => {
    const megapixels = (width * height * dpiScale * dpiScale) / 1_000_000;
    const complexityCost = currentParams.gridX * currentParams.gridY * currentParams.complexity;

    if (megapixels > 500) {
      throw new Error('Export size too large. Reduce resolution or DPI scale.');
    }

    if (complexityCost > 100000) {
      throw new Error('Current pattern complexity is too high for stable export.');
    }
  };

  const exportSVG = async () => {
    setExportBusy(true);
    try {
      for (const ratio of ratiosToExport) {
        const { width, height } = getExportDimensions(ratio, exportRes);
        exportGuardrails(params, width, height);
        const id = `${Date.now()}-${ratio}-svg`;
        const response = await runWorkerExport<{ type: 'svg'; content: string; id: string; ok: true }>({
          id,
          type: 'svg',
          params,
          width,
          height,
          transparent: transparentBg,
        });

        const blob = new Blob([response.content], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        downloadFile(`pattern-${params.engine}-${ratio.replace(':', 'x')}-${exportRes.split(' ')[0]}-${params.seed}.svg`, url);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'SVG export failed');
    } finally {
      setExportBusy(false);
    }
  };

  const exportPNG = async () => {
    setExportBusy(true);
    try {
      for (const ratio of ratiosToExport) {
        const { width, height } = getExportDimensions(ratio, exportRes);
        exportGuardrails(params, width, height);

        const id = `${Date.now()}-${ratio}-png`;
        try {
          const response = await runWorkerExport<{ type: 'png'; content: ArrayBuffer; id: string; ok: true }>({
            id,
            type: 'png',
            params,
            width,
            height,
            transparent: transparentBg,
            dpiScale,
          });

          const blob = new Blob([response.content], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          downloadFile(`pattern-${params.engine}-${ratio.replace(':', 'x')}-${exportRes.split(' ')[0]}-${params.seed}.png`, url);
          URL.revokeObjectURL(url);
          continue;
        } catch {
          if (!patternCanvasRef.current) throw new Error('Preview canvas unavailable for fallback export.');
          const outCanvas = document.createElement('canvas');
          outCanvas.width = Math.round(width * dpiScale);
          outCanvas.height = Math.round(height * dpiScale);
          const outContext = outCanvas.getContext('2d');
          if (!outContext) throw new Error('Failed to create PNG export canvas.');

          if (!transparentBg) {
            const background = PALETTES[params.palette][PALETTES[params.palette].length - 1];
            outContext.fillStyle = background;
            outContext.fillRect(0, 0, outCanvas.width, outCanvas.height);
          }

          const pattern = outContext.createPattern(patternCanvasRef.current, 'repeat');
          if (pattern) {
            outContext.fillStyle = pattern;
            outContext.fillRect(0, 0, outCanvas.width, outCanvas.height);
          }

          const url = outCanvas.toDataURL('image/png');
          downloadFile(`pattern-${params.engine}-${ratio.replace(':', 'x')}-${exportRes.split(' ')[0]}-${params.seed}.png`, url);
        }
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'PNG export failed');
    } finally {
      setExportBusy(false);
    }
  };

  const copyShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('Share link copied to clipboard.');
  };

  return (
    <div className="flex h-screen w-full bg-[#0B0C10] text-[#C5C6C7] font-sans overflow-hidden">
      <ControlsSidebar
        params={params}
        updateParam={updateParam}
        complexityLock={complexityLock}
        setComplexityLock={setComplexityLock}
        onRandomize={randomize}
        exportRatio={exportRatio}
        setExportRatio={setExportRatio}
        exportRes={exportRes}
        setExportRes={setExportRes}
        transparentBg={transparentBg}
        setTransparentBg={setTransparentBg}
        dpiScale={dpiScale}
        setDpiScale={setDpiScale}
        batchAllRatios={batchAllRatios}
        setBatchAllRatios={setBatchAllRatios}
        onExportSVG={exportSVG}
        onExportPNG={exportPNG}
        onCopyShare={copyShare}
        onSaveFavorite={saveFavorite}
        favorites={favorites}
        onLoadFavorite={(favorite) => setParams(favorite.params)}
        onRemoveFavorite={removeFavorite}
        presetPacks={presetPacks}
        onApplyPreset={(packId, presetId) => {
          const preset = presetPacks.find((pack) => pack.id === packId)?.presets.find((item) => item.id === presetId);
          if (preset) applyPreset(preset);
        }}
        resetGrid={resetGrid}
        resetStyling={resetStyling}
        resetExport={resetExport}
        exportBusy={exportBusy}
      />

      <PreviewCanvas params={params} renderMs={renderMs} warning={warning} viewScale={view.scale} containerRef={containerRef} canvasRef={canvasRef} />
    </div>
  );
}
