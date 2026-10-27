import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../lib"
import { ComputeMidlinesSolver } from "../lib/solvers/ComputeMidlinesSolver/ComputeMidlinesSolver"

const createCells = (count: number) => [
  ...Array.from({ length: count - 1 }, () => ({
    minX: 0,
    minY: 0,
    maxX: 1,
    maxY: 1,
  })),
  { minX: 3, minY: 0, maxX: 4, maxY: 1 },
]

test("processes every cell pair beyond the default midline iteration limit", () => {
  // 448 cells require 100,128 steps, exceeding the default 100,000.
  // Overlapping cells keep the output small while exercising every pair.
  const solver = new ComputeMidlinesSolver({
    cellContents: createCells(448).map((cell, index) => ({
      cellId: String(index),
      x: cell.minX,
      y: cell.minY,
      width: cell.maxX - cell.minX,
      height: cell.maxY - cell.minY,
    })),
    containerWidth: 4,
    containerHeight: 1,
  })

  solver.solve()

  expect(solver.failed).toBe(false)
  expect(solver.solved).toBe(true)
  expect(solver.getOutput()).toHaveLength(447)
  expect(solver.getOutput().at(-1)).toMatchObject({
    start: { x: 2, y: 0 },
    end: { x: 2, y: 1 },
    cellIds: ["446", "447"],
  })
})

test.each([447, 448])(
  "preserves the public boundary with %i cells",
  (count) => {
    expect(calculateCellBoundaries(createCells(count))).toEqual([
      { start: { x: 2, y: 0 }, end: { x: 2, y: 1 } },
    ])
  },
)
