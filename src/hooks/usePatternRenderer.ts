import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CanvasGraphics, PALETTES, PatternParams, drawTile, getTileDimensions } from '../lib/engines';

export function usePatternRenderer(params: PatternParams) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [renderMs, setRenderMs] = useState(0);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const warning = useMemo(() => {
    const complexityCost = params.gridX * params.gridY * params.complexity;
    return complexityCost > 85000 ? 'High complexity can reduce responsiveness. Try lowering grid/complexity.' : null;
  }, [params.complexity, params.gridX, params.gridY]);

  const renderView = useCallback(() => {
    if (!canvasRef.current || !patternCanvasRef.current) return;

    const renderStart = performance.now();
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.setTransform(1, 0, 0, 1, 0, 0);
    const background = PALETTES[params.palette][PALETTES[params.palette].length - 1];
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.translate(view.x, view.y);
    context.scale(view.scale, view.scale);

    const pattern = context.createPattern(patternCanvasRef.current, 'repeat');
    if (pattern) {
      context.fillStyle = pattern;
      const invScale = 1 / view.scale;
      const startX = -view.x * invScale;
      const startY = -view.y * invScale;
      const width = canvas.width * invScale;
      const height = canvas.height * invScale;
      context.fillRect(startX, startY, width, height);
    }

    setRenderMs(performance.now() - renderStart);
  }, [params.palette, view]);

  useEffect(() => {
    const { W, H, effGridX, effGridY } = getTileDimensions(params);
    const tile = document.createElement('canvas');
    tile.width = W;
    tile.height = H;
    const context = tile.getContext('2d');
    if (!context) return;

    const graphics = new CanvasGraphics(context);
    drawTile(graphics, params, W, H, effGridX, effGridY);
    patternCanvasRef.current = tile;
    renderView();
  }, [params, renderView]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const zoomSensitivity = 0.002;
      const delta = -event.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, viewRef.current.scale * Math.exp(delta)), 100);

      const rect = element.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const dx = (mouseX - viewRef.current.x) * (newScale / viewRef.current.scale - 1);
      const dy = (mouseY - viewRef.current.y) * (newScale / viewRef.current.scale - 1);

      setView((previous) => ({ x: previous.x - dx, y: previous.y - dy, scale: newScale }));
    };

    let dragging = false;
    let last = { x: 0, y: 0 };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      last = { x: event.clientX, y: event.clientY };
      element.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      last = { x: event.clientX, y: event.clientY };
      setView((previous) => ({ ...previous, x: previous.x + dx, y: previous.y + dy }));
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      element.releasePointerCapture(event.pointerId);
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);

    return () => {
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
      renderView();
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [renderView]);

  useEffect(() => {
    renderView();
  }, [renderView]);

  return { canvasRef, containerRef, view, setView, renderMs, warning, patternCanvasRef };
}
