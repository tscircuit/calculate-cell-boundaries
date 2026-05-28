import { test, expect } from "bun:test"
import { calculateCellBoundaries } from "../lib"

const scene = {
  cellContents: [
    {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100,
    },
    {
      minX: 200,
      minY: 75,
      maxX: 300,
      maxY: 175,
    },
  ],
}

test("test05", async () => {
  const lines = calculateCellBoundaries(scene.cellContents)
  await expect({
    lines,
    cellContents: scene.cellContents,
  }).toMatchCellBoundariesSnapshot(import.meta.path)
  expect(lines).toEqual([
    {
      start: {
        x: 150,
        y: 0,
      },
      end: {
        x: 150,
        y: 175,
      },
    },
  ])
})
