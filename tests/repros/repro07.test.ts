import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../../lib"

const cellContents = [
  { cellId: "horizontal", minX: -3, minY: -0.5, maxX: -2, maxY: 0.5 },
  { cellId: "horizontal", minX: 2, minY: -0.5, maxX: 3, maxY: 0.5 },
  { cellId: "vertical", minX: -0.5, minY: -3, maxX: 0.5, maxY: -2 },
  { cellId: "vertical", minX: -0.5, minY: 2, maxX: 0.5, maxY: 3 },
]

test("grouped cross contents stay in separate cell regions", async () => {
  const lines = calculateCellBoundaries(cellContents)

  expect(lines).toEqual([
    {
      start: { x: -0.9375, y: -3 },
      end: { x: -0.9375, y: 3 },
    },
    {
      start: { x: -0.9375, y: 1.25 },
      end: { x: 1.25, y: 1.25 },
    },
    {
      start: { x: 1.25, y: -3 },
      end: { x: 1.25, y: 3 },
    },
  ])
  await expect({ lines, cellContents }).toMatchCellBoundariesSnapshot(
    import.meta.path,
  )
})
