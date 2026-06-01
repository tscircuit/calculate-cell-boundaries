import type { Point } from "./types"

export const POINT_COMPARISON_TOLERANCE = 0.001

export const getSegmentKey = (p1: Point, p2: Point): string => {
  const p1x = parseFloat(p1.x.toFixed(4))
  const p1y = parseFloat(p1.y.toFixed(4))
  const p2x = parseFloat(p2.x.toFixed(4))
  const p2y = parseFloat(p2.y.toFixed(4))
  if (p1x < p2x || (p1x === p2x && p1y < p2y))
    return `${p1x},${p1y}_${p2x},${p2y}`
  return `${p2x},${p2y}_${p1x},${p1y}`
}
