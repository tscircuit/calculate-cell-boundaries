import type { InputRect, Line as BLine } from "./types"
import {
  TOL,
  candidateIsValid,
  connectedComponentCount,
  lineContainsPoint,
  mergeAlignedSegments,
  preservesSeparatedCellPairs,
  separatedCellPairs,
  sharedCellRegionCount,
} from "./geometry"

const isHorizontal = (line: BLine) => Math.abs(line.start.y - line.end.y) < TOL
const isVertical = (line: BLine) => Math.abs(line.start.x - line.end.x) < TOL

export const collapseOverlappingHorizontalSteps = (
  lines: BLine[],
  cellContents: InputRect[],
): BLine[] => {
  const requiredPairs = separatedCellPairs(lines, cellContents)
  const sharedRegions = sharedCellRegionCount(lines, cellContents)
  const connectedComponents = connectedComponentCount(lines)

  for (let firstIndex = 0; firstIndex < lines.length; firstIndex++) {
    const first = lines[firstIndex]
    if (!first || !isHorizontal(first)) continue

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < lines.length;
      secondIndex++
    ) {
      const second = lines[secondIndex]
      if (!second || !isHorizontal(second)) continue

      const lowerY = Math.min(first.start.y, second.start.y)
      const upperY = Math.max(first.start.y, second.start.y)
      if (upperY - lowerY < TOL) continue

      const firstMinX = Math.min(first.start.x, first.end.x)
      const firstMaxX = Math.max(first.start.x, first.end.x)
      const secondMinX = Math.min(second.start.x, second.end.x)
      const secondMaxX = Math.max(second.start.x, second.end.x)
      const overlapMinX = Math.max(firstMinX, secondMinX)
      const overlapMaxX = Math.min(firstMaxX, secondMaxX)
      if (overlapMaxX - overlapMinX < TOL) continue

      const joined = lines.some((line) => {
        if (!isVertical(line)) return false
        const x = line.start.x
        return (
          x >= overlapMinX - TOL &&
          x <= overlapMaxX + TOL &&
          lineContainsPoint(line, { x, y: lowerY }) &&
          lineContainsPoint(line, { x, y: upperY })
        )
      })
      if (!joined) continue

      const minX = Math.min(firstMinX, secondMinX)
      const maxX = Math.max(firstMaxX, secondMaxX)
      const boundaries = new Set([lowerY, upperY])
      for (const cell of cellContents) {
        if (cell.maxX <= minX + TOL || cell.minX >= maxX - TOL) continue
        if (cell.minY > lowerY && cell.minY < upperY) boundaries.add(cell.minY)
        if (cell.maxY > lowerY && cell.maxY < upperY) boundaries.add(cell.maxY)
      }
      const sortedBoundaries = [...boundaries].sort((a, b) => a - b)

      for (let index = 1; index < sortedBoundaries.length; index++) {
        const previous = sortedBoundaries[index - 1]
        const next = sortedBoundaries[index]
        if (previous === undefined || next === undefined) continue
        const targetY = (previous + next) / 2
        const mergedHorizontal = {
          start: { x: minX, y: targetY },
          end: { x: maxX, y: targetY },
        }
        if (!candidateIsValid([mergedHorizontal], cellContents)) continue

        const candidate: BLine[] = []
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
          if (lineIndex === firstIndex || lineIndex === secondIndex) continue
          const line = lines[lineIndex]
          if (!line) continue
          if (!isVertical(line) || line.start.x < minX || line.start.x > maxX) {
            candidate.push(line)
            continue
          }

          const x = line.start.x
          const touchesStep =
            lineContainsPoint(line, { x, y: lowerY }) ||
            lineContainsPoint(line, { x, y: upperY })
          if (!touchesStep) {
            candidate.push(line)
            continue
          }

          const startInStep = line.start.y >= lowerY && line.start.y <= upperY
          const endInStep = line.end.y >= lowerY && line.end.y <= upperY
          if (startInStep && endInStep) continue
          if (startInStep) {
            candidate.push({ start: { x, y: targetY }, end: line.end })
          } else if (endInStep) {
            candidate.push({ start: line.start, end: { x, y: targetY } })
          } else {
            candidate.push(line)
          }
        }
        candidate.push(mergedHorizontal)

        if (!candidateIsValid(candidate, cellContents)) continue
        if (
          !preservesSeparatedCellPairs(candidate, cellContents, requiredPairs)
        )
          continue
        if (sharedCellRegionCount(candidate, cellContents) > sharedRegions)
          continue
        if (connectedComponentCount(candidate) > connectedComponents) continue
        return collapseOverlappingHorizontalSteps(
          mergeAlignedSegments(candidate),
          cellContents,
        )
      }
    }
  }

  return lines
}
