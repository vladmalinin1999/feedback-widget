import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Stage, Layer, Image as Image$1, Line } from 'react-konva';
import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as htmlToImage from 'html-to-image';

// src/feedbackWidget/index.tsx
function useAnnotator({
  readOnly = false,
  src,
  lines,
  setLines,
  isFullscreen = false,
  originalImageSize,
  setOriginalImageSize,
  normalizeCoordinates: normalizeCoordinates2,
  denormalizeCoordinates: denormalizeCoordinates2
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [image, setImage] = useState(null);
  const [baseSize, setBaseSize] = useState(null);
  const containerRef = useRef(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      const size = { width: img.naturalWidth, height: img.naturalHeight };
      setBaseSize(size);
      setImageLoaded(true);
      if (!originalImageSize || originalImageSize.width !== size.width || originalImageSize.height !== size.height) {
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
      const r2 = image.naturalHeight / image.naturalWidth;
      let w2 = vw;
      let h2 = vw * r2;
      if (h2 > vh) {
        h2 = vh;
        w2 = vh / r2;
      }
      return { width: Math.round(w2), height: Math.round(h2) };
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
    const onKeyDown = (e) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isMod = isMac ? e.metaKey : e.ctrlKey;
      if (!isMod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        setUndoStack((prev) => {
          if (!prev.length) return prev;
          const prevSnapshot = prev[prev.length - 1];
          setRedoStack((rs) => [...rs, lines.map((l) => [...l])]);
          setLines(prevSnapshot.map((l) => [...l]));
          return prev.slice(0, -1);
        });
      } else if (key === "z" && e.shiftKey || key === "y") {
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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [readOnly, lines, setLines]);
  const cloneLines = useCallback(
    (srcLines = lines) => srcLines.map((l) => [...l]),
    [lines]
  );
  const pushUndo = useCallback(
    (snapshot) => setUndoStack((prev) => [...prev, snapshot ?? cloneLines()]),
    [cloneLines]
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
    (e) => {
      if (readOnly || !baseSize) return;
      setIsDrawing(true);
      pushUndo();
      clearRedo();
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const newLine = normalizeCoordinates2(
        [[pos.x, pos.y]],
        width,
        height,
        baseSize
      )[0];
      setLines([...lines, newLine]);
    },
    [
      readOnly,
      baseSize,
      pushUndo,
      clearRedo,
      normalizeCoordinates2,
      width,
      height,
      setLines,
      lines
    ]
  );
  const onMouseMove = useCallback(
    (e) => {
      if (!isDrawing || !baseSize) return;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const newLines = [...lines];
      const lastIdx = newLines.length - 1;
      if (lastIdx >= 0) {
        const p = normalizeCoordinates2(
          [[pos.x, pos.y]],
          width,
          height,
          baseSize
        )[0];
        newLines[lastIdx] = [...newLines[lastIdx], ...p];
        setLines(newLines);
      }
    },
    [isDrawing, baseSize, normalizeCoordinates2, width, height, lines, setLines]
  );
  const onMouseUp = useCallback(() => setIsDrawing(false), []);
  const onMouseLeave = useCallback(() => setIsDrawing(false), []);
  const denormLine = useCallback(
    (pts) => {
      if (!baseSize) return pts;
      return denormalizeCoordinates2([pts], width, height, baseSize)[0];
    },
    [denormalizeCoordinates2, width, height, baseSize]
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
    clearAll
  };
}
function Annotator(props) {
  const {
    loader,
    src,
    lines,
    setLines,
    stageRef,
    isFullscreen = false,
    originalImageSize,
    setOriginalImageSize,
    normalizeCoordinates: normalizeCoordinates2,
    denormalizeCoordinates: denormalizeCoordinates2,
    readOnly = false
  } = props;
  const {
    containerRef,
    imageLoaded,
    image,
    width,
    height,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    denormLine
  } = useAnnotator({
    readOnly,
    src,
    lines,
    setLines,
    isFullscreen,
    originalImageSize,
    setOriginalImageSize,
    normalizeCoordinates: normalizeCoordinates2,
    denormalizeCoordinates: denormalizeCoordinates2
  });
  return /* @__PURE__ */ jsx("div", { className: `${isFullscreen ? "mt-12" : "mt-4"} rounded-lg`, children: /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      className: `flex justify-center overflow-hidden ${isFullscreen ? "w-full h-full" : "rounded-lg"}`,
      style: {
        minHeight: isFullscreen ? "100%" : "300px",
        maxHeight: isFullscreen ? "100%" : "400px"
      },
      children: imageLoaded && image ? /* @__PURE__ */ jsx(
        Stage,
        {
          width,
          height,
          ref: stageRef,
          onMouseDown,
          onMouseMove,
          onMouseUp,
          onMouseLeave,
          children: /* @__PURE__ */ jsxs(Layer, { children: [
            /* @__PURE__ */ jsx(Image$1, { image, width, height }),
            lines.map((pts, i) => /* @__PURE__ */ jsx(
              Line,
              {
                points: denormLine(pts),
                stroke: "#f43f5e",
                strokeWidth: isFullscreen ? 3 : 1,
                lineCap: "round",
                lineJoin: "round",
                tension: 0.4
              },
              i
            ))
          ] })
        }
      ) : loader
    }
  ) });
}
function AreaSelectionOverlay({
  overlayVisible,
  selectionArea,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  label
}) {
  if (!overlayVisible) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "fixed inset-0 z-[9999] bg-black bg-opacity-20",
      "data-skip-capture": "true",
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp,
      children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-4 py-2 shadow-lg", children: /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700", children: label }) }),
        selectionArea && selectionArea.width > 0 && selectionArea.height > 0 && /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute border-2 border-[#4f46e5] bg-[#dce7ff] bg-opacity-30 pointer-events-none",
            style: {
              left: selectionArea.x,
              top: selectionArea.y,
              width: selectionArea.width,
              height: selectionArea.height
            }
          }
        )
      ]
    }
  );
}
function FeedbackModal({
  open,
  desc,
  setDesc,
  screenshots,
  isCapturing = false,
  onClose,
  onStartAreaSelection,
  onDeleteScreenshot,
  onOpenFullscreen,
  onSubmit,
  labels = {}
}) {
  if (!open) return null;
  const isDisabled = !desc.trim();
  return /* @__PURE__ */ jsxs(
    "div",
    {
      "data-skip-capture": "true",
      className: "fixed inset-0 z-[1000] flex items-center justify-center",
      children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/50", onClick: onClose }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold", children: labels.title || "Feedback" }),
            /* @__PURE__ */ jsx("button", { className: "text-gray-500 hover:text-black", onClick: onClose, children: "\u2715" })
          ] }),
          /* @__PURE__ */ jsx("label", { className: "mt-4 block text-sm font-medium", children: labels.description || "Description" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: desc,
              onChange: (e) => setDesc(e.target.value),
              className: "mt-2 w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-black min-h-28",
              placeholder: labels.description || "Describe your feedback..."
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: onStartAreaSelection,
                disabled: isCapturing,
                className: "rounded-lg border px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                children: labels.takeScreenshot || "Take Screenshot"
              }
            ),
            screenshots.length > 0 && !isCapturing && /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: labels.clickOnScreenshots || "Click on screenshots to annotate them" })
          ] }),
          isCapturing && /* @__PURE__ */ jsx("div", { className: "mt-4 rounded-lg border border-[#4f46e5] bg-[#4f46e5]/10 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-[#4f46e5]" }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-[#4f46e5]", children: labels.processingScreenshot || "Processing screenshot..." })
          ] }) }),
          screenshots.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-4 grid grid-cols-3 gap-3", children: screenshots.map((shot) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "relative group border rounded-lg overflow-hidden",
              children: [
                /* @__PURE__ */ jsx("div", { className: "relative w-full h-24", children: /* @__PURE__ */ jsxs(
                  "svg",
                  {
                    className: "absolute inset-0 w-full h-full",
                    viewBox: `0 0 ${shot.size.width} ${shot.size.height}`,
                    preserveAspectRatio: "xMidYMid meet",
                    children: [
                      /* @__PURE__ */ jsx(
                        "image",
                        {
                          href: shot.src,
                          x: "0",
                          y: "0",
                          width: shot.size.width,
                          height: shot.size.height,
                          preserveAspectRatio: "xMidYMid meet"
                        }
                      ),
                      shot.lines?.map((line, i) => {
                        const pts = [];
                        for (let j = 0; j < line.length; j += 2) {
                          const x = line[j] * 1;
                          const y = line[j + 1] * 1;
                          pts.push(`${x},${y}`);
                        }
                        return /* @__PURE__ */ jsx(
                          "polyline",
                          {
                            points: pts.join(" "),
                            stroke: "#f43f5e",
                            strokeWidth: Math.max(
                              1,
                              Math.min(shot.size.width, shot.size.height) * 0.01
                            ),
                            fill: "none",
                            strokeLinecap: "round",
                            strokeLinejoin: "round"
                          },
                          i
                        );
                      })
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex items-start justify-end gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => onOpenFullscreen(shot.id),
                      className: "rounded bg-white/90 px-2 py-1 text-xs hover:bg-white",
                      title: labels.fullscreen || "Open in fullscreen",
                      children: /* @__PURE__ */ jsxs(
                        "svg",
                        {
                          xmlns: "http://www.w3.org/2000/svg",
                          width: "14",
                          height: "14",
                          viewBox: "0 0 24 24",
                          fill: "none",
                          stroke: "currentColor",
                          strokeWidth: "2",
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          className: "inline-block",
                          children: [
                            /* @__PURE__ */ jsx("path", { d: "M12 20h9" }),
                            /* @__PURE__ */ jsx("path", { d: "M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" })
                          ]
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => onDeleteScreenshot(shot.id),
                      className: "rounded bg-white/90 px-2 py-1 text-xs hover:bg-white",
                      title: labels.deleteScreenshot || "Delete",
                      children: "\u2715"
                    }
                  )
                ] })
              ]
            },
            shot.id
          )) }),
          /* @__PURE__ */ jsx("div", { className: "mt-6 flex justify-end", children: /* @__PURE__ */ jsx(
            "button",
            {
              disabled: isDisabled || isCapturing,
              onClick: onSubmit,
              className: "rounded-lg bg-[#4f46e5] px-4 py-2 text-white hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed",
              children: labels.submit || "Submit"
            }
          ) })
        ] })
      ]
    }
  );
}
function FullscreenMode({
  isFullscreen,
  src,
  onClose,
  onClearLines,
  children,
  labels = {}
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }
  }, [isFullscreen, onClose]);
  if (!isFullscreen || !src) return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[9999] bg-black/80 flex gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute top-4 left-[30px] flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClose,
          className: "rounded-lg bg-white px-3 py-2 text-black hover:bg-gray-100",
          children: labels.close || "Close"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onClearLines,
          className: "rounded-lg bg-white px-3 py-2 text-black hover:bg-gray-100",
          children: labels.clear || "Clear"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-[30px] text-white text-sm", children: labels.pressEscToClose || "Press ESC to close" }),
    /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center p-4", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full", children }) })
  ] });
}
var useAreaSelection = () => {
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [selectionArea, setSelectionArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [overlayVisible, setOverlayVisible] = useState(false);
  const startAreaSelection = useCallback(() => {
    setIsSelectingArea(true);
    setSelectionArea(null);
    setOverlayVisible(true);
  }, []);
  const handleMouseDown = useCallback(
    (e) => {
      if (!isSelectingArea) return;
      setIsDragging(true);
      const x = e.clientX;
      const y = e.clientY;
      setDragStart({ x, y });
      setSelectionArea({ x, y, width: 0, height: 0 });
    },
    [isSelectingArea]
  );
  const handleMouseMove = useCallback(
    (e) => {
      if (!isSelectingArea || !isDragging || !selectionArea) return;
      const currentX = e.clientX;
      const currentY = e.clientY;
      const newArea = {
        x: Math.min(dragStart.x, currentX),
        y: Math.min(dragStart.y, currentY),
        width: Math.abs(currentX - dragStart.x),
        height: Math.abs(currentY - dragStart.y)
      };
      setSelectionArea(newArea);
    },
    [isSelectingArea, isDragging, selectionArea, dragStart]
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
    resetAreaSelection
  };
};
var useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isFullscreen]);
  return {
    isFullscreen,
    toggleFullscreen
  };
};

