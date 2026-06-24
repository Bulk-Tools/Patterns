export type EngineType = 'isometric' | 'wave' | 'ribbon' | 'truchet' | 'hexagonal' | 'spirograph';

export const PALETTES = {
  Cyberpunk: ['#FF003C', '#00E5FF', '#F9F002', '#0A0A0A'],
  Monochrome: ['#FFFFFF', '#AAAAAA', '#555555', '#222222'],
  Bauhaus: ['#E03616', '#005B96', '#FCD116', '#1A1A1A'],
  Neon: ['#39FF14', '#FE019A', '#00FFFF', '#BC13FE'],
  Oceanic: ['#006994', '#00A86B', '#40E0D0', '#0F2027'],
  Lava: ['#FF4E00', '#8A1538', '#EC9F05', '#1B0000']
};

export type PaletteType = keyof typeof PALETTES;

export interface PatternParams {
  engine: EngineType;
  gridX: number; // 2 - 50
  gridY: number; // 2 - 50
  strokeWeight: number; // 1 - 25
  complexity: number; // 1 - 100
  palette: PaletteType;
  seed: number;
}

export function generateRandomParams(complexityLock: number): PatternParams {
  const engines: EngineType[] = ['isometric', 'wave', 'ribbon', 'truchet', 'hexagonal', 'spirograph'];
  const engine = engines[Math.floor(Math.random() * engines.length)];
  const palettes = Object.keys(PALETTES) as PaletteType[];
  const palette = palettes[Math.floor(Math.random() * palettes.length)];
  
  const isHigh = complexityLock > 50;
  const gridX = isHigh ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 10) + 3;
  const gridY = isHigh ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 10) + 3;
  const strokeWeight = isHigh ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 10) + 3;
  const complexity = Math.floor(Math.random() * complexityLock) + 1;
  
  return {
    engine,
    gridX,
    gridY,
    strokeWeight,
    complexity,
    palette,
    seed: Math.floor(Math.random() * 4294967296)
  };
}

// 32-bit robust PRNG
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function getTileDimensions(params: PatternParams) {
  let { gridX, gridY, engine } = params;
  if (engine === 'truchet' || engine === 'hexagonal') {
    gridY = gridX; // Force square proportions for these to tile seamlessly
  } else if (engine === 'isometric') {
    gridY = gridY + (gridY % 2); // Force even rows for seamless isometric wrap
  }
  return { W: 1000, H: 1000, effGridX: gridX, effGridY: gridY };
}

export interface GraphicsContext {
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, r: number, sa: number, ea: number): void;
  stroke(): void;
  setStrokeStyle(s: string): void;
  setLineWidth(w: number): void;
  setFillStyle(s: string): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  setOffset(ox: number, oy: number): void;
}

export class CanvasGraphics implements GraphicsContext {
  ox: number = 0;
  oy: number = 0;
  constructor(public ctx: CanvasRenderingContext2D) {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }
  
  beginPath() { this.ctx.beginPath(); }
  moveTo(x: number, y: number) { this.ctx.moveTo(x + this.ox, y + this.oy); }
  lineTo(x: number, y: number) { this.ctx.lineTo(x + this.ox, y + this.oy); }
  arc(x: number, y: number, r: number, sa: number, ea: number) { 
    this.ctx.arc(x + this.ox, y + this.oy, r, sa, ea); 
  }
  stroke() { this.ctx.stroke(); }
  setStrokeStyle(s: string) { this.ctx.strokeStyle = s; }
  setLineWidth(w: number) { this.ctx.lineWidth = w; }
  setFillStyle(s: string) { this.ctx.fillStyle = s; }
  fillRect(x: number, y: number, w: number, h: number) { 
    this.ctx.fillRect(x + this.ox, y + this.oy, w, h); 
  }
  setOffset(ox: number, oy: number) { this.ox = ox; this.oy = oy; }
}

export class SVGGraphics implements GraphicsContext {
  svg: string = '';
  currentPath: string = '';
  strokeStyle: string = '#000';
  lineWidth: number = 1;
  bgFillStyle: string = '#000';
  ox: number = 0;
  oy: number = 0;
  
  constructor(public width: number, public height: number) {}
  
