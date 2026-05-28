import type { Line, CellContent } from "../types"
import { TOL, lineContainsPoint } from "./primitives"
import { candidateIsValid } from "./validation"
import { connectedComponentCount } from "./connectivity"
import { mergeAlignedSegments } from "../mergeAlignedSegments"

export const alignParallelLinesAcrossConnectors = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let aligned = lines
  let changed = true

  while (changed) {
    changed = false
    const currentComponents = connectedComponentCount(aligned)

    for (let moveIndex = 0; moveIndex < aligned.length; moveIndex++) {
      const lineToMove = aligned[moveIndex]
      if (!lineToMove) continue

      const movingVertical =
        Math.abs(lineToMove.start.x - lineToMove.end.x) < TOL
      const movingHorizontal =
        Math.abs(lineToMove.start.y - lineToMove.end.y) < TOL
      if (!movingVertical && !movingHorizontal) continue

      for (let anchorIndex = 0; anchorIndex < aligned.length; anchorIndex++) {
        if (moveIndex === anchorIndex) continue
        const anchor = aligned[anchorIndex]
        if (!anchor) continue

        const anchorVertical = Math.abs(anchor.start.x - anchor.end.x) < TOL
        const anchorHorizontal = Math.abs(anchor.start.y - anchor.end.y) < TOL
        if (movingVertical !== anchorVertical) continue
        if (movingHorizontal !== anchorHorizontal) continue

        if (
          (movingVertical &&
            Math.abs(lineToMove.start.x - anchor.start.x) < TOL) ||
          (movingHorizontal &&
            Math.abs(lineToMove.start.y - anchor.start.y) < TOL)
        ) {
          continue
        }
        const hasConnector = aligned.some((connector, connectorIndex) => {
          if (connectorIndex === moveIndex || connectorIndex === anchorIndex) {
            return false
          }

          const connectorVertical =
            Math.abs(connector.start.x - connector.end.x) < TOL
          const connectorHorizontal =
            Math.abs(connector.start.y - connector.end.y) < TOL

          if (movingVertical && connectorHorizontal) {
            return (
              lineContainsPoint(connector, {
                x: lineToMove.start.x,
                y: connector.start.y,
              }) &&
              lineContainsPoint(lineToMove, {
                x: lineToMove.start.x,
                y: connector.start.y,
              }) &&
              lineContainsPoint(connector, {
                x: anchor.start.x,
                y: connector.start.y,
              }) &&
              lineContainsPoint(anchor, {
                x: anchor.start.x,
                y: connector.start.y,
              })
            )
          }

          if (movingHorizontal && connectorVertical) {
            return (
              lineContainsPoint(connector, {
                x: connector.start.x,
                y: lineToMove.start.y,
              }) &&
              lineContainsPoint(lineToMove, {
                x: connector.start.x,
                y: lineToMove.start.y,
              }) &&
              lineContainsPoint(connector, {
                x: connector.start.x,
                y: anchor.start.y,
              }) &&
              lineContainsPoint(anchor, {
                x: connector.start.x,
                y: anchor.start.y,
              })
            )
          }

          return false
        })

        if (!hasConnector) continue

        const movedLine = movingVertical
          ? {
              start: { x: anchor.start.x, y: lineToMove.start.y },
              end: { x: anchor.start.x, y: lineToMove.end.y },
            }
          : {
              start: { x: lineToMove.start.x, y: anchor.start.y },
              end: { x: lineToMove.end.x, y: anchor.start.y },
            }

        if (!candidateIsValid([movedLine], cellContents)) continue

        const candidate = aligned.map((line, index) =>
          index === moveIndex ? movedLine : line,
        )
        if (connectedComponentCount(candidate) > currentComponents) {
          continue
        }

        const mergedCandidate = mergeAlignedSegments(candidate)
        const currentMerged = mergeAlignedSegments(aligned)
        if (mergedCandidate.length >= currentMerged.length) continue

        aligned = mergedCandidate
        changed = true
        break
      }

      if (changed) break
    }
  }

  return aligned
}
