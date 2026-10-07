import { expect, test } from "bun:test"
import type {
  InputRect,
  Line as BLine,
} from "../lib/solvers/RepairBoundaryLinesSolver/types"
import { sharedCellRegionCount as repairSharedCellRegionCount } from "../lib/solvers/RepairBoundaryLinesSolver/geometry"
import { sharedCellRegionCount as refineSharedCellRegionCount } from "../lib/solvers/RefineBoundaryLinesSolver/geometry"

const TOL = 0.001

// ---------------------------------------------------------------------------
// Independent reference implementation of the region flood fill as it existed
// before the grid-edge barriers were precomputed. It rescans the full wall
// list for every tile edge. The optimized modules must agree with it exactly.
// ---------------------------------------------------------------------------

const referenceCellCenter = (cell: InputRect) => ({
  x: (cell.minX + cell.maxX) / 2,
  y: (cell.minY + cell.maxY) / 2,
})

const referenceAxisValues = (lines: BLine[], cellContents: InputRect[]) => {
  const xs = new Set<number>()
  const ys = new Set<number>()
  for (const cell of cellContents) {
    xs.add(cell.minX)
    xs.add(cell.maxX)
    xs.add(referenceCellCenter(cell).x)
    ys.add(cell.minY)
    ys.add(cell.maxY)
    ys.add(referenceCellCenter(cell).y)
  }
  for (const line of lines) {
    xs.add(line.start.x)
    xs.add(line.end.x)
    ys.add(line.start.y)
    ys.add(line.end.y)
  }
  return {
    xs: [...xs].sort((a, b) => a - b),
    ys: [...ys].sort((a, b) => a - b),
  }
}

const referenceBlockedByVerticalLine = (
  lines: BLine[],
  x: number,
  yMin: number,
  yMax: number,
) =>
  lines.some((line) => {
    if (Math.abs(line.start.x - line.end.x) >= TOL) return false
    if (Math.abs(line.start.x - x) >= TOL) return false
    const lineYMin = Math.min(line.start.y, line.end.y)
    const lineYMax = Math.max(line.start.y, line.end.y)
    return yMin >= lineYMin - TOL && yMax <= lineYMax + TOL
  })

const referenceBlockedByHorizontalLine = (
  lines: BLine[],
  y: number,
  xMin: number,
  xMax: number,
) =>
  lines.some((line) => {
    if (Math.abs(line.start.y - line.end.y) >= TOL) return false
    if (Math.abs(line.start.y - y) >= TOL) return false
    const lineXMin = Math.min(line.start.x, line.end.x)
    const lineXMax = Math.max(line.start.x, line.end.x)
    return xMin >= lineXMin - TOL && xMax <= lineXMax + TOL
  })

const referenceCellRegionComponents = (
  lines: BLine[],
  cellContents: InputRect[],
) => {
  const { xs, ys } = referenceAxisValues(lines, cellContents)
  const xCount = xs.length - 1
  const yCount = ys.length - 1
  const componentByTile = new Map<string, number>()
  const tileKey = (xIndex: number, yIndex: number) => `${xIndex}:${yIndex}`
  let componentId = 0
  for (let startX = 0; startX < xCount; startX++) {
    for (let startY = 0; startY < yCount; startY++) {
      const startKey = tileKey(startX, startY)
      if (componentByTile.has(startKey)) continue
      const stack = [{ x: startX, y: startY }]
      componentByTile.set(startKey, componentId)
      while (stack.length > 0) {
        const current = stack.pop()
        if (!current) continue
        const neighbours = [
          { x: current.x - 1, y: current.y },
          { x: current.x + 1, y: current.y },
          { x: current.x, y: current.y - 1 },
          { x: current.x, y: current.y + 1 },
        ]
        for (const next of neighbours) {
          if (next.x < 0 || next.x >= xCount || next.y < 0 || next.y >= yCount)
            continue
          const nextKey = tileKey(next.x, next.y)
          if (componentByTile.has(nextKey)) continue
          let blocked = false
          if (next.x !== current.x) {
            const boundaryX = xs[Math.max(next.x, current.x)]
            const yMin = ys[current.y]
            const yMax = ys[current.y + 1]
            if (
              boundaryX === undefined ||
              yMin === undefined ||
              yMax === undefined
            )
              continue
            blocked = referenceBlockedByVerticalLine(
              lines,
              boundaryX,
              yMin,
              yMax,
            )
          } else {
            const boundaryY = ys[Math.max(next.y, current.y)]
            const xMin = xs[current.x]
            const xMax = xs[current.x + 1]
            if (
              boundaryY === undefined ||
              xMin === undefined ||
              xMax === undefined
            )
              continue
            blocked = referenceBlockedByHorizontalLine(
              lines,
              boundaryY,
              xMin,
              xMax,
            )
          }
          if (blocked) continue
          componentByTile.set(nextKey, componentId)
          stack.push(next)
        }
      }
      componentId++
    }
  }
  return cellContents.map((cell) => {
    const center = referenceCellCenter(cell)
    const xIndex = xs.findIndex(
      (x, index) =>
        index + 1 < xs.length &&
        center.x >= x - TOL &&
        center.x <= (xs[index + 1] ?? x) + TOL,
    )
    const yIndex = ys.findIndex(
      (y, index) =>
        index + 1 < ys.length &&
        center.y >= y - TOL &&
        center.y <= (ys[index + 1] ?? y) + TOL,
    )
    return componentByTile.get(tileKey(xIndex, yIndex)) ?? -1
  })
}

