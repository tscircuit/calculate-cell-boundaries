import type { InputRect } from "./types"

export function applyCellMargin(cells: InputRect[], cellMargin: number) {
  if (!Number.isFinite(cellMargin) || cellMargin < 0) {
    throw new Error("cellMargin must be finite and nonnegative")
  }
  if (cellMargin === 0 || cells.length < 2) return cells

  const expandedCells = cells.map((cell) => ({
    ...cell,
    minX: cell.minX - cellMargin,
    maxX: cell.maxX + cellMargin,
    minY: cell.minY - cellMargin,
    maxY: cell.maxY + cellMargin,
  }))
  const connectedCells = [expandedCells[0]!]
  const remainingCells = expandedCells.slice(1)
  while (remainingCells.length > 0) {
    const nextIndex = remainingCells.findIndex((candidate) =>
      connectedCells.some(
        (connected) =>
          connected.minX <= candidate.maxX &&
          connected.maxX >= candidate.minX &&
          connected.minY <= candidate.maxY &&
          connected.maxY >= candidate.minY,
      ),
    )
    if (nextIndex < 0) return expandedCells
    connectedCells.push(...remainingCells.splice(nextIndex, 1))
  }

  // A margin connecting every cell prevents any separating boundary.
  // Keep actual content bounds hard and relax only the requested margin.
  return cells
}
