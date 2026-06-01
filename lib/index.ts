import type { InputRect, Line } from "./types"
export type { InputRect as CellContent, Line } from "./types"
import { calculateCellBoundaries as _calculateCellBoundaries } from "./calculateCellBoundaries"

export const calculateCellBoundaries = (
  inputCellContents: Omit<InputRect, "cellId">[],
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
