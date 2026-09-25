import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../../lib"
import input from "./air-mouse-usb-charger.input.json"

// Exact SchematicSection input from core's Air Mouse shared-GND repro.
// Order: USB, charger, regulator, controller, motion sensor, interface.
test("Air Mouse USB/charger divider reaches the top boundary", async () => {
  const { cellContents, options } = input
  const lines = calculateCellBoundaries(cellContents, options)
  expect(lines).toContainEqual({
    start: { x: expect.closeTo(-9.675), y: expect.closeTo(1.11) },
    end: { x: expect.closeTo(-9.675), y: expect.closeTo(7.925) },
  })
  await expect({ cellContents, lines }).toMatchCellBoundariesSnapshot(
    import.meta.path,
  )
})
