import type { CellContent, Point } from "./types"

export const POINT_COMPARISON_TOLERANCE = 0.001

export const pointsEqual = (
  p1: Point,
  p2: Point,
  tolerance: number = POINT_COMPARISON_TOLERANCE,
): boolean =>
  Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance

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
