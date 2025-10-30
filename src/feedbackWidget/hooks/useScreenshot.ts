import * as htmlToImage from 'html-to-image';
import { useCallback, useState } from 'react';
import type { OriginalImageSize, SelectionArea } from '../types';
import { loadImage } from '../utils';

export const useScreenshot = () => {
  const [fullShot, setFullShot] = useState<string | null>(null);
  const [croppedShot, setCroppedShot] = useState<string | null>(null);
  const [originalImageSize, setOriginalImageSize] =
    useState<OriginalImageSize>(null);

  const takeScreenshot = useCallback(async (selectionArea: SelectionArea) => {
    if (!selectionArea) return;

    const overlayElement = document.querySelector(
      '.fixed.inset-0.z-\\[9999\\]',
    );
    const originalDisplay = overlayElement
      ? (overlayElement as HTMLElement).style.display
      : '';
    const originalVisibility = overlayElement
      ? (overlayElement as HTMLElement).style.visibility
      : '';

    if (overlayElement) {
      (overlayElement as HTMLElement).style.display = 'none';
      (overlayElement as HTMLElement).style.visibility = 'hidden';
    }

    const node = document.documentElement;

    const fullDataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 2,
      quality: 1,
      cacheBust: true,
      skipAutoScale: true,
      filter: (el) => {
        const shouldSkip =
          (el as HTMLElement).dataset?.skipCapture === 'true' ||
          el.closest?.("[data-skip-capture='true']");
        return !shouldSkip;
      },
    });

    const img = await loadImage(fullDataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = selectionArea.width * 2;
    canvas.height = selectionArea.height * 2;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(
      img,
      selectionArea.x * 2,
      selectionArea.y * 2,
      selectionArea.width * 2,
      selectionArea.height * 2,
      0,
      0,
      selectionArea.width * 2,
      selectionArea.height * 2,
    );

    const croppedDataUrl = canvas.toDataURL('image/png');
    setCroppedShot(croppedDataUrl);
    setOriginalImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });

    if (overlayElement) {
      (overlayElement as HTMLElement).style.display = originalDisplay;
      (overlayElement as HTMLElement).style.visibility = originalVisibility;
    }

    return croppedDataUrl;
  }, []);

  const resetScreenshots = useCallback(() => {
    setFullShot(null);
    setCroppedShot(null);
    setOriginalImageSize(null);
  }, []);

  return {
    fullShot,
    croppedShot,
    originalImageSize,
    setOriginalImageSize,
    takeScreenshot,
    resetScreenshots,
  };
};
