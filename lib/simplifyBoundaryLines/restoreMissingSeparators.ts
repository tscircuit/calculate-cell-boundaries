import type { Line, CellContent } from "../types"
import { pathLength } from "./primitives"
import {
  lineSeparatesCellPair,
  separatedCellPairs,
  preservesSeparatedCellPairs,
} from "./cellSeparation"
import { mergeAlignedSegments } from "../mergeAlignedSegments"

export const restoreMissingSeparators = (
  lines: Line[],
  originalLines: Line[],
  cellContents: CellContent[],
  requiredPairs: Set<string>,
) => {
  let restored = lines

  while (!preservesSeparatedCellPairs(restored, cellContents, requiredPairs)) {
    const actualPairs = separatedCellPairs(restored, cellContents)
    const missingPair = [...requiredPairs].find(
      (pair) => !actualPairs.has(pair),
    )
    if (!missingPair) break

    const parts = missingPair.split(":")
    const aIndex = Number(parts[0])
    const bIndex = Number(parts[1])
    const a = cellContents[aIndex]
    const b = cellContents[bIndex]
    if (!a || !b) break

    const replacement = originalLines
      .filter((line) => lineSeparatesCellPair(line, a, b))
      .sort(
        (lineA, lineB) =>
          pathLength([lineA]) - pathLength([lineB]) ||
          JSON.stringify(lineA).localeCompare(JSON.stringify(lineB)),
      )
      .at(0)

    if (!replacement) break
    restored = mergeAlignedSegments([...restored, replacement])
  }

  return restored
}
