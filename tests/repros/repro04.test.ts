import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../../lib"

// Extracted from index.circuit (15).json. These are the bounds of the five
// schematic sections after @tscircuit/core applies its 1-unit cell margin.
const scene = {
  cellContents: [
    {
      minX: -17.491955349999998,
      maxX: -8.24195535,
      minY: -13.522499999999999,
      maxY: -1.1224999999999996,
    },
    {
      minX: -6.241955349999998,
      maxX: 6.558044650000003,
      minY: -9.6125,
      maxY: -5.0325,
    },
    {
      minX: 8.558044650000005,
      maxX: 17.49195535,
      minY: -14.145,
      maxY: -0.4999999999999998,
    },
    {
      minX: -7.68,
      maxX: 3.18,
      minY: -28.919999999999998,
      maxY: -16.32,
    },
    {
      minX: 5.2675,
      maxX: 7.592499999999999,
      minY: -29.095,
      maxY: -16.144999999999996,
    },
  ],
}

const BOTTOM_DIVIDER_X = 4.22375
const HORIZONTAL_SEPARATOR_Y = -15.2325
const BOUNDARY_TOLERANCE = 0.001

test("repro04 - light controller schematic sections", async () => {
  const lines = calculateCellBoundaries(scene.cellContents)

  const bottomDivider = lines.find(
    (line) =>
      Math.abs(line.start.x - BOTTOM_DIVIDER_X) < BOUNDARY_TOLERANCE &&
      line.start.x === line.end.x,
  )
  expect(bottomDivider).toBeDefined()
  if (!bottomDivider) throw new Error("Expected the lower vertical divider")
  expect(Math.max(bottomDivider.start.y, bottomDivider.end.y)).toBeCloseTo(
    HORIZONTAL_SEPARATOR_Y,
  )

  await expect({
    lines,
    cellContents: scene.cellContents,
  }).toMatchCellBoundariesSnapshot(import.meta.path)
})
