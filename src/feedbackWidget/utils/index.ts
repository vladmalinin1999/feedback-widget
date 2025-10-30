import type { OriginalImageSize, Point } from '../types';

export const normalizeCoordinates = (
  points: Point[],
  currentWidth: number,
  currentHeight: number,
  originalImageSize: OriginalImageSize,
): Point[] => {
  if (!originalImageSize) return points;

  const scaleX = originalImageSize.width / currentWidth;
  const scaleY = originalImageSize.height / currentHeight;

  return points.map((line) =>
    line.map((coord, index) =>
      index % 2 === 0 ? coord * scaleX : coord * scaleY,
    ),
  );
};

export const denormalizeCoordinates = (
  points: Point[],
  currentWidth: number,
  currentHeight: number,
  originalImageSize: OriginalImageSize,
): Point[] => {
  if (!originalImageSize) return points;

  const scaleX = currentWidth / originalImageSize.width;
  const scaleY = currentHeight / originalImageSize.height;

  return points.map((line) =>
    line.map((coord, index) =>
      index % 2 === 0 ? coord * scaleX : coord * scaleY,
    ),
  );
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  }).then(
    () =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      }),
  );
};

export async function rasterizeShot(opts: {
  src: string;
  lines?: Point[];
  size: { width: number; height: number };
  stroke?: string;
  lineWidth?: number;
}): Promise<string> {
  const { src, lines = [], size, stroke = '#f43f5e' } = opts;
  const { width, height } = size;

  const img = await loadImage(src);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, 0, 0, width, height);

  ctx.strokeStyle = stroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth =
    opts.lineWidth ?? Math.max(2, Math.round(Math.min(width, height) * 0.006));

  for (const line of lines) {
    if (!line || line.length < 4) continue;
    ctx.beginPath();
    ctx.moveTo(line[0], line[1]);
    for (let i = 2; i < line.length; i += 2) {
      ctx.lineTo(line[i], line[i + 1]);
    }
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
}
