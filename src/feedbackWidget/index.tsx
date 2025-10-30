"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Annotator,
  AreaSelectionOverlay,
  FeedbackModal,
  FullscreenMode,
} from "./components";
import { useAreaSelection, useFullscreen, useScreenshot } from "./hooks";
import type { Point } from "./types";
import {
  denormalizeCoordinates,
  loadImage,
  normalizeCoordinates,
  rasterizeShot,
} from "./utils";

type Shot = {
  id: string;
  src: string;
  lines?: Point[];
  size: { width: number; height: number };
};

export interface FeedbackWidgetProps {
  onSubmit: (data: {
    email?: string;
    description: string;
    screenshots: string[];
  }) => Promise<{ success: boolean; error?: string }>;
  labels?: {
    title?: string;
    description?: string;
    submit?: string;
    cancel?: string;
    takeScreenshot?: string;
    deleteScreenshot?: string;
    fullscreen?: string;
    close?: string;
    clear?: string;
    yourFeedbackHasBeenSent?: string;
    cannotSendFeedback?: string;
  };
  userEmail?: string;
  showUserEmail?: boolean;
  buttonPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  buttonStyle?: React.CSSProperties;
  className?: string;
}

export const FeedbackWidget = ({
  onSubmit,
  labels = {},
  userEmail,
  showUserEmail = false,
  buttonPosition = "bottom-right",
  buttonStyle,
  className,
}: FeedbackWidgetProps) => {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [lines, setLines] = useState<Point[]>([]);

  const [shots, setShots] = useState<Shot[]>([]);
  const [activeShotId, setActiveShotId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const {
    selectionArea,
    overlayVisible,
    startAreaSelection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetAreaSelection,
  } = useAreaSelection();

  const {
    originalImageSize,
    setOriginalImageSize,
    takeScreenshot,
    resetScreenshots,
  } = useScreenshot();

  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const resetShot = useCallback(() => {
    resetScreenshots();
    setShots([]);
    setActiveShotId(null);
    setLines([]);
    resetAreaSelection();
  }, [resetScreenshots, resetAreaSelection]);

  const confirmAreaSelection = useCallback(async () => {
    if (!selectionArea || isCapturing) return;

    setOpen(true);
    setIsCapturing(true);

    const dataUrl = await takeScreenshot(selectionArea);
    if (dataUrl) {
      const img = await loadImage(dataUrl);
      const id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setShots((prev) => [
        ...prev,
        {
          id,
          src: dataUrl,
          lines: [],
          size: { width: img.naturalWidth, height: img.naturalHeight },
        },
      ]);
      setActiveShotId(id);
      setLines([]);
    }
    resetAreaSelection();
    setIsCapturing(false);
  }, [selectionArea, takeScreenshot, resetAreaSelection, isCapturing]);

  const submit = useCallback(async () => {
    const syncedShots = shots.map((s) =>
      s.id === activeShotId ? { ...s, lines: [...lines] } : s
    );

    const annotatedPngs = await Promise.all(
      syncedShots.map((s) =>
        rasterizeShot({
          src: s.src,
          size: s.size,
          lines: s.lines,
        })
      )
    );

    const result = await onSubmit({
      email: userEmail,
      description: desc.trim(),
      screenshots: annotatedPngs,
    });

    if (result.success) {
      setDesc("");
      resetShot();
      setOpen(false);
    }
  }, [desc, shots, activeShotId, lines, onSubmit, resetShot, userEmail]);

  const handleAreaSelectionComplete = useCallback(() => {
    if (
      selectionArea &&
      selectionArea.width > 10 &&
      selectionArea.height > 10
    ) {
      confirmAreaSelection();
    } else {
      resetAreaSelection();
      setOpen(true);
    }
  }, [selectionArea, confirmAreaSelection, resetAreaSelection]);

  const handleStartAreaSelection = useCallback(() => {
    setOpen(false);
    startAreaSelection();
  }, [startAreaSelection]);

  const handleDeleteShot = useCallback(
    (id: string) => {
      setShots((prev) => prev.filter((s) => s.id !== id));
      setLines([]);
      if (activeShotId === id) {
        setActiveShotId(() => {
          const remaining = shots.filter((s) => s.id !== id);
          return remaining.length ? remaining[0].id : null;
        });
      }
    },
    [activeShotId, shots]
  );

  const handleOpenFullscreen = useCallback(
    (id: string) => {
      if (activeShotId && lines.length > 0) {
        setShots((prev) =>
          prev.map((shot) =>
            shot.id === activeShotId ? { ...shot, lines: [...lines] } : shot
          )
        );
      }

      setActiveShotId(id);

      const shot = shots.find((s) => s.id === id);
      setLines(shot?.lines || []);
      if (!isFullscreen) toggleFullscreen();
    },
    [isFullscreen, toggleFullscreen, shots, activeShotId, lines]
  );

  const activeSrc = useMemo(
    () => shots.find((s) => s.id === activeShotId)?.src || null,
    [shots, activeShotId]
  );

  const handleCloseFullscreen = useCallback(() => {
    if (activeShotId && lines.length > 0) {
      setShots((prev) =>
        prev.map((shot) =>
          shot.id === activeShotId ? { ...shot, lines: [...lines] } : shot
        )
      );
    }
    toggleFullscreen();
  }, [activeShotId, lines, toggleFullscreen]);

  const getButtonPosition = () => {
    const baseClasses =
      "fixed z-[1000] rounded-full bg-[#4f46e5] transition-colors text-white px-4 py-3 shadow-xl hover:bg-[#4f46e5]";
    switch (buttonPosition) {
      case "bottom-left":
        return `${baseClasses} bottom-6 left-4`;
      case "top-right":
        return `${baseClasses} top-6 right-4`;
      case "top-left":
        return `${baseClasses} top-6 left-4`;
      default:
        return `${baseClasses} bottom-6 right-4`;
    }
  };

  return (
    <>
      <button
        data-skip-capture="true"
        onClick={() => setOpen(true)}
        className={`${getButtonPosition()} ${className || ""}`}
        style={buttonStyle}
      >
        {labels.title || "Feedback"}
      </button>

      <AreaSelectionOverlay
        overlayVisible={overlayVisible}
        selectionArea={selectionArea}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => {
          handleMouseUp();
          handleAreaSelectionComplete();
        }}
        label={labels.takeScreenshot || "Select area to capture"}
      />

      <FeedbackModal
        open={open}
        desc={desc}
        setDesc={setDesc}
        screenshots={shots}
        isFullscreen={isFullscreen}
        isCapturing={isCapturing}
        onClose={() => {
          if (activeShotId && lines.length > 0) {
            setShots((prev) =>
              prev.map((shot) =>
                shot.id === activeShotId ? { ...shot, lines: [...lines] } : shot
              )
            );
          }
          setOpen(false);
        }}
        onStartAreaSelection={handleStartAreaSelection}
        onDeleteScreenshot={handleDeleteShot}
        onOpenFullscreen={handleOpenFullscreen}
        onSubmit={submit}
        labels={labels}
      />

      <FullscreenMode
        isFullscreen={isFullscreen}
        src={activeSrc}
        onClose={handleCloseFullscreen}
        onClearLines={() => setLines([])}
        labels={labels}
      >
        <Annotator
          src={activeSrc!}
          lines={lines}
          setLines={setLines}
          stageRef={stageRef}
          isFullscreen={true}
          originalImageSize={originalImageSize}
          setOriginalImageSize={setOriginalImageSize}
          normalizeCoordinates={(points, width, height) =>
            normalizeCoordinates(points, width, height, originalImageSize)
          }
          denormalizeCoordinates={(points, width, height) =>
            denormalizeCoordinates(points, width, height, originalImageSize)
          }
        />
      </FullscreenMode>
    </>
  );
};
