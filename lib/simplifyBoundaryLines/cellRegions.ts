import type { Line, CellContent } from "../types"
import { TOL, cellCenter } from "./primitives"

export const axisValues = (lines: Line[], cellContents: CellContent[]) => {
  const xs = new Set<number>()
  const ys = new Set<number>()

  for (const cell of cellContents) {
    xs.add(cell.minX)
    xs.add(cell.maxX)
    xs.add(cellCenter(cell).x)
    ys.add(cell.minY)
    ys.add(cell.maxY)
    ys.add(cellCenter(cell).y)
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

const intervalBlockedByVerticalLine = (
  lines: Line[],
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

const intervalBlockedByHorizontalLine = (
  lines: Line[],
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

const cellRegionComponents = (lines: Line[], cellContents: CellContent[]) => {
  const { xs, ys } = axisValues(lines, cellContents)
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
          if (
            next.x < 0 ||
            next.x >= xCount ||
            next.y < 0 ||
            next.y >= yCount
          ) {
            continue
          }

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
            ) {
              continue
            }
            blocked = intervalBlockedByVerticalLine(
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
            ) {
              continue
            }
            blocked = intervalBlockedByHorizontalLine(
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
    const center = cellCenter(cell)
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

export const sharedCellRegionCount = (
  lines: Line[],
  cellContents: CellContent[],
) => {
  const components = cellRegionComponents(lines, cellContents)
  let shared = 0

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      if (components[i] === components[j]) shared++
    }
  }

  return shared
}
