import { CanvasGraphics, PatternParams, SVGGraphics, drawTile, getTileDimensions, PALETTES } from '../lib/engines';

type WorkerRequest =
  | {
      id: string;
      type: 'svg';
      params: PatternParams;
      width: number;
      height: number;
      transparent: boolean;
    }
  | {
      id: string;
      type: 'png';
      params: PatternParams;
      width: number;
      height: number;
      transparent: boolean;
      dpiScale: number;
    };

type WorkerResponse =
  | { id: string; ok: true; type: 'svg'; content: string }
  | { id: string; ok: true; type: 'png'; content: ArrayBuffer }
  | { id: string; ok: false; error: string };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  try {
    if (msg.type === 'svg') {
      const svgCtx = new SVGGraphics(1000, 1000);
      const { W, H, effGridX, effGridY } = getTileDimensions(msg.params);
      drawTile(svgCtx, msg.params, W, H, effGridX, effGridY);
      const tileDef = svgCtx.getTileSVG();
      const background = msg.transparent ? 'none' : PALETTES[msg.params.palette][PALETTES[msg.params.palette].length - 1];

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${msg.width}" height="${msg.height}" viewBox="0 0 ${msg.width} ${msg.height}"><defs>${tileDef}</defs><rect width="100%" height="100%" fill="${background}" /><rect width="100%" height="100%" fill="url(#tile)" /></svg>`;

      const response: WorkerResponse = { id: msg.id, ok: true, type: 'svg', content: svg };
      self.postMessage(response);
      return;
    }

    if (typeof OffscreenCanvas === 'undefined') {
      const response: WorkerResponse = { id: msg.id, ok: false, error: 'OffscreenCanvas is not available in this browser.' };
      self.postMessage(response);
      return;
    }

    const width = Math.round(msg.width * msg.dpiScale);
    const height = Math.round(msg.height * msg.dpiScale);
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');

    if (!context) {
      const response: WorkerResponse = { id: msg.id, ok: false, error: 'Failed to create export canvas context.' };
      self.postMessage(response);
      return;
    }

    if (!msg.transparent) {
      const background = PALETTES[msg.params.palette][PALETTES[msg.params.palette].length - 1];
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);
    }

    const tile = new OffscreenCanvas(1000, 1000);
    const tileCtx = tile.getContext('2d');
    if (!tileCtx) {
      const response: WorkerResponse = { id: msg.id, ok: false, error: 'Failed to create tile canvas context.' };
      self.postMessage(response);
      return;
    }

    const { W, H, effGridX, effGridY } = getTileDimensions(msg.params);
    drawTile(new CanvasGraphics(tileCtx as unknown as CanvasRenderingContext2D), msg.params, W, H, effGridX, effGridY);

    const pattern = context.createPattern(tile, 'repeat');
    if (pattern) {
      context.fillStyle = pattern;
      context.fillRect(0, 0, width, height);
    }

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const buffer = await blob.arrayBuffer();
    const response: WorkerResponse = { id: msg.id, ok: true, type: 'png', content: buffer };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id: msg.id,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown export failure',
    };
    self.postMessage(response);
  }
};
