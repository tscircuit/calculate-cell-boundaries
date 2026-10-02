import { expect, test } from "bun:test"
import { BuildGridSolver } from "../lib/solvers/BuildGridSolver/BuildGridSolver"

test("finishes both grid phases when the segment count reaches the default limit", () => {
  const defaultIterationLimit = 100_000
  const allSegments = Array.from({ length: defaultIterationLimit }, () => ({
    start: { x: 1, y: 0 },
    end: { x: 1, y: 2 },
  }))
  const solver = new BuildGridSolver({
    allSegments,
    cellContents: [],
    containerWidth: 2,
    containerHeight: 2,
  })

  solver.solve()

  expect(solver.solved).toBe(true)
  expect(solver.failed).toBe(false)
  expect(solver.validSegments).toHaveLength(defaultIterationLimit)
  expect(solver.gridRects).toHaveLength(2)
})
