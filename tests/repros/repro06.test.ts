import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../../lib"

// Exact section bounds passed by @tscircuit/core after applying its 1-unit
// cell margin in schematic-section-rp2040-autolayout.test.tsx.
const cellContents = [
  {
    minX: -16.903477674999998,
    maxX: -12.088477674999998,
    minY: -12.38,
    maxY: -0.5,
  },
  {
    minX: 3.5309776750000026,
    maxX: 16.903477675,
    minY: -10.016666666666667,
    maxY: -2.863333333333333,
  },
  {
    minX: -10.088477674999998,
    maxX: -5.398477674999998,
    minY: -8.5625,
    maxY: -4.317500000000001,
  },
  {
    minX: -3.3984776749999988,
    maxX: 1.5309776750000006,
    minY: -8.510000000000002,
    maxY: -4.37,
  },
  {
    minX: -17.142500000000002,
    maxX: -8.472500000000002,
    minY: -21.625000000000004,
    maxY: -16.14,
  },
  {
    minX: -6.472500000000002,
    maxX: -1.4325000000000019,
    minY: -21.1875,
    maxY: -16.5775,
  },
  {
    minX: 7.497499999999999,
    maxX: 11.7425,
    minY: -21.485000000000003,
    maxY: -16.28,
  },
  {
    minX: 13.7425,
    maxX: 17.1425,
    minY: -20.5325,
    maxY: -17.2325,
  },
  {
    minX: 0.567499999999999,
    maxX: 5.497499999999999,
    minY: -23.384999999999998,
    maxY: -14.38,
  },
]

test("repro06 - rp2040 schematic sections", async () => {
  const lines = calculateCellBoundaries(cellContents)

  expect(lines).toHaveLength(9)
  await expect({ lines, cellContents }).toMatchCellBoundariesSnapshot(
    import.meta.path,
  )
})
