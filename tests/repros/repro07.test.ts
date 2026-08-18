import { expect, test } from "bun:test"
import { calculateCellBoundaries } from "../../lib"

// Exact SIGNALS-sheet section bounds from spi-display-webcam-interceptor.json
// after @tscircuit/core applies its 1-unit schematic section cell margin.
const cellContents = [
  {
    minX: -14.48,
    maxX: 1.75,
    minY: -9.5,
    maxY: 7.5,
  },
  {
    minX: 0.0125000000000002,
    maxX: 13.47,
    minY: -7.625,
    maxY: 9.35945535,
  },
]

test("repro07 - spi display webcam interceptor signals sheet", async () => {
  const lines = calculateCellBoundaries(cellContents)

  await expect({ lines, cellContents }).toMatchCellBoundariesSnapshot(
    import.meta.path,
  )
})