const referenceSharedCellRegionCount = (
  lines: BLine[],
  cellContents: InputRect[],
) => {
  const components = referenceCellRegionComponents(lines, cellContents)
  let shared = 0
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      if (components[i] === components[j]) shared++
    }
  }
  return shared
}

// ---------------------------------------------------------------------------
// Deterministic layout generator (no Math.random so failures reproduce).
// ---------------------------------------------------------------------------

const makeRng = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state / 2147483648
  }
}

const generateLayout = (seed: number, gridN: number) => {
  const rng = makeRng(seed)
  const cells: InputRect[] = []
  const size = 10
  const gap = 2
  const jitter = () => (rng() - 0.5) * 0.3
  for (let i = 0; i < gridN; i++) {
    for (let j = 0; j < gridN; j++) {
      const x0 = j * (size + gap)
      const y0 = i * (size + gap)
      cells.push({
        minX: x0 + jitter(),
        minY: y0 + jitter(),
        maxX: x0 + size + jitter(),
        maxY: y0 + size + jitter(),
      })
    }
  }
  const lines: BLine[] = []
  const wallKinds = [
    "none",
    "full",
    "partial-low",
    "partial-high",
    "split",
    "tiny-offset",
    "off-grid",
  ] as const
  for (let i = 0; i < gridN; i++) {
    for (let j = 0; j < gridN - 1; j++) {
      const x = j * (size + gap) + size + gap / 2
      const y0 = i * (size + gap) - gap / 2
      const y1 = y0 + size + gap
      const kind = wallKinds[Math.floor(rng() * wallKinds.length)] as
        | (typeof wallKinds)[number]
        | undefined
      if (!kind || kind === "none") continue
      let yA = y0
      let yB = y1
      if (kind === "partial-low") yB = y0 + (y1 - y0) * 0.55
      if (kind === "partial-high") yA = y1 - (y1 - y0) * 0.55
      if (kind === "split") {
        // Two partial walls that jointly span the edge but neither covers
        // every tile row on its own.
        lines.push({
          start: { x, y: y0 },
          end: { x, y: y0 + (y1 - y0) * 0.6 },
        })
        lines.push({
          start: { x, y: y1 },
          end: { x, y: y0 + (y1 - y0) * 0.4 },
        })
        continue
      }
      let wallX = x
      if (kind === "tiny-offset") wallX = x + (rng() < 0.5 ? -0.0005 : 0.0005)
      if (kind === "off-grid") wallX = x + (rng() - 0.5) * 0.02
      lines.push({
        start: { x: wallX, y: rng() < 0.5 ? yA : yB },
        end: { x: wallX, y: rng() < 0.5 ? yB : yA },
      })
    }
  }
  for (let i = 0; i < gridN - 1; i++) {
    for (let j = 0; j < gridN; j++) {
      const y = i * (size + gap) + size + gap / 2
      const x0 = j * (size + gap) - gap / 2
      const x1 = x0 + size + gap
      const kind = wallKinds[Math.floor(rng() * wallKinds.length)] as
        | (typeof wallKinds)[number]
        | undefined
      if (!kind || kind === "none") continue
      let xA = x0
      let xB = x1
      if (kind === "partial-low") xB = x0 + (x1 - x0) * 0.55
      if (kind === "partial-high") xA = x1 - (x1 - x0) * 0.55
      let wallY = y
      if (kind === "tiny-offset") wallY = y + (rng() < 0.5 ? -0.0005 : 0.0005)
      if (kind === "off-grid") wallY = y + (rng() - 0.5) * 0.02
      lines.push({
        start: { x: rng() < 0.5 ? xA : xB, y: wallY },
        end: { x: rng() < 0.5 ? xB : xA, y: wallY },
      })
    }
  }
  // A few zero-length lines to pin down degenerate handling.
  if (rng() < 0.5) {
    lines.push({
      start: { x: size + gap / 2, y: size / 2 },
      end: { x: size + gap / 2, y: size / 2 },
    })
  }
  return { cells, lines }
}

// ---------------------------------------------------------------------------

