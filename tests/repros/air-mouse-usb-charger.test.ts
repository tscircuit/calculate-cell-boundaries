import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../../lib"
import input from "./air-mouse-usb-charger.input.json"

// Exact SchematicSection input from core's Air Mouse shared-GND repro.
// Order: USB, charger, regulator, controller, motion sensor, interface.
test("Air Mouse USB/charger divider collapses to a short stub", async () => {
  const { cellContents, options } = input
  const lines = calculateCellBoundaries(cellContents, options)
  await expect({ cellContents, lines }).toMatchCellBoundariesSnapshot(
    import.meta.path,
  )
})
