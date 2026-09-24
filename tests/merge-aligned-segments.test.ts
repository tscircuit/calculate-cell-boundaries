import { expect, test } from "bun:test"
import { mergeAlignedSegments } from "../lib/solvers/ReduceBoundaryLinesSolver/geometry"

test("merge vertical segments separated by floating-point roundoff", () => {
  const lines = mergeAlignedSegments([
    { start: { x: 0, y: 0 }, end: { x: 0, y: 0.3 } },
    { start: { x: 0, y: 0.1 + 0.2 }, end: { x: 0, y: 1 } },
  ])
  expect(lines).toEqual([{ start: { x: 0, y: 0 }, end: { x: 0, y: 1 } }])
})

test("merge horizontal segments separated by floating-point roundoff", () => {
  const lines = mergeAlignedSegments([
    { start: { x: 0, y: 0 }, end: { x: 0.3, y: 0 } },
    { start: { x: 0.1 + 0.2, y: 0 }, end: { x: 1, y: 0 } },
  ])
  expect(lines).toEqual([{ start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }])
})

test("keep vertical segments with a real gap separate", () => {
  const segments = [
    { start: { x: 0, y: 0 }, end: { x: 0, y: 0.3 } },
    { start: { x: 0, y: 0.4 }, end: { x: 0, y: 1 } },
  ]
  expect(mergeAlignedSegments(segments)).toEqual(segments)
})

test("keep horizontal segments with a real gap separate", () => {
  const segments = [
    { start: { x: 0, y: 0 }, end: { x: 0.3, y: 0 } },
    { start: { x: 0.4, y: 0 }, end: { x: 1, y: 0 } },
  ]
  expect(mergeAlignedSegments(segments)).toEqual(segments)
})
