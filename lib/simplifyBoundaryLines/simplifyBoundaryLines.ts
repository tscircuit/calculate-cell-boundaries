import type { Line, CellContent } from "../types"
import { separatedCellPairs } from "./cellUtils"
import { reduce } from "./reduce"
import { repairSeparators } from "./repair"
import { refine } from "./refine"

export const simplifyBoundaryLines = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  const requiredSeparatedPairs = separatedCellPairs(lines, cellContents)
  const simplified = reduce(lines, cellContents)
  const repaired = repairSeparators(
    simplified,
    lines,
    cellContents,
    requiredSeparatedPairs,
  )
  return refine(repaired, cellContents)
}
