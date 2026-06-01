import type { Point, CellContent, Midline } from "./types"
export type { Point, CellContent, Midline, Line, Intersection } from "./types"

export const POINT_COMPARISON_TOLERANCE = 0.001

export const pairs = <T>(arr: T[]): [T, T][] => {
  const result: [T, T][] = []
  for (let i = 0; i + 1 < arr.length; i++) {
    const a = arr[i]
    const b = arr[i + 1]
    if (a !== undefined && b !== undefined) result.push([a, b])
  }
  return result
}

export const pointsEqual = (
  p1: Point,
  p2: Point,
  tolerance: number = POINT_COMPARISON_TOLERANCE,
): boolean => {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance
}

export const lineIntersection = (
  line1: Midline,
  line2: Midline,
): Point | null => {
  const x1 = line1.start.x,
    y1 = line1.start.y
  const x2 = line1.end.x,
    y2 = line1.end.y
  const x3 = line2.start.x,
    y3 = line2.start.y
  const x4 = line2.end.x,
    y4 = line2.end.y

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 0.0001) return null

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    }
  }
  return null
}

const lineSegmentIntersection = (
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point,
): boolean => {
  const x1 = p1.x,
    y1 = p1.y
  const x2 = p2.x,
    y2 = p2.y
  const x3 = p3.x,
    y3 = p3.y
  const x4 = p4.x,
    y4 = p4.y

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (Math.abs(denom) < 0.0001) return false

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom

  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

export const lineIntersectsRectangle = (
  lineStart: Point,
  lineEnd: Point,
  rect: CellContent,
): boolean => {
  const { x, y, width, height } = rect
  const startInside =
    lineStart.x >= x &&
    lineStart.x <= x + width &&
    lineStart.y >= y &&
    lineStart.y <= y + height
  const endInside =
    lineEnd.x >= x &&
    lineEnd.x <= x + width &&
    lineEnd.y >= y &&
    lineEnd.y <= y + height

  if (startInside || endInside) return true

  const rectEdges = [
    { start: { x, y }, end: { x: x + width, y } },
    { start: { x: x + width, y }, end: { x: x + width, y: y + height } },
    { start: { x: x + width, y: y + height }, end: { x, y: y + height } },
    { start: { x, y: y + height }, end: { x, y } },
  ]

  for (const edge of rectEdges) {
    if (lineSegmentIntersection(lineStart, lineEnd, edge.start, edge.end)) {
      return true
    }
  }

  return false
}

const distanceToCell = (point: Point, cell: CellContent): number => {
  const closestX = Math.max(cell.x, Math.min(point.x, cell.x + cell.width))
  const closestY = Math.max(cell.y, Math.min(point.y, cell.y + cell.height))

  const dx = point.x - closestX
  const dy = point.y - closestY

  return Math.sqrt(dx * dx + dy * dy)
}

const distanceFromSegmentToCell = (
  start: Point,
  end: Point,
  cell: CellContent,
): number => {
  const numSamples = 10
  let minDistance = Infinity

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples
    const point = {
      x: start.x + t * (end.x - start.x),
      y: start.y + t * (end.y - start.y),
    }
    const distance = distanceToCell(point, cell)
    minDistance = Math.min(minDistance, distance)
  }

  return minDistance
}

export const segmentDistanceToAnyCell = (
  start: Point,
  end: Point,
  cells: CellContent[],
): number => {
  return Math.min(
    ...cells.map((cell) => distanceFromSegmentToCell(start, end, cell)),
  )
}

export const getSegmentKey = (p1: Point, p2: Point): string => {
  const p1x = parseFloat(p1.x.toFixed(4))
  const p1y = parseFloat(p1.y.toFixed(4))
  const p2x = parseFloat(p2.x.toFixed(4))
  const p2y = parseFloat(p2.y.toFixed(4))

  if (p1x < p2x || (p1x === p2x && p1y < p2y)) {
    return `${p1x},${p1y}_${p2x},${p2y}`
  } else {
    return `${p2x},${p2y}_${p1x},${p1y}`
  }
}

export const computeBoundsFromCellContents = (
  cellContents: { minX: number; minY: number; maxX: number; maxY: number }[],
) => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const cell of cellContents) {
    minX = Math.min(minX, cell.minX)
    minY = Math.min(minY, cell.minY)
    maxX = Math.max(maxX, cell.maxX)
    maxY = Math.max(maxY, cell.maxY)
  }

  return { minX, minY, maxX, maxY }
}

export const edgeToEdgeDistance = (a: CellContent, b: CellContent) => {
  const dx = Math.max(a.x - (b.x + b.width), b.x - (a.x + a.width), 0)
  const dy = Math.max(a.y - (b.y + b.height), b.y - (a.y + a.height), 0)
  return dx + dy
}

export const areAdjacent = (a: CellContent, b: CellContent, tol = 0.5) => {
  const shareVertical =
    (Math.abs(a.x + a.width - b.x) < tol ||
      Math.abs(b.x + b.width - a.x) < tol) &&
    !(a.y + a.height <= b.y || b.y + b.height <= a.y)

  const shareHorizontal =
    (Math.abs(a.y + a.height - b.y) < tol ||
      Math.abs(b.y + b.height - a.y) < tol) &&
    !(a.x + a.width <= b.x || b.x + b.width <= a.x)

  return shareVertical || shareHorizontal
}

export const rectsOverlap = (a: CellContent, b: CellContent) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y

const offsetPoint = (p: Point, offsetX: number, offsetY: number): Point => ({
  x: p.x + offsetX,
  y: p.y + offsetY,
})

export const offsetLine = <T extends { start: Point; end: Point }>(
  l: T,
  offsetX: number,
  offsetY: number,
): T => ({
  ...l,
  start: offsetPoint(l.start, offsetX, offsetY),
  end: offsetPoint(l.end, offsetX, offsetY),
})

export const offsetRect = (
  r: CellContent,
  offsetX: number,
  offsetY: number,
): CellContent => ({
  ...r,
  x: r.x + offsetX,
  y: r.y + offsetY,
})
