import { test, expect } from "bun:test"
import { calculateCellBoundaries } from "../../lib"

const scene = {
  cellContents: [
    {
      minX: -14.4075,
      maxX: -9.5925,
      minY: 2.0599999999999996,
      maxY: 13.940000000000001,
    },
    {
      minX: -16.765,
      maxX: -3.535000000000001,
      minY: -4.25,
      maxY: 1.4249999999999996,
    },
    {
      minX: -2.4649999999999994,
      maxX: 2.4650000000000003,
      minY: 5.15,
      maxY: 9.55,
    },
    {
      minX: 7.85,
      maxX: 14,
      minY: 4.175000000000001,
      maxY: 10.25,
    },
    {
      minX: -3.2,
      maxX: 4.749999999999999,
      minY: -3.5944553499999983,
      maxY: 2,
    },
    {
      minX: 8.049999999999999,
      maxX: 13.185,
      minY: -1.4944553500000002,
      maxY: 1.8944553499999988,
    },
    {
      minX: -2.95,
      maxX: 2.1225,
      minY: -9.9,
      maxY: -5.40554465,
    },
    {
      minX: 9.5,
      maxX: 12.899999999999999,
      minY: -10.05,
      maxY: -6.75,
    },
    {
      minX: -14.2325,
      maxX: -7.1675,
      minY: -11.4,
      maxY: -6.6,
    },
  ],
}

test("repro02", async () => {
  const lines = calculateCellBoundaries(scene.cellContents)
  await expect({
    lines,
    cellContents: scene.cellContents,
  }).toMatchCellBoundariesSnapshot(import.meta.path)
})
