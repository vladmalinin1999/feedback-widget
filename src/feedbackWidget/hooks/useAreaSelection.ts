import { useCallback, useState } from 'react';
import type { SelectionArea } from '../types';

export const useAreaSelection = () => {
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [selectionArea, setSelectionArea] = useState<SelectionArea>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [overlayVisible, setOverlayVisible] = useState(false);

  const startAreaSelection = useCallback(() => {
    setIsSelectingArea(true);
    setSelectionArea(null);
    setOverlayVisible(true);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelectingArea) return;

      setIsDragging(true);
      const x = e.clientX;
      const y = e.clientY;

      setDragStart({ x, y });
      setSelectionArea({ x, y, width: 0, height: 0 });
    },
    [isSelectingArea],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelectingArea || !isDragging || !selectionArea) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const newArea = {
        x: Math.min(dragStart.x, currentX),
        y: Math.min(dragStart.y, currentY),
        width: Math.abs(currentX - dragStart.x),
        height: Math.abs(currentY - dragStart.y),
      };

      setSelectionArea(newArea);
    },
    [isSelectingArea, isDragging, selectionArea, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    if (isSelectingArea && isDragging) {
      setIsDragging(false);
    }
  }, [isSelectingArea, isDragging]);

  const resetAreaSelection = useCallback(() => {
    setIsSelectingArea(false);
    setSelectionArea(null);
    setOverlayVisible(false);
    setIsDragging(false);
  }, []);

  return {
    isSelectingArea,
    selectionArea,
    overlayVisible,
    startAreaSelection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetAreaSelection,
  };
};
