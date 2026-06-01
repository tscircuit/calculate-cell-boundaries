import type { Line as BLine, InputRect } from "./types"
import {
  TOL,
  lineContainsPoint,
  lineOtherEndpoint,
  candidateIsValid,
  sharedCellRegionCount,
  mergeAlignedSegments,
  endpointOnLineAtY,
} from "./geometry"

export const collapseVerticalDoglegs = (
  lines: BLine[],
  cellContents: InputRect[],
): BLine[] => {
  let collapsed = lines
  let changed = true

  while (changed) {
    changed = false
    const currentShared = sharedCellRegionCount(collapsed, cellContents)

    for (
      let horizontalIndex = 0;
      horizontalIndex < collapsed.length;
      horizontalIndex++
    ) {
      const horizontal = collapsed[horizontalIndex]
      if (
        !horizontal ||
        Math.abs(horizontal.start.y - horizontal.end.y) >= TOL
      ) {
        continue
      }

      const y = horizontal.start.y

      for (let firstIndex = 0; firstIndex < collapsed.length; firstIndex++) {
        if (firstIndex === horizontalIndex) continue
        const first = collapsed[firstIndex]
        if (!first) continue

        const firstEndpointName = endpointOnLineAtY(first, y)
        if (!firstEndpointName) continue
        if (!lineContainsPoint(horizontal, { x: first.start.x, y })) continue

        for (
          let secondIndex = firstIndex + 1;
          secondIndex < collapsed.length;
          secondIndex++
        ) {
          if (secondIndex === horizontalIndex) continue
          const second = collapsed[secondIndex]
          if (!second) continue

          const secondEndpointName = endpointOnLineAtY(second, y)
          if (!secondEndpointName) continue
          if (!lineContainsPoint(horizontal, { x: second.start.x, y })) {
            continue
          }

          const firstOther = lineOtherEndpoint(first, firstEndpointName)
          const secondOther = lineOtherEndpoint(second, secondEndpointName)
          if ((firstOther.y - y) * (secondOther.y - y) >= -TOL) continue

          const x = (first.start.x + second.start.x) / 2
          const candidateLine = {
            start: { x, y: Math.min(firstOther.y, secondOther.y) },
            end: { x, y: Math.max(firstOther.y, secondOther.y) },
          }
          if (!candidateIsValid([candidateLine], cellContents)) continue

          const candidate = collapsed
            .filter((_, index) => index !== firstIndex && index !== secondIndex)
            .concat(candidateLine)
          if (!candidateIsValid(candidate, cellContents)) continue
          if (sharedCellRegionCount(candidate, cellContents) > currentShared) {
            continue
          }

          collapsed = mergeAlignedSegments(candidate)
          changed = true
          break
        }

        if (changed) break
      }

      if (changed) break
    }
  }

  return collapsed
}
