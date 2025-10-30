"use client";

import { Image as KImage, Layer, Line, Stage } from "react-konva";
import { useAnnotator } from "../../hooks/useAnnotator";
import { AnnotatorProps } from "../../types";

type Point = number[];

export function Annotator(props: AnnotatorProps) {
  const {
    loader,
    src,
    lines,
    setLines,
    stageRef,
    isFullscreen = false,
    originalImageSize,
    setOriginalImageSize,
    normalizeCoordinates,
    denormalizeCoordinates,
    readOnly = false,
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
    denormLine,
  } = useAnnotator({
    readOnly,
    src,
    lines,
    setLines,
    stageRef,
    isFullscreen,
    originalImageSize,
    setOriginalImageSize,
    normalizeCoordinates,
    denormalizeCoordinates,
  });

  return (
    <div className={`${isFullscreen ? "mt-12" : "mt-4"} rounded-lg`}>
      <div
        ref={containerRef}
        className={`flex justify-center overflow-hidden ${
          isFullscreen ? "w-full h-full" : "rounded-lg"
        }`}
        style={{
          minHeight: isFullscreen ? "100%" : "300px",
          maxHeight: isFullscreen ? "100%" : "400px",
        }}
      >
        {imageLoaded && image ? (
          <Stage
            width={width}
            height={height}
            ref={stageRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
          >
            <Layer>
              <KImage image={image} width={width} height={height} />
              {lines.map((pts: Point, i: number) => (
                <Line
                  key={i}
                  points={denormLine(pts)}
                  stroke="#f43f5e"
                  strokeWidth={isFullscreen ? 3 : 1}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.4}
                />
              ))}
            </Layer>
          </Stage>
        ) : (
          loader
        )}
      </div>
    </div>
  );
}
