import type { Line, CellContent } from "./internalTypes"
import { lineIntersectsRectangle, pairs } from "./utils"
import { rectsOverlap } from "./rectUtils"

export const buildGrid = (
  allSegments: Line[],
  cellContents: CellContent[],
  containerWidth: number,
  containerHeight: number,
): {
  validSegments: Line[]
  cellContainingRects: CellContent[]
  gridRects: CellContent[]
} => {
  const validSegments = allSegments.filter((segment) => {
    return !cellContents.some((cell) => {
      return lineIntersectsRectangle(segment.start, segment.end, cell)
    })
  })

  const verticalXs = new Set<number>([0, containerWidth])
  const horizontalYs = new Set<number>([0, containerHeight])

  validSegments.forEach((seg) => {
    const isVertical = Math.abs(seg.start.x - seg.end.x) < 0.001
    if (isVertical) {
      verticalXs.add(seg.start.x)
    } else {
      horizontalYs.add(seg.start.y)
    }
  })

  const xs = Array.from(verticalXs).sort((a, b) => a - b)
  const ys = Array.from(horizontalYs).sort((a, b) => a - b)

  const cellContainingRectMap = new Map<string, CellContent>()
  const cellContainingRects: CellContent[] = []

  cellContents.forEach((cell) => {
    const minXGrid = xs.at(0) ?? 0
    const maxXGrid = xs.at(-1) ?? containerWidth
    const minYGrid = ys.at(0) ?? 0
    const maxYGrid = ys.at(-1) ?? containerHeight

    let left = xs.filter((v) => v <= cell.x).pop()
    if (left === undefined) left = minXGrid

    let right = xs.find((v) => v >= cell.x + cell.width)
    if (right === undefined) right = maxXGrid

    let top = ys.filter((v) => v <= cell.y).pop()
    if (top === undefined) top = minYGrid

    let bot = ys.find((v) => v >= cell.y + cell.height)
    if (bot === undefined) bot = maxYGrid

    const rect: CellContent = {
      cellId: `contain-${cell.cellId}`,
      x: left,
      y: top,
      width: Math.max(0, right - left),
      height: Math.max(0, bot - top),
    }
    cellContainingRectMap.set(cell.cellId, rect)
    cellContainingRects.push(rect)
  })

  const gridRects: CellContent[] = []
  let gridRectId = 0

  for (const [x0, x1] of pairs(xs)) {
    if (x1 - x0 <= 0) continue

    for (const [y0, y1] of pairs(ys)) {
      if (y1 - y0 <= 0) continue

      const candidate: CellContent = {
        cellId: `gridRect-${gridRectId++}`,
        x: x0,
        y: y0,
        width: x1 - x0,
        height: y1 - y0,
      }

      if (cellContents.some((c) => rectsOverlap(candidate, c))) continue

      gridRects.push(candidate)
    }
  }

  cellContainingRects.forEach((r) => {
    const key = `${r.x},${r.y},${r.width},${r.height}`
    if (
      !gridRects.some((g) => `${g.x},${g.y},${g.width},${g.height}` === key)
    ) {
      gridRects.push(r)
    }
  })

  return { validSegments, cellContainingRects, gridRects }
}
