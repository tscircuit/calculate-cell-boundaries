import type { Line as BLine, InputRect } from "./types"
import {
  pathLength,
  separatedCellPairs,
  lineSeparatesCellPair,
  mergeAlignedSegments,
} from "./geometry"

export const restoreMissingSeparators = (
  lines: BLine[],
  originalLines: BLine[],
  cellContents: InputRect[],
  requiredPairs: Set<string>,
): BLine[] => {
  let restored = lines

  while (true) {
    const actualPairs = separatedCellPairs(restored, cellContents)
    const missingPair = [...requiredPairs].find(
      (pair) => !actualPairs.has(pair),
    )
    if (!missingPair) break

    const [aIdx, bIdx] = missingPair.split(":")
    const cellA = cellContents[Number(aIdx)]
    const cellB = cellContents[Number(bIdx)]
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