test("no walls put every cell in one shared region", () => {
  const cells: InputRect[] = [
    { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    { minX: 12, minY: 0, maxX: 22, maxY: 10 },
    { minX: 0, minY: 12, maxX: 10, maxY: 22 },
  ]
  expect(repairSharedCellRegionCount([], cells)).toBe(3)
  expect(refineSharedCellRegionCount([], cells)).toBe(3)
})

test("a full wall separates its cell pair, a partial wall does not", () => {
  const cells: InputRect[] = [
    { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    { minX: 12, minY: 0, maxX: 22, maxY: 10 },
  ]
  const fullWall: BLine[] = [{ start: { x: 11, y: -1 }, end: { x: 11, y: 11 } }]
  const partialWall: BLine[] = [
    { start: { x: 11, y: -1 }, end: { x: 11, y: 5 } },
  ]
  expect(repairSharedCellRegionCount(fullWall, cells)).toBe(0)
  expect(repairSharedCellRegionCount(partialWall, cells)).toBe(1)
  expect(refineSharedCellRegionCount(fullWall, cells)).toBe(0)
  expect(refineSharedCellRegionCount(partialWall, cells)).toBe(1)
})

test("matches the reference flood fill on deterministic random layouts", () => {
  const gridSizes = [1, 2, 3, 4, 5]
  let checked = 0
  for (let seed = 1; seed <= 40; seed++) {
    const gridN = gridSizes[seed % gridSizes.length] as number
    const { cells, lines } = generateLayout(seed, gridN)
    const expected = referenceSharedCellRegionCount(lines, cells)
    const repairActual = repairSharedCellRegionCount(lines, cells)
    const refineActual = refineSharedCellRegionCount(lines, cells)
    expect(repairActual).toBe(expected)
    expect(refineActual).toBe(expected)
    checked++
  }
  expect(checked).toBe(40)
})

test("tolerance edges behave identically to the reference", () => {
  const cells: InputRect[] = [
    { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    { minX: 12, minY: 0, maxX: 22, maxY: 10 },
  ]
  // Wall offsets from the x=11 boundary: inside TOL both ways, exactly at
  // TOL (not matching, strict comparison) and outside TOL.
  const offsets = [0.0005, -0.0005, 0.001, -0.001, 0.0015, -0.0015]
  for (const offset of offsets) {
    const lines: BLine[] = [
      { start: { x: 11 + offset, y: -1 }, end: { x: 11 + offset, y: 11 } },
    ]
    const expected = referenceSharedCellRegionCount(lines, cells)
    expect(repairSharedCellRegionCount(lines, cells)).toBe(expected)
    expect(refineSharedCellRegionCount(lines, cells)).toBe(expected)
  }
  // Wall intervals slightly shorter/longer than the tile row they cross.
  const yExtents = [-1, -0.999, -1.001, -0.5]
  for (const y0 of yExtents) {
    for (const y1 of [11, 10.999, 11.001, 10.5]) {
      const lines: BLine[] = [
        { start: { x: 11, y: y0 }, end: { x: 11, y: y1 } },
      ]
      const expected = referenceSharedCellRegionCount(lines, cells)
      expect(repairSharedCellRegionCount(lines, cells)).toBe(expected)
      expect(refineSharedCellRegionCount(lines, cells)).toBe(expected)
    }
  }
})

test("degenerate inputs match the reference", () => {
  const cells: InputRect[] = [
    { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    { minX: 12, minY: 0, maxX: 22, maxY: 10 },
  ]
  const cases: BLine[][] = [
    [],
    // Zero-length line on the cell boundary.
    [{ start: { x: 11, y: 5 }, end: { x: 11, y: 5 } }],
    // Reversed vertical segment.
    [{ start: { x: 11, y: 11 }, end: { x: 11, y: -1 } }],
    // Reversed horizontal segment.
    [{ start: { x: 22, y: 5 }, end: { x: 0, y: 5 } }],
    // Non-axis-aligned line (ignored as a barrier, still contributes axis
    // values through its endpoints).
    [{ start: { x: 1, y: 1 }, end: { x: 21, y: 9 } }],
    // Wall far from the cell grid.
    [{ start: { x: 100, y: 0 }, end: { x: 100, y: 20 } }],
  ]
  for (const lines of cases) {
    const expected = referenceSharedCellRegionCount(lines, cells)
    expect(repairSharedCellRegionCount(lines, cells)).toBe(expected)
    expect(refineSharedCellRegionCount(lines, cells)).toBe(expected)
  }
  expect(repairSharedCellRegionCount([], [])).toBe(0)
  expect(refineSharedCellRegionCount([], [])).toBe(0)
  expect(
    repairSharedCellRegionCount(
      [{ start: { x: 0, y: 0 }, end: { x: 5, y: 5 } }],
      [],
    ),
  ).toBe(0)
})

test("optimized region checks do not mutate their inputs", () => {
  const { cells, lines } = generateLayout(1234, 4)
  const cellsBefore = JSON.stringify(cells)
  const linesBefore = JSON.stringify(lines)
  repairSharedCellRegionCount(lines, cells)
  refineSharedCellRegionCount(lines, cells)
  expect(JSON.stringify(cells)).toBe(cellsBefore)
  expect(JSON.stringify(lines)).toBe(linesBefore)
})
