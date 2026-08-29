import { calculateCellBoundaries as _calculateCellBoundaries } from "./calculateCellBoundaries"
import type { InputRect, Line } from "./types"
export { computeBoundsFromCellContents } from "./calculateCellBoundaries"
export type { CellId, InputRect as Cell, Line } from "./types"

export const calculateCellBoundaries = (
  inputCellContents: InputRect[],
): Line[] => {
  return _calculateCellBoundaries(
    inputCellContents.map((c) => ({
      cellId: c.cellId,
      x: c.minX,
      y: c.minY,
      width: c.maxX - c.minX,
      height: c.maxY - c.minY,
    })),
  )
}
