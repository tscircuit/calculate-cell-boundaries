import type { CellContent, Point } from "./types"

export const pairs = <T>(arr: T[]): [T, T][] => {
  const result: [T, T][] = []
  for (let i = 0; i + 1 < arr.length; i++) {
    const a = arr[i]
    const b = arr[i + 1]
    if (a !== undefined && b !== undefined) result.push([a, b])
  }
  return result
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
    minDistance = Math.min(minDistance, distanceToCell(point, cell))
  }
  return minDistance
}

export const segmentDistanceToAnyCell = (
  start: Point,
  end: Point,
  cells: CellContent[],
): number =>
  Math.min(...cells.map((cell) => distanceFromSegmentToCell(start, end, cell)))
