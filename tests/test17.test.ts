import { test, expect } from "bun:test"
import { calculateCellBoundaries } from "../lib"

// RP2040 schematic layout from dashed cell boundaries:
// Row 1: 3 equal columns
// Row 2: big box (left) | right col top (full width) / right col bottom (2 equal sections)
const scene = {
  cellContents: [
    { minX: 10, minY: 10, maxX: 250, maxY: 143 }, // row1 col1
    { minX: 270, minY: 10, maxX: 510, maxY: 143 }, // row1 col2
    { minX: 530, minY: 10, maxX: 770, maxY: 143 }, // row1 col3
    { minX: 10, minY: 163, maxX: 430, maxY: 510 }, // row2 big box
    { minX: 450, minY: 163, maxX: 770, maxY: 350 }, // row2 right-col top (full width)
    { minX: 450, minY: 370, maxX: 600, maxY: 510 }, // row2 right-col bottom sec1
    { minX: 620, minY: 370, maxX: 770, maxY: 510 }, // row2 right-col bottom sec2
  ],
}

test("test17", async () => {
  const lines = calculateCellBoundaries(scene.cellContents)
  await expect({
    lines,
    cellContents: scene.cellContents,
  }).toMatchCellBoundariesSnapshot(import.meta.path)
})
