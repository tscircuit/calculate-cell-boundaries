import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../../lib"

const cellContents = [
  {
    minX: -15.284999999999998,
    maxX: -9.295,
    minY: -7.686955349999999,
    maxY: -2.2369553499999983,
  },
  {
    minX: -7.295,
    maxX: 4.15,
    minY: -7.093455349999998,
    maxY: -2.8304553499999985,
  },
  {
    minX: 6.150000000000001,
    maxX: 15.285000000000002,
    minY: -9.423910699999997,
    maxY: -0.4999999999999989,
  },
  {
    minX: -16.24375,
    maxX: -3.5662499999999966,
    minY: -18.953910699999994,
    maxY: -14.343910699999995,
  },
  {
    minX: -1.566249999999999,
    maxX: 11.743749999999997,
    minY: -21.556410699999994,
    maxY: -11.741410699999996,
  },
  {
    minX: 13.831249999999999,
    maxX: 16.15625,
    minY: -21.873910699999996,
    maxY: -11.423910699999995,
  },
]

test("repro: boundary island seperated", async () => {
  const lines = calculateCellBoundaries(cellContents)
  const horizontalLines = lines.filter((line) => line.start.y === line.end.y)
  const rightmostVertical = lines
    .filter((line) => line.start.x === line.end.x)
    .toSorted((a, b) => b.start.x - a.start.x)[0]

  expect(horizontalLines).toHaveLength(1)
  expect(Math.max(rightmostVertical!.start.y, rightmostVertical!.end.y)).toBe(
    horizontalLines[0]!.start.y,
  )

  await expect({ lines, cellContents }).toMatchCellBoundariesSnapshot(
    import.meta.path,
  )
})
