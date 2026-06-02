import { test, expect } from "bun:test"
import { calculateCellBoundaries } from "../../lib"

const scene = {
  cellContents: [
    { minX: 112, maxX: 208, minY: 321, maxY: 559 },
    { minX: 65, maxX: 329, minY: 195, maxY: 309 },
    { minX: 351, maxX: 449, minY: 383, maxY: 471 },
    { minX: 557, maxX: 680, minY: 364, maxY: 485 },
    { minX: 336, maxX: 495, minY: 208, maxY: 320 },
    { minX: 561, maxX: 664, minY: 250, maxY: 318 },
    { minX: 341, maxX: 442, minY: 82, maxY: 172 },
    { minX: 590, maxX: 658, minY: 79, maxY: 145 },
    { minX: 115, maxX: 257, minY: 52, maxY: 148 },
  ],
}

test("repro01", async () => {
  const lines = calculateCellBoundaries(scene.cellContents)
  await expect({
    lines,
    cellContents: scene.cellContents,
  }).toMatchCellBoundariesSnapshot(import.meta.path)
})
