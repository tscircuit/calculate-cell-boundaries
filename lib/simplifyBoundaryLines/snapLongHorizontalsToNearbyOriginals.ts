import type { Line, CellContent } from "../types"
import { TOL, pathLength } from "./primitives"
import { candidateIsValid } from "./validation"
import { sharedCellRegionCount } from "./cellRegions"
import { connectDanglingEndpoints } from "./connectDanglingEndpoints"

export const snapLongHorizontalsToNearbyOriginals = (
  lines: Line[],
  originalLines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let snapped = lines
  const originalYLengths = new Map<number, number>()
  for (const line of originalLines) {
    if (Math.abs(line.start.y - line.end.y) >= TOL) continue
    originalYLengths.set(
      line.start.y,
      (originalYLengths.get(line.start.y) ?? 0) + pathLength([line]),
    )
  }

  for (let i = 0; i < snapped.length; i++) {
    const line = snapped[i]
    if (!line || Math.abs(line.start.y - line.end.y) >= TOL) continue
    if (pathLength([line]) < 500) continue

    const currentY = line.start.y
    const candidateY = [...originalYLengths]
      .filter(([y]) => y < currentY - TOL && currentY - y <= 15)
      .sort(
        (a, b) =>
          b[1] - a[1] || Math.abs(currentY - a[0]) - Math.abs(currentY - b[0]),
      )
      .map(([y]) => y)
      .at(0)
    if (candidateY === undefined) continue

    const candidateLine = {
      start: { x: line.start.x, y: candidateY },
      end: { x: line.end.x, y: candidateY },
    }
    if (!candidateIsValid([candidateLine], cellContents)) continue

    const candidate = snapped.map((item, index) =>
      index === i ? candidateLine : item,
    )
    const connectedCandidate = connectDanglingEndpoints(
      candidate,
      cellContents,
      {
        preserveOriginalSpan: true,
      },
    )
    if (!candidateIsValid(connectedCandidate, cellContents)) continue
    if (
      sharedCellRegionCount(connectedCandidate, cellContents) >
      sharedCellRegionCount(snapped, cellContents)
    ) {
      continue
    }

    snapped = connectedCandidate
  }

  return snapped
}
