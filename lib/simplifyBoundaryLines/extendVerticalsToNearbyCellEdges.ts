import type { Line, CellContent } from "../types"
import {
  TOL,
  pointKey,
  lineContainsPoint,
  lineWithEndpoint,
  pointDegrees,
} from "./primitives"
import { candidateIsValid } from "./validation"

export const extendVerticalsToNearbyCellEdges = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let extended = lines
  let changed = true

  while (changed) {
    changed = false
    const degrees = pointDegrees(extended)

    for (let i = 0; i < extended.length; i++) {
      const line = extended[i]
      if (!line || Math.abs(line.start.x - line.end.x) >= TOL) continue

      for (const endpointName of ["start", "end"] as const) {
        const endpoint = line[endpointName]
        if (degrees.get(pointKey(endpoint)) !== 1) continue

        const edgeY = cellContents
          .flatMap((cell) =>
            endpoint.x > cell.minX + TOL && endpoint.x < cell.maxX - TOL
              ? [cell.minY, cell.maxY]
              : [],
          )
          .filter((y) => {
            const distance = Math.abs(y - endpoint.y)
            return distance > TOL && distance <= 15
          })
          .sort(
            (a, b) =>
              Math.abs(a - endpoint.y) - Math.abs(b - endpoint.y) || a - b,
          )
          .at(0)
        if (edgeY === undefined) continue

        const candidateLine = lineWithEndpoint(line, endpointName, {
          x: endpoint.x,
          y: edgeY,
        })
        if (!lineContainsPoint(candidateLine, endpoint)) continue
        if (!candidateIsValid([candidateLine], cellContents)) continue

        extended = extended.map((item, index) =>
          index === i ? candidateLine : item,
        )
        changed = true
        break
      }

      if (changed) break
    }
  }

  return extended
}
