import { test, expect } from "bun:test"
import { calculateCellBoundaries } from "../lib"

const scene = {
  cellContents: [
    {
      minX: 175,
      minY: 0,
      maxX: 275,
      maxY: 100,
    },
    {
      minX: 275,
      minY: 150,
      maxX: 375,
      maxY: 250,
    },
    {
      minX: 175,
      minY: 300,
      maxX: 275,
      maxY: 400,
    },
  ],
}

test("test11", async () => {
  const lines = calculateCellBoundaries(scene.cellContents)
  await expect({
    lines,
    cellContents: scene.cellContents,
  }).toMatchCellBoundariesSnapshot(import.meta.path)
  expect(lines).toEqual(
    [
      {
        start: {
          x: 175,
          y: 125,
        },
        end: {
          x: 375,
          y: 125,
        },
      },
      {
        start: {
          x: 175,
          y: 275,
        },
        end: {
          x: 375,
          y: 275,
        },
      },
    ].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
  )
})
