import type { Line, Vec2, CellContent } from "../types"

export const TOL = 0.001

export const pointKey = (p: Vec2) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`

export const lineKey = (a: Vec2, b: Vec2) => {
  const ak = pointKey(a)
  const bk = pointKey(b)
  return ak < bk ? `${ak}_${bk}` : `${bk}_${ak}`
}

export const pointsEqual = (a: Vec2, b: Vec2) =>
  Math.abs(a.x - b.x) < TOL && Math.abs(a.y - b.y) < TOL

export const isZeroLength = (line: Line) => pointsEqual(line.start, line.end)

export const isAxisAligned = (line: Line) =>
  Math.abs(line.start.x - line.end.x) < TOL ||
  Math.abs(line.start.y - line.end.y) < TOL

export const rangesOverlap = (
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
) => Math.min(aMax, bMax) - Math.max(aMin, bMin) > TOL

export const pathLength = (lines: Line[]) =>
  lines.reduce(
    (total, line) =>
      total +
      Math.abs(line.start.x - line.end.x) +
      Math.abs(line.start.y - line.end.y),
    0,
  )

export const lineContainsPoint = (line: Line, point: Vec2) => {
  if (Math.abs(line.start.x - line.end.x) < TOL) {
    return (
      Math.abs(point.x - line.start.x) < TOL &&
      point.y >= Math.min(line.start.y, line.end.y) - TOL &&
      point.y <= Math.max(line.start.y, line.end.y) + TOL
    )
  }

  if (Math.abs(line.start.y - line.end.y) < TOL) {
    return (
      Math.abs(point.y - line.start.y) < TOL &&
      point.x >= Math.min(line.start.x, line.end.x) - TOL &&
      point.x <= Math.max(line.start.x, line.end.x) + TOL
    )
  }

  return false
}

export const lineWithEndpoint = (
  line: Line,
  endpoint: "start" | "end",
  point: Vec2,
) =>
  endpoint === "start"
    ? { start: point, end: line.end }
    : { start: line.start, end: point }

export const lineOtherEndpoint = (line: Line, endpoint: "start" | "end") =>
  endpoint === "start" ? line.end : line.start

export const cellCenter = (cell: CellContent): Vec2 => ({
  x: (cell.minX + cell.maxX) / 2,
  y: (cell.minY + cell.maxY) / 2,
})

export const valueBetween = (value: number, a: number, b: number) =>
  value > Math.min(a, b) + TOL && value < Math.max(a, b) - TOL

export const pointDegrees = (lines: Line[]) => {
  const degrees = new Map<string, number>()

  for (const line of lines) {
    degrees.set(
      pointKey(line.start),
      (degrees.get(pointKey(line.start)) ?? 0) + 1,
    )
    degrees.set(pointKey(line.end), (degrees.get(pointKey(line.end)) ?? 0) + 1)
  }

  return degrees
}

export const pointOnAnyCellEdge = (point: Vec2, cellContents: CellContent[]) =>
  cellContents.some((cell) => {
    const onVerticalEdge =
      (Math.abs(point.x - cell.minX) < TOL ||
        Math.abs(point.x - cell.maxX) < TOL) &&
      point.y >= cell.minY - TOL &&
      point.y <= cell.maxY + TOL
    const onHorizontalEdge =
      (Math.abs(point.y - cell.minY) < TOL ||
        Math.abs(point.y - cell.maxY) < TOL) &&
      point.x >= cell.minX - TOL &&
      point.x <= cell.maxX + TOL

    return onVerticalEdge || onHorizontalEdge
  })

export const endpointOnLineAtY = (line: Line, y: number) => {
  if (Math.abs(line.start.x - line.end.x) >= TOL) return undefined
  if (Math.abs(line.start.y - y) < TOL) return "start"
  if (Math.abs(line.end.y - y) < TOL) return "end"
  return undefined
}

export const endpointOnLineAtX = (line: Line, x: number) => {
  if (Math.abs(line.start.y - line.end.y) >= TOL) return undefined
  if (Math.abs(line.start.x - x) < TOL) return "start"
  if (Math.abs(line.end.x - x) < TOL) return "end"
  return undefined
}

const segmentCrossesRectInterior = (line: Line, rect: CellContent) => {
  const x1 = line.start.x
  const y1 = line.start.y
  const x2 = line.end.x
  const y2 = line.end.y

  if (Math.abs(x1 - x2) < TOL) {
    const yMin = Math.min(y1, y2)
    const yMax = Math.max(y1, y2)
    return (
      x1 > rect.minX + TOL &&
      x1 < rect.maxX - TOL &&
      yMax > rect.minY - TOL &&
      yMin < rect.maxY + TOL
    )
  }

  if (Math.abs(y1 - y2) < TOL) {
    const xMin = Math.min(x1, x2)
    const xMax = Math.max(x1, x2)
    return (
      y1 > rect.minY + TOL &&
      y1 < rect.maxY - TOL &&
      xMax > rect.minX + TOL &&
      xMin < rect.maxX - TOL
    )
  }

  return true
}

const segmentOverlapsRectEdge = (line: Line, rect: CellContent) => {
  const x1 = line.start.x
  const y1 = line.start.y
  const x2 = line.end.x
  const y2 = line.end.y

  if (Math.abs(x1 - x2) < TOL) {
    const yMin = Math.min(y1, y2)
    const yMax = Math.max(y1, y2)
    return (
      (Math.abs(x1 - rect.minX) < TOL || Math.abs(x1 - rect.maxX) < TOL) &&
      rangesOverlap(yMin, yMax, rect.minY, rect.maxY)
    )
  }

  if (Math.abs(y1 - y2) < TOL) {
    const xMin = Math.min(x1, x2)
    const xMax = Math.max(x1, x2)
    return (
      (Math.abs(y1 - rect.minY) < TOL || Math.abs(y1 - rect.maxY) < TOL) &&
      rangesOverlap(xMin, xMax, rect.minX, rect.maxX)
    )
  }

  return false
}

export const candidateIsValid = (lines: Line[], cellContents: CellContent[]) =>
  lines.length > 0 &&
  lines.every(
    (line) =>
      !isZeroLength(line) &&
      isAxisAligned(line) &&
      !cellContents.some(
        (rect) =>
          segmentCrossesRectInterior(line, rect) ||
          segmentOverlapsRectEdge(line, rect),
      ),
  )
