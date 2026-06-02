import { test, expect } from "bun:test"
import { calculateCellBoundaries } from "../lib"

const scene = {
  cellContents: [
    { minX: 205, minY: 185, maxX: 315, maxY: 295 },
    { minX: 190, minY: 350, maxX: 330, maxY: 455 },
    { minX: 45, minY: 210, maxX: 150, maxY: 285 },
    { minX: 365, minY: 190, maxX: 455, maxY: 310 },
    { minX: 210, minY: 40, maxX: 290, maxY: 155 },
    { minX: 35, minY: 55, maxX: 155, maxY: 145 },
    { minX: 345, minY: 45, maxX: 465, maxY: 160 },
    { minX: 55, minY: 345, maxX: 160, maxY: 465 },
    { minX: 350, minY: 360, maxX: 470, maxY: 450 },
    { minX: 500, minY: 115, maxX: 615, maxY: 235 },
    { minX: 490, minY: 310, maxX: 605, maxY: 390 },
    { minX: 660, minY: 190, maxX: 745, maxY: 315 },
  ],
}

test(
  "test14",
  async () => {
    const lines = calculateCellBoundaries(scene.cellContents)
    await expect({
      lines,
      cellContents: scene.cellContents,
    }).toMatchCellBoundariesSnapshot(import.meta.path)
  },
  {
    timeout: 15000,
  },
)
