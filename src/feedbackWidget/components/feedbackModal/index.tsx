import type { FeedbackModalProps } from "../../types";

export function FeedbackModal({
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
  labels = {},
}: FeedbackModalProps) {
  if (!open) return null;

  const isDisabled = !desc.trim();

  return (
    <div
      data-skip-capture="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">
            {labels.title || "Feedback"}
          </h2>
          <button className="text-gray-500 hover:text-black" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className="mt-4 block text-sm font-medium">
          {labels.description || "Description"}
        </label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="mt-2 w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-black min-h-28"
          placeholder={labels.description || "Describe your feedback..."}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={onStartAreaSelection}
            disabled={isCapturing}
            className="rounded-lg border px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {labels.takeScreenshot || "Take Screenshot"}
          </button>
          {screenshots.length > 0 && !isCapturing && (
            <span className="text-sm text-gray-500">
              {labels.clickOnScreenshots ||
                "Click on screenshots to annotate them"}
            </span>
          )}
        </div>

        {isCapturing && (
          <div className="mt-4 rounded-lg border border-[#4f46e5] bg-[#4f46e5]/10 p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4f46e5]"></div>
              <span className="text-sm text-[#4f46e5]">
                {labels.processingScreenshot || "Processing screenshot..."}
              </span>
            </div>
          </div>
        )}

        {screenshots.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {screenshots.map((shot) => (
              <div
                key={shot.id}
                className="relative group border rounded-lg overflow-hidden"
              >
                <div className="relative w-full h-24">
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox={`0 0 ${shot.size.width} ${shot.size.height}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <image
                      href={shot.src}
                      x="0"
                      y="0"
                      width={shot.size.width}
                      height={shot.size.height}
                      preserveAspectRatio="xMidYMid meet"
                    />
                    {shot.lines?.map((line, i) => {
                      const pts: string[] = [];
                      for (let j = 0; j < line.length; j += 2) {
                        const x = line[j] * 1;
                        const y = line[j + 1] * 1;
                        pts.push(`${x},${y}`);
                      }
                      return (
                        <polyline
                          key={i}
                          points={pts.join(" ")}
                          stroke="#f43f5e"
                          strokeWidth={Math.max(
                            1,
                            Math.min(shot.size.width, shot.size.height) * 0.01
                          )}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="absolute inset-0 flex items-start justify-end gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onOpenFullscreen(shot.id)}
                    className="rounded bg-white/90 px-2 py-1 text-xs hover:bg-white"
                    title={labels.fullscreen || "Open in fullscreen"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline-block"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>

                  <button
                    onClick={() => onDeleteScreenshot(shot.id)}
                    className="rounded bg-white/90 px-2 py-1 text-xs hover:bg-white"
                    title={labels.deleteScreenshot || "Delete"}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            disabled={isDisabled || isCapturing}
            onClick={onSubmit}
            className="rounded-lg bg-[#4f46e5] px-4 py-2 text-white hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {labels.submit || "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
