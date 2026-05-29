import type { Line, Vec2, CellContent } from "../types"
import {
  TOL,
  pointKey,
  pointsEqual,
  lineContainsPoint,
  lineWithEndpoint,
  pointDegrees,
  pointOnAnyCellEdge,
  candidateIsValid,
} from "./primitives"
import {
  lineSeparatesCells,
  preservesSeparatedCellPairs,
  connectedComponentCount,
} from "./cellUtils"

const intersectionPointsOnLine = (line: Line, lines: Line[]) => {
  const points: Vec2[] = []
  const lineVertical = Math.abs(line.start.x - line.end.x) < TOL
  const lineHorizontal = Math.abs(line.start.y - line.end.y) < TOL

  for (const other of lines) {
    if (other === line) continue

    const otherVertical = Math.abs(other.start.x - other.end.x) < TOL
    const otherHorizontal = Math.abs(other.start.y - other.end.y) < TOL

    if (lineVertical && otherHorizontal) {
      const point = { x: line.start.x, y: other.start.y }
      if (lineContainsPoint(line, point) && lineContainsPoint(other, point)) {
        points.push(point)
      }
    }

    if (lineHorizontal && otherVertical) {
      const point = { x: other.start.x, y: line.start.y }
      if (lineContainsPoint(line, point) && lineContainsPoint(other, point)) {
        points.push(point)
      }
    }
  }

  return points
}

export const trimDanglingOverhangs = (
  lines: Line[],
  cellContents: CellContent[],
  requiredPairs?: Set<string>,
): Line[] => {
  let trimmed = lines
  let changed = true

  while (changed) {
    changed = false
    const degrees = pointDegrees(trimmed)
    const currentComponents = connectedComponentCount(trimmed)

    for (let lineIndex = 0; lineIndex < trimmed.length; lineIndex++) {
      const line = trimmed[lineIndex]
      if (!line) continue

      const intersections = intersectionPointsOnLine(line, trimmed).filter(
        (point) =>
          !pointsEqual(point, line.start) && !pointsEqual(point, line.end),
      )
      if (intersections.length === 0) continue

      for (const endpointName of ["start", "end"] as const) {
        const endpoint = line[endpointName]
        if (degrees.get(pointKey(endpoint)) !== 1) continue
        if (pointOnAnyCellEdge(endpoint, cellContents)) continue

        const nearest = intersections
          .map((point) => ({
            point,
            distance:
              Math.abs(point.x - endpoint.x) + Math.abs(point.y - endpoint.y),
          }))
          .sort((a, b) => a.distance - b.distance)
          .at(0)

        if (!nearest) continue

        const tail = { start: endpoint, end: nearest.point }
        if (lineSeparatesCells(tail, cellContents)) continue

        const candidateLine = lineWithEndpoint(
          line,
          endpointName,
          nearest.point,
        )
        if (!candidateIsValid([candidateLine], cellContents)) continue

        const candidate = trimmed.map((item, index) =>
          index === lineIndex ? candidateLine : item,
        )
        if (connectedComponentCount(candidate) > currentComponents) {
          continue
        }
        if (
          requiredPairs &&
          !preservesSeparatedCellPairs(candidate, cellContents, requiredPairs)
        ) {
          continue
        }

        trimmed = candidate
        changed = true
        break
      }

      if (changed) break
    }
  }

  return trimmed
}
