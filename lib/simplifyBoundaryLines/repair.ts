import type { Line, CellContent } from "../types"
import { TOL, pathLength, candidateIsValid } from "./primitives"
import {
  axisValues,
  sharedCellRegionCount,
  connectedComponentCount,
  lineSeparatesCellPair,
  separatedCellPairs,
  preservesSeparatedCellPairs,
} from "./cellUtils"
import { mergeAlignedSegments } from "../mergeAlignedSegments"

// --- restoreMissingSeparators ---

const restoreMissingSeparators = (
  lines: Line[],
  originalLines: Line[],
  cellContents: CellContent[],
  requiredPairs: Set<string>,
) => {
  let restored = lines

  while (true) {
    const actualPairs = separatedCellPairs(restored, cellContents)
    const missingPair = [...requiredPairs].find((pair) => !actualPairs.has(pair))
    if (!missingPair) break

    const [aStr, bStr] = missingPair.split(":")
    const cellA = cellContents[Number(aStr)]
    const cellB = cellContents[Number(bStr)]
    if (!cellA || !cellB) break

    const replacement = originalLines
      .filter((line) => lineSeparatesCellPair(line, cellA, cellB))
      .sort(
        (a, b) =>
          pathLength([a]) - pathLength([b]) ||
          JSON.stringify(a).localeCompare(JSON.stringify(b)),
      )
      .at(0)

    if (!replacement) break
    restored = mergeAlignedSegments([...restored, replacement])
  }

  return restored
}

// --- extendLinesToImproveCellRegions ---

const extendLinesToImproveCellRegions = (
  lines: Line[],
  cellContents: CellContent[],
) => {
  let improved = lines
  let changed = true

  while (changed) {
    changed = false
    const currentShared = sharedCellRegionCount(improved, cellContents)
    if (currentShared === 0) break

    const { xs, ys } = axisValues(improved, cellContents)
    const candidates: Line[][] = []

    for (let i = 0; i < improved.length; i++) {
      const line = improved[i]
      if (!line) continue

      if (Math.abs(line.start.y - line.end.y) < TOL) {
        const minX = Math.min(line.start.x, line.end.x)
        const maxX = Math.max(line.start.x, line.end.x)
        for (const x of xs) {
          if (x >= minX - TOL && x <= maxX + TOL) continue
          const candidateLine = {
            start: { x: Math.min(x, minX), y: line.start.y },
            end: { x: Math.max(x, maxX), y: line.start.y },
          }
          if (!candidateIsValid([candidateLine], cellContents)) continue
          candidates.push(
            improved.map((item, index) => (index === i ? candidateLine : item)),
          )
        }
      }

      if (Math.abs(line.start.x - line.end.x) < TOL) {
        const minY = Math.min(line.start.y, line.end.y)
        const maxY = Math.max(line.start.y, line.end.y)
        for (const y of ys) {
          if (y >= minY - TOL && y <= maxY + TOL) continue
          const candidateLine = {
            start: { x: line.start.x, y: Math.min(y, minY) },
            end: { x: line.start.x, y: Math.max(y, maxY) },
          }
          if (!candidateIsValid([candidateLine], cellContents)) continue
          candidates.push(
            improved.map((item, index) => (index === i ? candidateLine : item)),
          )
        }
      }
    }

    const best = candidates
      .map((candidate) => ({
        lines: mergeAlignedSegments(candidate),
        shared: sharedCellRegionCount(candidate, cellContents),
      }))
      .filter((candidate) => candidate.shared < currentShared)
      .sort(
        (a, b) =>
          a.shared - b.shared ||
          a.lines.length - b.lines.length ||
          pathLength(a.lines) - pathLength(b.lines),
      )
      .at(0)

    if (!best) break
    improved = best.lines
    changed = true
  }

  return improved
}

// --- restoreSharedCellRegions ---

const restoreSharedCellRegions = (
  lines: Line[],
  originalLines: Line[],
  cellContents: CellContent[],
) => {
  let restored = lines
  let currentShared = sharedCellRegionCount(restored, cellContents)

  while (currentShared > 0) {
    const best = originalLines
      .map((line) => {
        const candidate = mergeAlignedSegments([...restored, line])
        return {
          lines: candidate,
          shared: sharedCellRegionCount(candidate, cellContents),
        }
      })
      .filter((candidate) => candidate.shared < currentShared)
      .sort(
        (a, b) =>
          a.shared - b.shared ||
          a.lines.length - b.lines.length ||
          pathLength(a.lines) - pathLength(b.lines),
      )
      .at(0)

    if (!best) break
    restored = best.lines
    currentShared = best.shared
  }

  return restored
}

// --- removeRedundantSeparators ---

const removeRedundantSeparators = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let reduced = lines
  let changed = true

  while (changed) {
    changed = false
    const requiredPairs = separatedCellPairs(reduced, cellContents)
    const currentShared = sharedCellRegionCount(reduced, cellContents)
    const currentComponents = connectedComponentCount(reduced)

    for (let i = 0; i < reduced.length; i++) {
      const candidate = reduced.filter((_, index) => index !== i)
      if (!candidateIsValid(candidate, cellContents)) continue
      if (
        !preservesSeparatedCellPairs(candidate, cellContents, requiredPairs)
      ) {
        continue
      }
      if (sharedCellRegionCount(candidate, cellContents) > currentShared) {
        continue
      }
      if (connectedComponentCount(candidate) > currentComponents) continue

      reduced = candidate
      changed = true
      break
    }
  }

  return reduced
}

// --- repairSeparators phase ---

export const repairSeparators = (
  lines: Line[],
  originalLines: Line[],
  cellContents: CellContent[],
  requiredPairs: Set<string>,
): Line[] => {
  const restored = restoreMissingSeparators(
    lines,
    originalLines,
    cellContents,
    requiredPairs,
  )
  const extended = extendLinesToImproveCellRegions(restored, cellContents)
  const partitioned = restoreSharedCellRegions(
    extended,
    originalLines,
    cellContents,
  )
  return removeRedundantSeparators(partitioned, cellContents)
}
