import type { Line, CellContent } from "../types"
import { TOL, isZeroLength, isAxisAligned, rangesOverlap } from "./primitives"

const segmentCrossesRectInterior = (line: Line, rect: CellContent) => {
  const x1 = line.start.x
  const y1 = line.start.y
  const x2 = line.end.x
  const y2 = line.end.y

  if (Math.abs(x1 - x2) < TOL) {
    const yMin = Math.min(y1, y2)
    const yMax = Math.max(y1, y2)
    return (
      x1 > rect.minX + TOL &&
      x1 < rect.maxX - TOL &&
      yMax > rect.minY - TOL &&
      yMin < rect.maxY + TOL
    )
  }

  if (Math.abs(y1 - y2) < TOL) {
    const xMin = Math.min(x1, x2)
    const xMax = Math.max(x1, x2)
    return (
      y1 > rect.minY + TOL &&
      y1 < rect.maxY - TOL &&
      xMax > rect.minX + TOL &&
      xMin < rect.maxX - TOL
    )
  }

  return true
}

const segmentOverlapsRectEdge = (line: Line, rect: CellContent) => {
  const x1 = line.start.x
  const y1 = line.start.y
  const x2 = line.end.x
  const y2 = line.end.y

  if (Math.abs(x1 - x2) < TOL) {
    const yMin = Math.min(y1, y2)
    const yMax = Math.max(y1, y2)
    return (
      (Math.abs(x1 - rect.minX) < TOL || Math.abs(x1 - rect.maxX) < TOL) &&
      rangesOverlap(yMin, yMax, rect.minY, rect.maxY)
    )
  }

  if (Math.abs(y1 - y2) < TOL) {
    const xMin = Math.min(x1, x2)
    const xMax = Math.max(x1, x2)
    return (
      (Math.abs(y1 - rect.minY) < TOL || Math.abs(y1 - rect.maxY) < TOL) &&
      rangesOverlap(xMin, xMax, rect.minX, rect.maxX)
    )
  }

  return false
}

export const candidateIsValid = (lines: Line[], cellContents: CellContent[]) =>
  lines.length > 0 &&
  lines.every(
    (line) =>
      !isZeroLength(line) &&
      isAxisAligned(line) &&
      !cellContents.some(
        (rect) =>
          segmentCrossesRectInterior(line, rect) ||
          segmentOverlapsRectEdge(line, rect),
      ),
  )
