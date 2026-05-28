import type { Line, CellContent } from "../types"
import { TOL, rangesOverlap, cellCenter, valueBetween } from "./primitives"

export const lineSeparatesCells = (line: Line, cellContents: CellContent[]) => {
  if (Math.abs(line.start.x - line.end.x) < TOL) {
    const x = line.start.x
    const yMin = Math.min(line.start.y, line.end.y)
    const yMax = Math.max(line.start.y, line.end.y)

    return cellContents.some(
      (left) =>
        left.maxX <= x + TOL &&
        rangesOverlap(yMin, yMax, left.minY, left.maxY) &&
        cellContents.some(
          (right) =>
            right.minX >= x - TOL &&
            rangesOverlap(yMin, yMax, right.minY, right.maxY) &&
            rangesOverlap(left.minY, left.maxY, right.minY, right.maxY),
        ),
    )
  }

  if (Math.abs(line.start.y - line.end.y) < TOL) {
    const y = line.start.y
    const xMin = Math.min(line.start.x, line.end.x)
    const xMax = Math.max(line.start.x, line.end.x)

    return cellContents.some(
      (top) =>
        top.maxY <= y + TOL &&
        rangesOverlap(xMin, xMax, top.minX, top.maxX) &&
        cellContents.some(
          (bottom) =>
            bottom.minY >= y - TOL &&
            rangesOverlap(xMin, xMax, bottom.minX, bottom.maxX) &&
            rangesOverlap(top.minX, top.maxX, bottom.minX, bottom.maxX),
        ),
    )
  }

  return false
}

export const lineSeparatesCellPair = (
  line: Line,
  a: CellContent,
  b: CellContent,
) => {
  const aCenter = cellCenter(a)
  const bCenter = cellCenter(b)

  if (Math.abs(line.start.x - line.end.x) < TOL) {
    const x = line.start.x
    const yMin = Math.min(line.start.y, line.end.y)
    const yMax = Math.max(line.start.y, line.end.y)
    return (
      valueBetween(x, aCenter.x, bCenter.x) &&
      rangesOverlap(yMin, yMax, a.minY, a.maxY) &&
      rangesOverlap(yMin, yMax, b.minY, b.maxY)
    )
  }

  if (Math.abs(line.start.y - line.end.y) < TOL) {
    const y = line.start.y
    const xMin = Math.min(line.start.x, line.end.x)
    const xMax = Math.max(line.start.x, line.end.x)
    return (
      valueBetween(y, aCenter.y, bCenter.y) &&
      rangesOverlap(xMin, xMax, a.minX, a.maxX) &&
      rangesOverlap(xMin, xMax, b.minX, b.maxX)
    )
  }

  return false
}

export const separatedCellPairs = (
  lines: Line[],
  cellContents: CellContent[],
) => {
  const pairs = new Set<string>()

  for (let i = 0; i < cellContents.length; i++) {
    const a = cellContents[i]
    if (!a) continue

    for (let j = i + 1; j < cellContents.length; j++) {
      const b = cellContents[j]
      if (!b) continue

      if (lines.some((line) => lineSeparatesCellPair(line, a, b))) {
        pairs.add(`${i}:${j}`)
      }
    }
  }

  return pairs
}

export const preservesSeparatedCellPairs = (
  lines: Line[],
  cellContents: CellContent[],
  requiredPairs: Set<string>,
) => {
  const actualPairs = separatedCellPairs(lines, cellContents)
  return [...requiredPairs].every((pair) => actualPairs.has(pair))
}
