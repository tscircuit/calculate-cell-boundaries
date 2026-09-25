import { expect, test } from "bun:test"
import { collapseOverlappingHorizontalSteps } from "../lib/solvers/RefineBoundaryLinesSolver/collapseOverlappingHorizontalSteps"

test("align touching horizontal spans crossed by an overhanging connector", () => {
  const lines = collapseOverlappingHorizontalSteps(
    [
      { start: { x: -2, y: 0 }, end: { x: 0, y: 0 } },
      { start: { x: 0, y: 0.1 }, end: { x: 2, y: 0.1 } },
      { start: { x: 0, y: -2 }, end: { x: 0, y: 0.2 } },
    ],
    [],
  )
  expect(lines.filter((line) => line.start.y === line.end.y)).toEqual([
    { start: { x: -2, y: 0 }, end: { x: 2, y: 0 } },
  ])
})

test("keep a touching step when both existing heights are blocked by cells", () => {
  const lines = [
    { start: { x: -2, y: 0 }, end: { x: 0, y: 0 } },
    { start: { x: 0, y: 0.1 }, end: { x: 2, y: 0.1 } },
    { start: { x: 0, y: -2 }, end: { x: 0, y: 0.2 } },
  ]
  expect(
    collapseOverlappingHorizontalSteps(lines, [
      { minX: 0.5, maxX: 1, minY: -0.02, maxY: 0.02 },
      { minX: -1, maxX: -0.5, minY: 0.08, maxY: 0.12 },
    ]),
  ).toEqual(lines)
})
