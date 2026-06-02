import { calculateCellBoundaries as _calculateCellBoundaries } from "./calculateCellBoundaries"
import type { InputRect as Cell, Line } from "./types"
export type { Line, Cell }
export { computeBoundsFromCellContents } from "./calculateCellBoundaries"

export const calculateCellBoundaries = (
  inputCellContents: Omit<Cell, "cellId">[],
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
