import type { Line, CellContent } from "../types"
import { pathLength } from "./primitives"
import { sharedCellRegionCount } from "./cellRegions"
import { mergeAlignedSegments } from "../mergeAlignedSegments"

export const restoreSharedCellRegions = (
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
