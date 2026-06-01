import type { CellContent, Line, Point } from "./types"

export const pairs = <T>(arr: T[]): [T, T][] => {
  const result: [T, T][] = []
  for (let i = 0; i + 1 < arr.length; i++) {
    const a = arr[i]
    const b = arr[i + 1]
    if (a !== undefined && b !== undefined) result.push([a, b])
  }
  return result
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
  const rectEdges: Line[] = [
    { start: { x, y }, end: { x: x + width, y } },
    { start: { x: x + width, y }, end: { x: x + width, y: y + height } },
    { start: { x: x + width, y: y + height }, end: { x, y: y + height } },
    { start: { x, y: y + height }, end: { x, y } },
  ]
  for (const edge of rectEdges) {
    if (lineSegmentIntersection(lineStart, lineEnd, edge.start, edge.end))
      return true
  }
  return false
}

export const rectsOverlap = (a: CellContent, b: CellContent) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y
