import { useEffect } from "react";
import { FullscreenModeProps } from "../../types";

export function FullscreenMode({
  isFullscreen,
  src,
  onClose,
  onClearLines,
  children,
  labels = {},
}: FullscreenModeProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex gap-4">
      <div className="absolute top-4 left-[30px] flex gap-2">
        <button
          onClick={onClose}
          className="rounded-lg bg-white px-3 py-2 text-black hover:bg-gray-100"
        >
          {labels.close || "Close"}
        </button>
        <button
          onClick={onClearLines}
          className="rounded-lg bg-white px-3 py-2 text-black hover:bg-gray-100"
        >
          {labels.clear || "Clear"}
        </button>
      </div>
      <div className="absolute top-4 right-[30px] text-white text-sm">
        {labels.pressEscToClose || "Press ESC to close"}
      </div>
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="w-full h-full">{children}</div>
      </div>
    </div>
  );
}
