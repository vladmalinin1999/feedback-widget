export type Point = number[];

export type SelectionArea = {
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export type OriginalImageSize = {
  width: number;
  height: number;
} | null;

export type FeedbackPayload = {
  description: string;
  screenshot: string | null;
  meta: {
    url: string;
    ua: string;
    viewport: { w: number; h: number };
  };
};

export type AnnotatorProps = {
  loader?: React.ReactNode;
  readOnly?: boolean;
  src: string;
  lines: Point[];
  setLines: (lines: Point[]) => void;
  stageRef: React.RefObject<any>;
  isFullscreen?: boolean;
  originalImageSize: OriginalImageSize;
  setOriginalImageSize: (size: OriginalImageSize) => void;
  normalizeCoordinates: (
    points: Point[],
    currentWidth: number,
    currentHeight: number
  ) => Point[];
  denormalizeCoordinates: (
    points: Point[],
    currentWidth: number,
    currentHeight: number
  ) => Point[];
};

export type AreaSelectionOverlayProps = {
  label: string;
  overlayVisible: boolean;
  selectionArea: SelectionArea;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
};

export type FeedbackModalProps = {
  open: boolean;
  desc: string;
  setDesc: (desc: string) => void;
  screenshots: {
    id: string;
    src: string;
    lines?: Point[];
    size: { width: number; height: number };
  }[];
  isFullscreen: boolean;
  isCapturing?: boolean;
  onClose: () => void;
  onStartAreaSelection: () => void;
  onDeleteScreenshot: (id: string) => void;
  onOpenFullscreen: (id: string) => void;
  onSubmit: () => void;
  children?: React.ReactNode;
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
    clickOnScreenshots?: string;
    processingScreenshot?: string;
  };
};

export type FullscreenModeProps = {
  isFullscreen: boolean;
  src: string | null;
  onClose: () => void;
  onClearLines: () => void;
  children: React.ReactNode;
  labels?: {
    close?: string;
    clear?: string;
    pressEscToClose?: string;
  };
};
