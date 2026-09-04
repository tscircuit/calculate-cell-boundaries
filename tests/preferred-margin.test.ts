import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../lib"

test("preferred margin preserves separated inputs and never shrinks actual content", () => {
  const cells = [
    { minX: 0, minY: 0, maxX: 2, maxY: 2 },
    { minX: 6, minY: 0, maxX: 8, maxY: 2 },
  ]
  expect(calculateCellBoundaries(cells)).toEqual(
    calculateCellBoundaries(cells, { cellMargin: 0 }),
  )
  expect(calculateCellBoundaries(cells, { cellMargin: 1 })).toEqual([
    { start: { x: 4, y: -1 }, end: { x: 4, y: 3 } },
  ])
  const overlapping = [cells[0]!, { minX: 1, minY: 0, maxX: 3, maxY: 2 }]
  expect(calculateCellBoundaries(overlapping, { cellMargin: 1 })).toEqual([])
  expect(calculateCellBoundaries([], { cellMargin: 1 })).toEqual([])
  expect(calculateCellBoundaries([cells[0]!], { cellMargin: 1 })).toEqual([])
  expect(() => calculateCellBoundaries(cells, { cellMargin: -1 })).toThrow()
  expect(() =>
    calculateCellBoundaries(cells, { cellMargin: Infinity }),
  ).toThrow()
})
