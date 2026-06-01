import type { Line as BLine, InputRect } from "./types"
import {
  TOL,
  pathLength,
  candidateIsValid,
  sharedCellRegionCount,
  axisValues,
  mergeAlignedSegments,
} from "./geometry"

export const fixSharedCellRegions = (
  lines: BLine[],
  originalLines: BLine[],
  cellContents: InputRect[],
): BLine[] => {
  let improved = lines

  while (true) {
    const currentShared = sharedCellRegionCount(improved, cellContents)
    if (currentShared === 0) break

    const { xs, ys } = axisValues(improved, cellContents)
    const candidates: BLine[][] = []

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
            improved.map((item, index) => {
              if (index === i) return candidateLine
              return item
            }),
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
            improved.map((item, index) => {
              if (index === i) return candidateLine
              return item
            }),
          )
        }
      }
    }

    for (const line of originalLines) {
      candidates.push([...improved, line])
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
  }

  return improved
}
