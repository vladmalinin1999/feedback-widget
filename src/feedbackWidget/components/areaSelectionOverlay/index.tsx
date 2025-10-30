import { AreaSelectionOverlayProps } from "../../types";

export function AreaSelectionOverlay({
  overlayVisible,
  selectionArea,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  label,
}: AreaSelectionOverlayProps) {
  if (!overlayVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black bg-opacity-20"
      data-skip-capture="true"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-4 py-2 shadow-lg">
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      {selectionArea && selectionArea.width > 0 && selectionArea.height > 0 && (
        <div
          className="absolute border-2 border-[#4f46e5] bg-[#dce7ff] bg-opacity-30 pointer-events-none"
          style={{
            left: selectionArea.x,
            top: selectionArea.y,
            width: selectionArea.width,
            height: selectionArea.height,
          }}
        />
      )}
    </div>
  );
}
