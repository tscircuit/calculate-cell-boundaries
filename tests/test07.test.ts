import { test, expect } from "bun:test"
import { calculateCellBoundaries } from "../lib"

const scene = {
  cellContents: [
    {
      minX: 100,
      minY: 75,
      maxX: 200,
      maxY: 175,
    },
    {
      minX: 400,
      minY: 200,
      maxX: 500,
      maxY: 300,
    },
    {
      minX: 250,
      minY: 150,
      maxX: 350,
      maxY: 250,
    },
  ],
}

test("test07", async () => {
  const lines = calculateCellBoundaries(scene.cellContents)
  await expect({
    lines,
    cellContents: scene.cellContents,
  }).toMatchCellBoundariesSnapshot(import.meta.path)
  expect(lines).toEqual([
    {
      start: {
        x: 225,
        y: 75,
      },
      end: {
        x: 225,
        y: 300,
      },
    },
    {
      start: {
        x: 375,
        y: 75,
      },
      end: {
        x: 375,
        y: 300,
      },
    },
  ])
})
