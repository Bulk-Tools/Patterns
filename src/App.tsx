import { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, Settings2, Image as ImageIcon } from 'lucide-react';
import { PatternParams, EngineType, drawTile, CanvasGraphics, SVGGraphics, generateRandomParams, getTileDimensions, PALETTES, PaletteType } from './lib/engines';
import clsx from 'clsx';

const RATIOS = {
  '1:1': 1,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
  '21:9': 21 / 9
};

const RESOLUTIONS = {
  '4K (3840px)': 3840,
  '8K (7680px)': 7680,
  '16K (15360px)': 15360,
  '32K (30720px)': 30720,
  '40K (40000px)': 40000
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [params, setParams] = useState<PatternParams>(() => generateRandomParams(50));
  const [complexityLock, setComplexityLock] = useState<number>(50);
  const [exportRatio, setExportRatio] = useState<keyof typeof RATIOS>('16:9');
  const [exportRes, setExportRes] = useState<keyof typeof RESOLUTIONS>('8K (7680px)');
  
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;

  // Render tile pattern offscreen when params change
  useEffect(() => {
    const { W, H, effGridX, effGridY } = getTileDimensions(params);
    const cvs = document.createElement('canvas');
    cvs.width = W;
    cvs.height = H;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const gCtx = new CanvasGraphics(ctx);
    drawTile(gCtx, params, W, H, effGridX, effGridY);
    patternCanvasRef.current = cvs;
    
    renderView();
  }, [params]);

  // Viewport interactions (Pan/Zoom)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isDragging = false;
    let lastPos = { x: 0, y: 0 };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.002;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, viewRef.current.scale * Math.exp(delta)), 100);
      
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const dx = (mouseX - viewRef.current.x) * (newScale / viewRef.current.scale - 1);
      const dy = (mouseY - viewRef.current.y) * (newScale / viewRef.current.scale - 1);

      setView(v => ({ x: v.x - dx, y: v.y - dy, scale: newScale }));
    };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastPos = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      lastPos = { x: e.clientX, y: e.clientY };
      setView(v => ({ x: v.x + dx, y: v.y + dy, scale: v.scale }));
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDragging = false;
      el.releasePointerCapture(e.pointerId);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  // Update canvas on view or resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        renderView();
      }
    };
    handleResize(); // initial set
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    renderView();
  }, [view]);

  const renderView = () => {
    if (!canvasRef.current || !patternCanvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    const bg = PALETTES[params.palette][PALETTES[params.palette].length - 1];
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(view.x, view.y);
    ctx.scale(view.scale, view.scale);

    const pattern = ctx.createPattern(patternCanvasRef.current, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      const invScale = 1 / view.scale;
      const startX = -view.x * invScale;
      const startY = -view.y * invScale;
      const w = canvas.width * invScale;
      const h = canvas.height * invScale;
      ctx.fillRect(startX, startY, w, h);
    }
  };

  const handleGlobalRandomize = () => {
    setParams(generateRandomParams(complexityLock));
  };

  const getExportDims = () => {
    const r = RATIOS[exportRatio];
    const res = RESOLUTIONS[exportRes];
    if (r >= 1) {
      return { w: res, h: Math.round(res / r) };
    } else {
      return { h: res, w: Math.round(res * r) };
    }
  };

  const exportSVG = () => {
    const { w, h } = getExportDims();
    const { W, H, effGridX, effGridY } = getTileDimensions(params);
    
    const svgCtx = new SVGGraphics(W, H);
    drawTile(svgCtx, params, W, H, effGridX, effGridY);
    const tileDef = svgCtx.getTileSVG();
    
    const bg = PALETTES[params.palette][PALETTES[params.palette].length - 1];
    
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        ${tileDef}
      </defs>
      <rect width="100%" height="100%" fill="${bg}" />
      <rect width="100%" height="100%" fill="url(#tile)" />
    </svg>`;
    
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pattern-${params.engine}-${exportRatio.replace(':', 'x')}-${exportRes.split(' ')[0]}-${params.seed}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPNG = () => {
    const { w, h } = getExportDims();
    if (Math.max(w, h) > 32767) {
      alert("Browser limits prevent PNG exports larger than ~32K. Please use SVG for 40K exports.");
      return;
    }

    if (!patternCanvasRef.current) return;
    
    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    const bg = PALETTES[params.palette][PALETTES[params.palette].length - 1];
    outCtx.fillStyle = bg;
    outCtx.fillRect(0, 0, w, h);

    const pattern = outCtx.createPattern(patternCanvasRef.current, 'repeat');
    if (pattern) {
      outCtx.fillStyle = pattern;
      outCtx.fillRect(0, 0, w, h);
    }

    try {
      const url = outCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `pattern-${params.engine}-${exportRatio.replace(':', 'x')}-${exportRes.split(' ')[0]}-${params.seed}.png`;
      a.click();
    } catch(err) {
      alert("Canvas too large for device memory. Please select a lower resolution for PNG, or use SVG format (resolution independent).");
    }
  };

  const updateParam = <K extends keyof PatternParams>(key: K, value: PatternParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value, seed: Math.floor(Math.random() * 4294967296) }));
  };

  return (
    <div className="flex h-screen w-full bg-[#0B0C10] text-[#C5C6C7] font-sans overflow-hidden">
      {/* Sidebar Control Panel */}
      <div className="w-[320px] flex-shrink-0 border-r border-[#45A29E]/20 bg-[#1F2833] flex flex-col relative z-10 shadow-2xl">
        <div className="p-6 border-b border-[#45A29E]/10">
          <h1 className="text-[#66FCF1] font-black tracking-tighter text-xl flex items-center gap-2">
            PATTERN FORGE
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-semibold mt-1">Computational Mathematical Engine</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1] block mb-2">Mathematical Engine</label>
                <select 
                  className="w-full bg-[#0B0C10] border border-[#45A29E]/30 rounded p-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-[#66FCF1] text-[#C5C6C7] transition-colors"
                  value={params.engine}
                  onChange={(e) => updateParam('engine', e.target.value as EngineType)}
                >
                  <option value="isometric">Isometric Lattice v2.4</option>
                  <option value="wave">Harmonic Wave Synthesis</option>
                  <option value="ribbon">Parametric Ribbon Curve</option>
                  <option value="truchet">Truchet Maze Matrix</option>
                  <option value="hexagonal">Hexagonal Tessellation</option>
                  <option value="spirograph">Orbital Spirograph</option>
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] mb-1 uppercase font-semibold">
                    <span>Grid X</span>
                    <span className="text-[#66FCF1] font-mono">{params.gridX}</span>
                  </div>
                  <input type="range" min="2" max="50" value={params.gridX} onChange={e => updateParam('gridX', parseInt(e.target.value))} className="w-full h-1 bg-[#0B0C10] rounded-lg appearance-none cursor-pointer accent-[#66FCF1]" />
                </div>
                
                <div>
                  <div className="flex justify-between text-[10px] mb-1 uppercase font-semibold">
                    <span>Grid Y</span>
                    <span className="text-[#66FCF1] font-mono">{params.gridY}</span>
                  </div>
                  <input type="range" min="2" max="50" value={params.gridY} onChange={e => updateParam('gridY', parseInt(e.target.value))} className="w-full h-1 bg-[#0B0C10] rounded-lg appearance-none cursor-pointer accent-[#66FCF1]" />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1 uppercase font-semibold">
                    <span>Stroke Weight</span>
                    <span className="text-[#66FCF1] font-mono">{params.strokeWeight}px</span>
                  </div>
                  <input type="range" min="1" max="25" value={params.strokeWeight} onChange={e => updateParam('strokeWeight', parseInt(e.target.value))} className="w-full h-1 bg-[#0B0C10] rounded-lg appearance-none cursor-pointer accent-[#66FCF1]" />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] mb-1 uppercase font-semibold">
                    <span>Complexity / Density</span>
                    <span className="text-[#66FCF1] font-mono">{params.complexity}</span>
                  </div>
                  <input type="range" min="1" max="100" value={params.complexity} onChange={e => updateParam('complexity', parseInt(e.target.value))} className="w-full h-1 bg-[#0B0C10] rounded-lg appearance-none cursor-pointer accent-[#66FCF1]" />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1] block mb-2">Color Palette</label>
                  <select 
                    className="w-full bg-[#0B0C10] border border-[#45A29E]/30 rounded p-2 text-sm appearance-none cursor-pointer focus:outline-none focus:border-[#66FCF1] text-[#C5C6C7] transition-colors"
                    value={params.palette}
                    onChange={(e) => updateParam('palette', e.target.value as PaletteType)}
                  >
                    {Object.keys(PALETTES).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
        </div>

        <div className="p-6 bg-[#0B0C10]/50 border-t border-[#45A29E]/10 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1] flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5" />
                Randomizer Lock
              </label>
              <span className="text-[10px] font-mono text-[#C5C6C7]">{complexityLock}%</span>
            </div>
            <input 
              type="range" min="1" max="100" 
              value={complexityLock} 
              onChange={e => setComplexityLock(parseInt(e.target.value))} 
              className="w-full h-1 bg-[#1F2833] rounded-lg appearance-none cursor-pointer accent-[#66FCF1]" 
            />
            <button 
              onClick={handleGlobalRandomize}
              className="w-full bg-[#66FCF1] text-[#0B0C10] font-black py-4 rounded text-sm hover:bg-white transition-colors uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(102,252,241,0.15)] hover:shadow-[0_0_20px_rgba(102,252,241,0.3)]"
            >
              <RefreshCw className="w-4 h-4" />
              Randomize & Generate
            </button>
          </div>
          
          <div className="space-y-3 pt-2 border-t border-[#45A29E]/20">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#66FCF1] block">Export Settings</label>
            <div className="grid grid-cols-2 gap-2">
               <select 
                  className="w-full bg-[#1F2833] border border-[#45A29E]/30 rounded p-2 text-xs appearance-none cursor-pointer focus:outline-none focus:border-[#66FCF1] text-[#C5C6C7]"
                  value={exportRatio}
                  onChange={(e) => setExportRatio(e.target.value as any)}
                >
                  {Object.keys(RATIOS).map(r => <option key={r} value={r}>Ratio {r}</option>)}
                </select>
                <select 
                  className="w-full bg-[#1F2833] border border-[#45A29E]/30 rounded p-2 text-xs appearance-none cursor-pointer focus:outline-none focus:border-[#66FCF1] text-[#C5C6C7]"
                  value={exportRes}
                  onChange={(e) => setExportRes(e.target.value as any)}
                >
                  {Object.keys(RESOLUTIONS).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={exportSVG}
                className="px-4 py-2 bg-[#66FCF1] text-[#0B0C10] border border-[#66FCF1] rounded text-[11px] font-bold uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                SVG
              </button>
              <button 
                onClick={exportPNG}
                className="px-4 py-2 bg-[#1F2833] border border-[#45A29E]/30 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-[#45A29E] hover:text-white transition-all flex justify-center items-center gap-2 text-[#C5C6C7]"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                PNG
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Preview Canvas */}
      <div className="flex-1 relative flex flex-col bg-[#050505] cursor-grab active:cursor-grabbing overflow-hidden" ref={containerRef}>
        <div className="absolute top-6 left-6 p-3 bg-[#0B0C10]/80 backdrop-blur-md border border-[#45A29E]/30 rounded flex items-center gap-4 z-10 pointer-events-none">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-tighter opacity-50">Current Engine</span>
            <span className="text-xs font-mono text-[#66FCF1] uppercase">{params.engine}</span>
          </div>
          <div className="w-px h-6 bg-[#45A29E]/20"></div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-tighter opacity-50">Pan / Zoom</span>
            <span className="text-xs font-mono">{(view.scale * 100).toFixed(0)}%</span>
          </div>
        </div>

        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full object-cover touch-none"
        />
        
        {/* Tooltip / Hint */}
        <div className="absolute bottom-16 right-6 flex flex-col items-end gap-4 pointer-events-none z-10">
          <div className="bg-[#0B0C10]/60 p-3 rounded-lg border border-white/5 text-[9px] text-[#C5C6C7] tracking-widest uppercase">
            Scroll to zoom &middot; Drag to pan
          </div>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#1F2833] border-t border-[#45A29E]/20 flex items-center px-6 justify-between text-[9px] font-mono tracking-widest opacity-70 z-10 pointer-events-none">
          <div className="flex gap-6">
            <span>RENDER_ENGINE: CANVAS_2D</span>
            <span>SEED: {params.seed.toString(16).toUpperCase()}</span>
          </div>
          <div className="flex gap-6 text-[#66FCF1]">
            <span className="animate-pulse">● LIVE_PREVIEW_ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

