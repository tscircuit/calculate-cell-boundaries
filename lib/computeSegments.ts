import type { Midline, Intersection, Line, CellContent } from "./internalTypes"
import { segmentDistanceToAnyCell, pairs } from "./utils"

export const computeSegments = (
  midlines: Midline[],
  intersections: Intersection[],
  cellContents: CellContent[],
): Line[] => {
  const allSegments: Line[] = []
  let segmentId = 0

  midlines.forEach((midline) => {
    const midlineIntersections = intersections
      .filter((int) => int.midlineIds.includes(midline.id))
      .map((int) => int.point)
      .sort((a, b) => {
        if (midline.type === "vertical") {
          return a.y - b.y
        } else {
          return a.x - b.x
        }
      })

    const allPoints = [midline.start, ...midlineIntersections, midline.end]

    for (const [start, end] of pairs(allPoints)) {
      const segment: Line = {
        id: `segment-${segmentId++}`,
        start,
        end,
        fromCellIds: midline.cellIds,
        distanceToAnyCell: segmentDistanceToAnyCell(start, end, cellContents),
      }
      allSegments.push(segment)
    }
  })

  return allSegments
}
