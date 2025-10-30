'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Point = number[];
type Snapshot = Point[];
type Size = { width: number; height: number };

export type UseAnnotatorParams = {
  readOnly?: boolean;
  src: string;
  lines: Point[];
  setLines: (v: Point[]) => void;
  stageRef: any;
  isFullscreen?: boolean;
  originalImageSize?: Size | null;
  setOriginalImageSize: (s: Size) => void;
  normalizeCoordinates: (
    points: number[][],
    w: number,
    h: number,
    baseSize: Size,
  ) => number[][];
  denormalizeCoordinates: (
    points: number[][],
    w: number,
    h: number,
    baseSize: Size,
  ) => number[][];
};

export function useAnnotator({
  readOnly = false,
  src,
  lines,
  setLines,
  isFullscreen = false,
  originalImageSize,
  setOriginalImageSize,
  normalizeCoordinates,
  denormalizeCoordinates,
}: UseAnnotatorParams) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const [baseSize, setBaseSize] = useState<Size | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [undoStack, setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack, setRedoStack] = useState<Snapshot[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      const size = { width: img.naturalWidth, height: img.naturalHeight };
      setBaseSize(size);
      setImageLoaded(true);

      if (
        !originalImageSize ||
        originalImageSize.width !== size.width ||
        originalImageSize.height !== size.height
      ) {
        setOriginalImageSize(size);
      }
    };
    img.src = src;
  }, [src, originalImageSize, setOriginalImageSize]);

  const { width, height } = useMemo(() => {
    if (!image || !imageLoaded) return { width: 400, height: 300 };

    if (isFullscreen) {
      const vw = Math.max(window.innerWidth - 64, 400);
      const vh = Math.max(window.innerHeight - 120, 300);
      const r = image.naturalHeight / image.naturalWidth;

      let w = vw;
      let h = vw * r;
      if (h > vh) {
        h = vh;
        w = vh / r;
      }
      return { width: Math.round(w), height: Math.round(h) };
    }

    if (!containerRef.current) return { width: 400, height: 300 };

    const cw = containerRef.current.clientWidth - 16;
    const r = image.naturalHeight / image.naturalWidth;

    let w = cw;
    let h = cw * r;
    if (h > 400) {
      h = 400;
      w = 400 / r;
    }
    return { width: Math.round(w), height: Math.round(h) };
  }, [image, imageLoaded, isFullscreen]);

  useEffect(() => {
    if (readOnly) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isMod = isMac ? e.metaKey : e.ctrlKey;
      if (!isMod) return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        setUndoStack((prev) => {
          if (!prev.length) return prev;
          const prevSnapshot = prev[prev.length - 1];
          setRedoStack((rs) => [...rs, lines.map((l) => [...l])]);
          setLines(prevSnapshot.map((l) => [...l]));
          return prev.slice(0, -1);
        });
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        setRedoStack((prev) => {
          if (!prev.length) return prev;
          const nextSnapshot = prev[prev.length - 1];
          setUndoStack((us) => [...us, lines.map((l) => [...l])]);
          setLines(nextSnapshot.map((l) => [...l]));
          return prev.slice(0, -1);
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [readOnly, lines, setLines]);

  const cloneLines = useCallback(
    (srcLines: Point[] = lines): Snapshot => srcLines.map((l) => [...l]),
    [lines],
  );

  const pushUndo = useCallback(
    (snapshot?: Snapshot) =>
      setUndoStack((prev) => [...prev, snapshot ?? cloneLines()]),
    [cloneLines],
  );

  const clearRedo = useCallback(() => setRedoStack([]), []);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const prevSnapshot = prev[prev.length - 1];
      setRedoStack((rs) => [...rs, cloneLines()]);
      setLines(prevSnapshot.map((l) => [...l]));
      return prev.slice(0, -1);
    });
  }, [cloneLines, setLines]);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const nextSnapshot = prev[prev.length - 1];
      setUndoStack((us) => [...us, cloneLines()]);
      setLines(nextSnapshot.map((l) => [...l]));
      return prev.slice(0, -1);
    });
  }, [cloneLines, setLines]);

  const onMouseDown = useCallback(
    (e: any) => {
      if (readOnly || !baseSize) return;
      setIsDrawing(true);
      pushUndo();
      clearRedo();

      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      const newLine = normalizeCoordinates(
        [[pos.x, pos.y]],
        width,
        height,
        baseSize,
      )[0];

      setLines([...lines, newLine]);
    },
    [
      readOnly,
      baseSize,
      pushUndo,
      clearRedo,
      normalizeCoordinates,
      width,
      height,
      setLines,
      lines,
    ],
  );

  const onMouseMove = useCallback(
    (e: any) => {
      if (!isDrawing || !baseSize) return;

      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      const newLines = [...lines];
      const lastIdx = newLines.length - 1;
      if (lastIdx >= 0) {
        const p = normalizeCoordinates(
          [[pos.x, pos.y]],
          width,
          height,
          baseSize,
        )[0];
        newLines[lastIdx] = [...newLines[lastIdx], ...p];
        setLines(newLines);
      }
    },
    [isDrawing, baseSize, normalizeCoordinates, width, height, lines, setLines],
  );

  const onMouseUp = useCallback(() => setIsDrawing(false), []);
  const onMouseLeave = useCallback(() => setIsDrawing(false), []);

  const denormLine = useCallback(
    (pts: Point) => {
      if (!baseSize) return pts;
      return denormalizeCoordinates([pts], width, height, baseSize)[0];
    },
    [denormalizeCoordinates, width, height, baseSize],
  );

  const clearAll = useCallback(() => {
    if (lines.length) pushUndo();
    setLines([]);
    clearRedo();
  }, [lines.length, pushUndo, setLines, clearRedo]);

  return {
    containerRef,
    imageLoaded,
    image,
    width,
    height,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    denormLine,
    clearAll,
  };
}