// src/feedbackWidget/utils/index.ts
var normalizeCoordinates = (points, currentWidth, currentHeight, originalImageSize) => {
  if (!originalImageSize) return points;
  const scaleX = originalImageSize.width / currentWidth;
  const scaleY = originalImageSize.height / currentHeight;
  return points.map(
    (line) => line.map(
      (coord, index) => index % 2 === 0 ? coord * scaleX : coord * scaleY
    )
  );
};
var denormalizeCoordinates = (points, currentWidth, currentHeight, originalImageSize) => {
  if (!originalImageSize) return points;
  const scaleX = currentWidth / originalImageSize.width;
  const scaleY = currentHeight / originalImageSize.height;
  return points.map(
    (line) => line.map(
      (coord, index) => index % 2 === 0 ? coord * scaleX : coord * scaleY
    )
  );
};
var loadImage = (src) => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  }).then(
    () => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    })
  );
};
async function rasterizeShot(opts) {
  const { src, lines = [], size, stroke = "#f43f5e" } = opts;
  const { width, height } = size;
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, width, height);
  ctx.strokeStyle = stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = opts.lineWidth ?? Math.max(2, Math.round(Math.min(width, height) * 6e-3));
  for (const line of lines) {
    if (!line || line.length < 4) continue;
    ctx.beginPath();
    ctx.moveTo(line[0], line[1]);
    for (let i = 2; i < line.length; i += 2) {
      ctx.lineTo(line[i], line[i + 1]);
    }
    ctx.stroke();
  }
  return canvas.toDataURL("image/png");
}

