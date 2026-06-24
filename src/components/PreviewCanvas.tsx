import type { RefObject } from 'react';
import { PatternParams } from '../lib/engines';

interface PreviewCanvasProps {
  params: PatternParams;
  renderMs: number;
  warning: string | null;
  viewScale: number;
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function PreviewCanvas({ params, renderMs, warning, viewScale, containerRef, canvasRef }: PreviewCanvasProps) {
  return (
    <section className="flex-1 relative flex flex-col bg-[#050505] cursor-grab active:cursor-grabbing overflow-hidden" ref={containerRef}>
      <div className="absolute top-6 left-6 p-3 bg-[#0B0C10]/80 backdrop-blur-md border border-[#45A29E]/30 rounded flex items-center gap-4 z-10 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-tighter opacity-50">Current Engine</span>
          <span className="text-xs font-mono text-[#66FCF1] uppercase">{params.engine}</span>
        </div>
        <div className="w-px h-6 bg-[#45A29E]/20" />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-tighter opacity-50">Pan / Zoom</span>
          <span className="text-xs font-mono">{(viewScale * 100).toFixed(0)}%</span>
        </div>
      </div>

      {warning && (
        <div role="alert" className="absolute top-24 left-6 z-10 text-[11px] max-w-sm bg-[#3a1c1c]/80 text-[#ffc0c0] border border-[#a14343]/50 rounded px-3 py-2">
          {warning}
        </div>
      )}

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover touch-none" />

      <div className="absolute bottom-16 right-6 flex flex-col items-end gap-4 pointer-events-none z-10">
        <div className="bg-[#0B0C10]/60 p-3 rounded-lg border border-white/5 text-[9px] text-[#C5C6C7] tracking-widest uppercase">Scroll to zoom · Drag to pan</div>
      </div>

      <footer className="absolute bottom-0 left-0 right-0 h-10 bg-[#1F2833] border-t border-[#45A29E]/20 flex items-center px-6 justify-between text-[9px] font-mono tracking-widest opacity-70 z-10 pointer-events-none">
        <div className="flex gap-6">
          <span>RENDER_ENGINE: CANVAS_2D</span>
          <span>SEED: {params.seed.toString(16).toUpperCase()}</span>
          <span>FRAME: {renderMs.toFixed(2)}ms</span>
        </div>
        <div className="flex gap-6 text-[#66FCF1]">
          <span className="animate-pulse">● LIVE_PREVIEW_ACTIVE</span>
        </div>
      </footer>
    </section>
  );
}
