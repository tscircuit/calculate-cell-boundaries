import type { Midline, Intersection } from "./internalTypes"
import { lineIntersection } from "./utils"

export const computeIntersections = (midlines: Midline[]): Intersection[] => {
  const intersections: Intersection[] = []
  for (const [i, midlineA] of midlines.entries()) {
    for (const midlineB of midlines.slice(i + 1)) {
      const intersection = lineIntersection(midlineA, midlineB)
      if (intersection) {
        intersections.push({
          point: intersection,
          midlineIds: [midlineA.id, midlineB.id],
        })
      }
    }
  }
  return intersections
}
