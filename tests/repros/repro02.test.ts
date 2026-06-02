import { test, expect } from "bun:test"
import { calculateCellBoundaries } from "../../lib"

const scene = {
  cellContents: [
    {
      minX: -14.7720915125,
      maxX: -9.957091512499998,
      minY: -12.38,
      maxY: -0.5,
    },
    {
      minX: 5.872091512499999,
      maxX: 14.772091512499998,
      minY: -10.0175,
      maxY: -2.8625,
    },
    {
      minX: -7.957091512499998,
      maxX: -3.637636162499999,
      minY: -9.145000000000001,
      maxY: -3.7350000000000003,
    },
    {
      minX: -1.6376361624999984,
      maxX: 3.872091512500001,
      minY: -8.78695535,
      maxY: -4.093044650000001,
    },
    {
      minX: -17.5825,
      maxX: -8.4725,
      minY: -21.086683025,
      maxY: -16.678316975,
    },
    {
      minX: -6.472499999999999,
      maxX: -0.9924999999999995,
      minY: -21.024183025,
      maxY: -16.740816975,
    },
    {
      minX: 7.9375,
      maxX: 12.182500000000001,
      minY: -21.37695535,
      maxY: -16.38804465,
    },
    {
      minX: 14.182500000000001,
      maxX: 17.5825,
      minY: -20.5325,
      maxY: -17.2325,
    },
    {
      minX: 1.0075000000000003,
      maxX: 5.937500000000001,
      minY: -23.384999999999998,
      maxY: -14.38,
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
