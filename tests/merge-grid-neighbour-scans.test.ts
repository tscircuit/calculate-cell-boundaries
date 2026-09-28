import { expect, spyOn, test } from "bun:test"
import { MergeGridSolver } from "../lib/solvers/MergeGridSolver/MergeGridSolver"
import * as geometry from "../lib/solvers/MergeGridSolver/geometry"

test("stops checking neighbours after selecting the step's merge", () => {
  const seed = { cellId: "seed", x: 0, y: 0, width: 1, height: 1 }
  const first = { cellId: "first", x: 1, y: 0, width: 1, height: 1 }
  const second = { cellId: "second", x: 2, y: 0, width: 1, height: 1 }
  const third = { cellId: "third", x: 3, y: 0, width: 1, height: 1 }
  const solver = new MergeGridSolver({
    validSegments: [],
    gridRects: [seed, first, second, third],
    cellContainingRects: [seed],
    cellContents: [seed],
  })
  solver.step()

  const areAdjacent = spyOn(geometry, "areAdjacent")
  try {
    solver.step()
    expect(areAdjacent).toHaveBeenCalledTimes(1)
    expect(solver.groupedRects.map((rect) => rect.cellId)).toEqual([
      seed.cellId,
      first.cellId,
    ])
    solver.solve()
    expect(solver.solved).toBe(true)
    expect(solver.groupedRects.map((rect) => rect.cellId)).toEqual([
      seed.cellId,
      first.cellId,
      second.cellId,
      third.cellId,
    ])
    expect(solver.groupedRects.every((rect) => rect.groupId === 0)).toBe(true)
  } finally {
    areAdjacent.mockRestore()
  }
})
