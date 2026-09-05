import { calculateCellBoundaries as _calculateCellBoundaries } from "./calculateCellBoundaries"
import type { InputRect as Cell, Line } from "./types"
import { applyCellMargin } from "./applyCellMargin"
export type { Line, Cell }
export { computeBoundsFromCellContents } from "./calculateCellBoundaries"

export const calculateCellBoundaries = (
  inputCellContents: Omit<Cell, "cellId">[],
  options: { cellMargin?: number } = {},
): Line[] => {
  return _calculateCellBoundaries(
    applyCellMargin(inputCellContents, options.cellMargin ?? 0).map((c) => ({
      x: c.minX,
      y: c.minY,
      width: c.maxX - c.minX,
      height: c.maxY - c.minY,
    })),
  )
}
