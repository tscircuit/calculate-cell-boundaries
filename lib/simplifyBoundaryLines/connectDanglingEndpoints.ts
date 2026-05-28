import type { Line, CellContent } from "../types"
import {
  TOL,
  pointKey,
  pointsEqual,
  lineContainsPoint,
  lineWithEndpoint,
  pathLength,
  pointDegrees,
} from "./primitives"
import { candidateIsValid } from "./validation"

export const connectDanglingEndpoints = (
  lines: Line[],
  cellContents: CellContent[],
  options?: { preserveOriginalSpan?: boolean },
): Line[] => {
  let connected = lines
  let changed = true

  while (changed) {
    changed = false
    const degrees = pointDegrees(connected)

    for (let lineIndex = 0; lineIndex < connected.length; lineIndex++) {
      const line = connected[lineIndex]
      if (!line) continue

      for (const endpointName of ["start", "end"] as const) {
        const endpoint = line[endpointName]
        if (degrees.get(pointKey(endpoint)) !== 1) continue

        const candidates: { x: number; y: number }[] = []
        const lineIsVertical = Math.abs(line.start.x - line.end.x) < TOL
        const lineIsHorizontal = Math.abs(line.start.y - line.end.y) < TOL

        for (let otherIndex = 0; otherIndex < connected.length; otherIndex++) {
          if (lineIndex === otherIndex) continue
          const other = connected[otherIndex]
          if (!other) continue

          if (lineIsVertical && Math.abs(other.start.y - other.end.y) < TOL) {
            const candidate = { x: line.start.x, y: other.start.y }
            if (lineContainsPoint(other, candidate)) candidates.push(candidate)
          }

          if (lineIsHorizontal && Math.abs(other.start.x - other.end.x) < TOL) {
            const candidate = { x: other.start.x, y: line.start.y }
            if (lineContainsPoint(other, candidate)) candidates.push(candidate)
          }
        }

        const bestCandidate = candidates
          .filter((candidate) => !pointsEqual(candidate, endpoint))
          .map((candidate) => ({
            point: candidate,
            line: lineWithEndpoint(line, endpointName, candidate),
          }))
          .filter(
            ({ line: candidateLine }) =>
              pathLength([candidateLine]) > pathLength([line]) + TOL,
          )
          .filter(
            ({ line: candidateLine }) =>
              !options?.preserveOriginalSpan ||
              lineContainsPoint(candidateLine, endpoint),
          )
          .filter(({ line }) => candidateIsValid([line], cellContents))
          .sort(
            (a, b) =>
              pathLength([a.line]) - pathLength([b.line]) ||
              JSON.stringify(a.point).localeCompare(JSON.stringify(b.point)),
          )
          .at(0)

        if (!bestCandidate) continue

        connected = connected.map((item, index) =>
          index === lineIndex ? bestCandidate.line : item,
        )
        changed = true
        break
      }

      if (changed) break
    }
  }

  return connected
}
