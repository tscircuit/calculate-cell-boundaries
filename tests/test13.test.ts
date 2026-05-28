import { test, expect } from "bun:test"
import { calculateCellBoundaries } from "../lib"

const scene = {
  cellContents: [
    { minX: 200, minY: 200, maxX: 300, maxY: 300 },
    { minX: 200, minY: 350, maxX: 300, maxY: 450 },
    { minX: 50, minY: 200, maxX: 150, maxY: 300 },
    { minX: 350, minY: 200, maxX: 450, maxY: 300 },
    { minX: 200, minY: 50, maxX: 300, maxY: 150 },
    { minX: 50, minY: 50, maxX: 150, maxY: 150 },
    { minX: 350, minY: 50, maxX: 450, maxY: 150 },
    { minX: 50, minY: 350, maxX: 150, maxY: 450 },
    { minX: 350, minY: 350, maxX: 450, maxY: 450 },
    { minX: 500, minY: 125, maxX: 600, maxY: 225 },
    { minX: 500, minY: 300, maxX: 600, maxY: 400 },
    { minX: 650, minY: 200, maxX: 750, maxY: 300 },
  ],
}

test("test13", async () => {
  const lines = calculateCellBoundaries(scene.cellContents)
  await expect({
    lines,
    cellContents: scene.cellContents,
  }).toMatchCellBoundariesSnapshot(import.meta.path)
})