// src/feedbackWidget/hooks/useScreenshot.ts
var useScreenshot = () => {
  const [fullShot, setFullShot] = useState(null);
  const [croppedShot, setCroppedShot] = useState(null);
  const [originalImageSize, setOriginalImageSize] = useState(null);
  const takeScreenshot = useCallback(async (selectionArea) => {
    if (!selectionArea) return;
    const overlayElement = document.querySelector(
      ".fixed.inset-0.z-\\[9999\\]"
    );
    const originalDisplay = overlayElement ? overlayElement.style.display : "";
    const originalVisibility = overlayElement ? overlayElement.style.visibility : "";
    if (overlayElement) {
      overlayElement.style.display = "none";
      overlayElement.style.visibility = "hidden";
    }
    const node = document.documentElement;
    const fullDataUrl = await htmlToImage.toPng(node, {
      pixelRatio: 2,
      quality: 1,
      cacheBust: true,
      skipAutoScale: true,
      filter: (el) => {
        const shouldSkip = el.dataset?.skipCapture === "true" || el.closest?.("[data-skip-capture='true']");
        return !shouldSkip;
      }
    });
    const img = await loadImage(fullDataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = selectionArea.width * 2;
    canvas.height = selectionArea.height * 2;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      img,
      selectionArea.x * 2,
      selectionArea.y * 2,
      selectionArea.width * 2,
      selectionArea.height * 2,
      0,
      0,
      selectionArea.width * 2,
      selectionArea.height * 2
    );
    const croppedDataUrl = canvas.toDataURL("image/png");
    setCroppedShot(croppedDataUrl);
    setOriginalImageSize({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    if (overlayElement) {
      overlayElement.style.display = originalDisplay;
      overlayElement.style.visibility = originalVisibility;
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
    resetScreenshots
  };
};
var FeedbackWidget = ({
  onSubmit,
  labels = {},
  userEmail,
  showUserEmail = false,
  buttonPosition = "bottom-right",
  buttonStyle,
  className
}) => {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [lines, setLines] = useState([]);
  const [shots, setShots] = useState([]);
  const [activeShotId, setActiveShotId] = useState(null);
  const stageRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const {
    selectionArea,
    overlayVisible,
    startAreaSelection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetAreaSelection
  } = useAreaSelection();
  const {
    originalImageSize,
    setOriginalImageSize,
    takeScreenshot,
    resetScreenshots
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
      const id = `${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
      setShots((prev) => [
        ...prev,
        {
          id,
          src: dataUrl,
          lines: [],
          size: { width: img.naturalWidth, height: img.naturalHeight }
        }
      ]);
      setActiveShotId(id);
      setLines([]);
    }
    resetAreaSelection();
    setIsCapturing(false);
  }, [selectionArea, takeScreenshot, resetAreaSelection, isCapturing]);
  const submit = useCallback(async () => {
    const syncedShots = shots.map(
      (s) => s.id === activeShotId ? { ...s, lines: [...lines] } : s
    );
    const annotatedPngs = await Promise.all(
      syncedShots.map(
        (s) => rasterizeShot({
          src: s.src,
          size: s.size,
          lines: s.lines
        })
      )
    );
    const result = await onSubmit({
      email: userEmail,
      description: desc.trim(),
      screenshots: annotatedPngs
    });
    if (result.success) {
      setDesc("");
      resetShot();
      setOpen(false);
    }
  }, [desc, shots, activeShotId, lines, onSubmit, resetShot, userEmail]);
  const handleAreaSelectionComplete = useCallback(() => {
    if (selectionArea && selectionArea.width > 10 && selectionArea.height > 10) {
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
    (id) => {
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
    (id) => {
      if (activeShotId && lines.length > 0) {
        setShots(
          (prev) => prev.map(
            (shot2) => shot2.id === activeShotId ? { ...shot2, lines: [...lines] } : shot2
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
      setShots(
        (prev) => prev.map(
          (shot) => shot.id === activeShotId ? { ...shot, lines: [...lines] } : shot
        )
      );
    }
    toggleFullscreen();
  }, [activeShotId, lines, toggleFullscreen]);
  const getButtonPosition = () => {
    const baseClasses = "fixed z-[1000] rounded-full bg-[#4f46e5] transition-colors text-white px-4 py-3 shadow-xl hover:bg-[#4f46e5]";
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
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        "data-skip-capture": "true",
        onClick: () => setOpen(true),
        className: `${getButtonPosition()} ${className || ""}`,
        style: buttonStyle,
        children: labels.title || "Feedback"
      }
    ),
    /* @__PURE__ */ jsx(
      AreaSelectionOverlay,
      {
        overlayVisible,
        selectionArea,
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: () => {
          handleMouseUp();
          handleAreaSelectionComplete();
        },
        label: labels.takeScreenshot || "Select area to capture"
      }
    ),
    /* @__PURE__ */ jsx(
      FeedbackModal,
      {
        open,
        desc,
        setDesc,
        screenshots: shots,
        isFullscreen,
        isCapturing,
        onClose: () => {
          if (activeShotId && lines.length > 0) {
            setShots(
              (prev) => prev.map(
                (shot) => shot.id === activeShotId ? { ...shot, lines: [...lines] } : shot
              )
            );
          }
          setOpen(false);
        },
        onStartAreaSelection: handleStartAreaSelection,
        onDeleteScreenshot: handleDeleteShot,
        onOpenFullscreen: handleOpenFullscreen,
        onSubmit: submit,
        labels
      }
    ),
    /* @__PURE__ */ jsx(
      FullscreenMode,
      {
        isFullscreen,
        src: activeSrc,
        onClose: handleCloseFullscreen,
        onClearLines: () => setLines([]),
        labels,
        children: /* @__PURE__ */ jsx(
          Annotator,
          {
            src: activeSrc,
            lines,
            setLines,
            stageRef,
            isFullscreen: true,
            originalImageSize,
            setOriginalImageSize,
            normalizeCoordinates: (points, width, height) => normalizeCoordinates(points, width, height, originalImageSize),
            denormalizeCoordinates: (points, width, height) => denormalizeCoordinates(points, width, height, originalImageSize)
          }
        )
      }
    )
  ] });
};

export { FeedbackWidget };
