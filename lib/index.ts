import { calculateCellBoundaries as _calculateCellBoundaries } from "./calculateCellBoundaries"
import type { InputRect, Line as BoundaryLine } from "./types"

export type CellContent = InputRect

export type Line = BoundaryLine

export const calculateCellBoundaries = (
  inputCellContents: Omit<CellContent, "cellId">[],
): Line[] => {
  return _calculateCellBoundaries(
    inputCellContents.map((c) => ({
      x: c.minX,
      y: c.minY,
      width: c.maxX - c.minX,
      height: c.maxY - c.minY,
    })),
  )
}
