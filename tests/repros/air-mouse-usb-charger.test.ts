import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../../lib"
import input from "./air-mouse-usb-charger.input.json"

// Exact SchematicSection input from core's Air Mouse shared-GND repro.
// Order: USB, charger, regulator, controller, motion sensor, interface.
test("Air Mouse dividers reach the top and meet at a straight junction", async () => {
  const { cellContents, options } = input
  const lines = calculateCellBoundaries(cellContents, options)
  expect(lines).toContainEqual({
    start: { x: expect.closeTo(-9.675), y: expect.closeTo(1.11) },
    end: { x: expect.closeTo(-9.675), y: expect.closeTo(7.925) },
  })
  const horizontalLines = lines.filter((line) => line.start.y === line.end.y)
  expect(horizontalLines).toEqual([
    {
      start: { x: expect.closeTo(-15.7), y: expect.closeTo(1.11) },
      end: { x: expect.closeTo(13.45), y: expect.closeTo(1.11) },
    },
  ])
  expect(lines).toContainEqual({
    start: { x: expect.closeTo(6.675), y: expect.closeTo(-10.9) },
    end: { x: expect.closeTo(6.675), y: expect.closeTo(1.11) },
  })
  await expect({ cellContents, lines }).toMatchCellBoundariesSnapshot(
    import.meta.path,
  )
})
