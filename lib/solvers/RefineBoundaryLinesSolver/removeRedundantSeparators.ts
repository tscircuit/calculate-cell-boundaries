import type { Line as BLine, InputRect } from "./types"
import {
  candidateIsValid,
  connectedComponentCount,
  preservesSeparatedCellPairs,
  separatedCellPairs,
  sharedCellRegionCount,
} from "./geometry"

export const removeRedundantSeparators = (
  lines: BLine[],
  cellContents: InputRect[],
): BLine[] => {
  let reduced = lines
  let changed = true

  while (changed) {
    changed = false
    const requiredPairs = separatedCellPairs(reduced, cellContents)
    const currentShared = sharedCellRegionCount(reduced, cellContents)
    const currentComponents = connectedComponentCount(reduced)

    for (let lineIndex = 0; lineIndex < reduced.length; lineIndex++) {
      const candidate = reduced.filter((_, index) => index !== lineIndex)
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
