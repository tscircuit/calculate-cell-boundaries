import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../../lib"

test("preferred margin on the real benchmark's four sections", async () => {
  const cellContents = [
    { minX: -8.85, minY: -2.4, maxX: -3, maxY: 2 },
    { minX: -1.75, minY: -1.6, maxX: 1.45, maxY: 1.58 },
    { minX: 2.75, minY: -2.8, maxX: 7.2, maxY: 0.8999999999999999 },
    { minX: 1.7, minY: 3.175, maxX: 9.135, maxY: 6.2250000000000005 },
  ]
  const expandedCells = cellContents.map((cell) => ({
    minX: cell.minX - 1,
    minY: cell.minY - 1,
    maxX: cell.maxX + 1,
    maxY: cell.maxY + 1,
  }))
  const lines = calculateCellBoundaries(expandedCells)
  expect(lines).toHaveLength(0)
  await expect({ cellContents, lines }).toMatchCellBoundariesSnapshot(
    import.meta.path,
  )
})