  beginPath() { this.currentPath = ''; }
  moveTo(x: number, y: number) { 
    this.currentPath += `M ${(x + this.ox).toFixed(2)} ${(y + this.oy).toFixed(2)} `; 
  }
  lineTo(x: number, y: number) { 
    this.currentPath += `L ${(x + this.ox).toFixed(2)} ${(y + this.oy).toFixed(2)} `; 
  }
  arc(x: number, y: number, r: number, sa: number, ea: number) {
    const cx = x + this.ox;
    const cy = y + this.oy;
    
    if (Math.abs(ea - sa - Math.PI*2) < 0.01) {
      if (this.currentPath.trim()) this.stroke();
      this.svg += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />\n`;
    } else {
       const sx = cx + r * Math.cos(sa);
       const sy = cy + r * Math.sin(sa);
       const ex = cx + r * Math.cos(ea);
       const ey = cy + r * Math.sin(ea);
       let largeArc = (ea - sa) > Math.PI ? 1 : 0;
       
       if (Math.abs(Math.abs(ea - sa) - Math.PI) < 0.01) largeArc = 0;

       if (this.currentPath) {
           this.currentPath += `L ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} `;
       } else {
           this.currentPath += `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} `;
       }
    }
  }
  stroke() {
    if (this.currentPath.trim()) {
      this.svg += `<path d="${this.currentPath}" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />\n`;
      this.currentPath = '';
    }
  }
  setStrokeStyle(s: string) { this.strokeStyle = s; }
  setLineWidth(w: number) { this.lineWidth = w; }
  setFillStyle(s: string) { this.bgFillStyle = s; }
  fillRect(x: number, y: number, w: number, h: number) {
    if (x === 0 && y === 0 && this.ox === 0 && this.oy === 0) {
       this.svg = `<rect width="${w}" height="${h}" fill="${this.bgFillStyle}" />\n` + this.svg;
    }
  }
  setOffset(ox: number, oy: number) { this.ox = ox; this.oy = oy; }
  
  getTileSVG() {
    return `<pattern id="tile" width="${this.width}" height="${this.height}" patternUnits="userSpaceOnUse">\n${this.svg}\n</pattern>`;
  }
}

function drawEngine(ctx: GraphicsContext, params: PatternParams, W: number, H: number, effGridX: number, effGridY: number) {
  const { engine, strokeWeight, complexity, palette } = params;
  const themeColors = PALETTES[palette];
  const cw = W / effGridX;
  const ch = H / effGridY;
  const rand = mulberry32(params.seed);

  const getColor = () => themeColors[Math.floor(rand() * themeColors.length)];

  ctx.setLineWidth(strokeWeight);

  if (engine === 'isometric') {
    const l1 = Math.PI / 6;
    const l2 = Math.PI / 2;
    const l3 = 5 * Math.PI / 6;
    const len = Math.max(cw, ch) * (0.5 + (complexity / 100) * 1.5);

    for (let i = 0; i <= effGridX + 1; i++) {
      for (let j = 0; j <= effGridY + 1; j++) {
        const x = i * cw + ((j % 2) * cw / 2) - cw;
        const y = j * ch - ch;
        
        ctx.setStrokeStyle(getColor());
        
        if (rand() > 0.3) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + len * Math.cos(l1), y + len * Math.sin(l1));
          ctx.stroke();
        }
        if (rand() > 0.3) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + len * Math.cos(l2), y + len * Math.sin(l2));
          ctx.stroke();
        }
        if (rand() > 0.3) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + len * Math.cos(l3), y + len * Math.sin(l3));
          ctx.stroke();
        }
        
        if (complexity > 50 && rand() > 0.5) {
          ctx.beginPath();
          ctx.arc(x, y, len * 0.2, 0, Math.PI*2);
          ctx.stroke();
        }
      }
    }
  }
  else if (engine === 'wave') {
    const maxR = Math.min(cw, ch) * (0.5 + complexity / 25);
    const steps = Math.max(1, Math.floor(complexity / 10));
    
    for (let i = 0; i < effGridX; i++) {
      for (let j = 0; j < effGridY; j++) {
        const cx = i * cw + cw / 2;
        const cy = j * ch + ch / 2;
        
        const phaseX = (rand() * 20 - 10) * (complexity / 100);
        const phaseY = (rand() * 20 - 10) * (complexity / 100);
        
        for (let s = 1; s <= steps; s++) {
          const r = (maxR / steps) * s;
          ctx.setStrokeStyle(getColor());
          ctx.beginPath();
          ctx.arc(cx + phaseX, cy + phaseY, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }
  else if (engine === 'ribbon') {
    const loops = Math.max(1, Math.floor(complexity / 15));
    for (let i = 0; i < effGridX; i++) {
      for (let j = 0; j < effGridY; j++) {
        const cx = i * cw + cw / 2;
        const cy = j * ch + ch / 2;
        
        ctx.setStrokeStyle(getColor());
        ctx.beginPath();
        
        const a = Math.floor(rand() * 5) + 1;
        const b = Math.floor(rand() * 5) + 1;
        const phase = rand() * Math.PI;
        
        for (let t = 0; t <= Math.PI * 2 * loops; t += 0.05) {
          const x = cx + (cw / 2.2) * Math.sin(a * t + phase);
          const y = cy + (ch / 2.2) * Math.sin(b * t);
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
  else if (engine === 'truchet') {
    const size = cw; // guaranteed square by getTileDimensions
    for (let i = 0; i < effGridX; i++) {
      for (let j = 0; j < effGridY; j++) {
        const x = i * size;
        const y = j * size;
        ctx.setStrokeStyle(getColor());
        
        const type = rand() > 0.5;
        const layers = Math.max(1, Math.floor(complexity / 15));
        
        for (let l = 1; l <= layers; l++) {
          const offset = (l - 1) * (strokeWeight * 2.5);
          const r = size / 2 - offset;
          if (r <= 0) continue;
          
          ctx.beginPath();
          if (type) {
             ctx.arc(x, y, r, 0, Math.PI/2);
             ctx.stroke();
             ctx.beginPath();
             ctx.arc(x + size, y + size, r, Math.PI, Math.PI*1.5);
             ctx.stroke();
          } else {
             ctx.arc(x + size, y, r, Math.PI/2, Math.PI);
             ctx.stroke();
             ctx.beginPath();
             ctx.arc(x, y + size, r, Math.PI*1.5, Math.PI*2);
             ctx.stroke();
          }
        }
      }
    }
  }
  else if (engine === 'spirograph') {
    const loops = Math.max(2, Math.floor(complexity / 3));
    for (let i = 0; i < effGridX; i++) {
        for (let j = 0; j < effGridY; j++) {
            const cx = i * cw + cw / 2;
            const cy = j * ch + ch / 2;
            ctx.setStrokeStyle(getColor());
            ctx.beginPath();
            
            const R = cw * 0.35;
            const r = cw * (0.05 + rand() * 0.2);
            const d = cw * (0.05 + rand() * 0.3);
            
            for (let theta = 0; theta <= Math.PI * 2 * loops; theta += 0.05) {
                const x = cx + (R - r) * Math.cos(theta) + d * Math.cos((R - r) / r * theta);
                const y = cy + (R - r) * Math.sin(theta) - d * Math.sin((R - r) / r * theta);
                if (theta === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
  }
  else if (engine === 'hexagonal') {
    const r = (cw / 2) * (0.5 + complexity / 150);
    const w = r * Math.sqrt(3);
    const h = r * 2;
    for (let i = -1; i <= effGridX * 2; i++) {
        for (let j = -1; j <= effGridY * 2; j++) {
            const x = i * w + (j % 2 === 0 ? 0 : w / 2);
            const y = j * (h * 0.75);
            
            if (x > W + w || y > H + h || x < -w || y < -h) continue;
            
            ctx.setStrokeStyle(getColor());
            ctx.beginPath();
            for (let side = 0; side <= 6; side++) {
                const angle = (side * Math.PI) / 3 - Math.PI / 6;
                const px = x + r * Math.cos(angle);
                const py = y + r * Math.sin(angle);
                if (side === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            
            if (complexity > 30 && rand() > 0.5) {
                ctx.beginPath();
                ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
  }
}

export function drawTile(ctx: GraphicsContext, params: PatternParams, W: number, H: number, effGridX: number, effGridY: number) {
  const bg = PALETTES[params.palette][PALETTES[params.palette].length - 1]; // Use last color as BG
  ctx.setFillStyle(bg);
  ctx.fillRect(0, 0, W, H);
  
  // draw 9 times for perfect seamless wrap across edges
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      ctx.setOffset(dx * W, dy * H);
      drawEngine(ctx, params, W, H, effGridX, effGridY);
    }
  }
  ctx.setOffset(0, 0);
}
