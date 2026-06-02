import type { Line as BLine, InputRect } from "./types"
import {
  TOL,
  isZeroLength,
  lineContainsPoint,
  lineOtherEndpoint,
  candidateIsValid,
  sharedCellRegionCount,
  mergeAlignedSegments,
  endpointOnLineAtX,
  endpointOnLineAtY,
  separatedCellPairs,
  preservesSeparatedCellPairs,
} from "./geometry"

export const collapseHorizontalSteps = (
  lines: BLine[],
  cellContents: InputRect[],
): BLine[] => {
  let collapsed = lines
  let changed = true

  while (changed) {
    changed = false
    const currentShared = sharedCellRegionCount(collapsed, cellContents)
    const requiredPairs = separatedCellPairs(collapsed, cellContents)

    for (
      let verticalIndex = 0;
      verticalIndex < collapsed.length;
      verticalIndex++
    ) {
      const vertical = collapsed[verticalIndex]
      if (!vertical || Math.abs(vertical.start.x - vertical.end.x) >= TOL) {
        continue
      }

      const x = vertical.start.x

      for (let firstIndex = 0; firstIndex < collapsed.length; firstIndex++) {
        if (firstIndex === verticalIndex) continue
        const first = collapsed[firstIndex]
        if (!first) continue

        if (!endpointOnLineAtX(first, x)) continue
        if (!lineContainsPoint(vertical, { x, y: first.start.y })) continue

        for (
          let secondIndex = firstIndex + 1;
          secondIndex < collapsed.length;
          secondIndex++
        ) {
          if (secondIndex === verticalIndex) continue
          const second = collapsed[secondIndex]
          if (!second) continue

          if (!lineContainsPoint(second, { x, y: second.start.y })) continue
          if (!lineContainsPoint(vertical, { x, y: second.start.y })) continue

          if (Math.abs(first.start.y - second.start.y) < TOL) continue

          for (const [stepH, otherH] of [
            [first, second],
            [second, first],
          ] as const) {
            const vStepName = endpointOnLineAtY(vertical, stepH.start.y)
            if (!vStepName) continue

            const stepEndpointName = endpointOnLineAtX(stepH, x)
            if (!stepEndpointName) continue

            const stepOther = lineOtherEndpoint(stepH, stepEndpointName)
            const otherMinX = Math.min(otherH.start.x, otherH.end.x)
            const otherMaxX = Math.max(otherH.start.x, otherH.end.x)
            if (stepOther.x < x - TOL && otherMaxX <= x + TOL) continue
            if (stepOther.x > x + TOL && otherMinX >= x - TOL) continue

            const vFarEndpoint = lineOtherEndpoint(vertical, vStepName)

            for (const targetY of [stepH.start.y, otherH.start.y]) {
              const mergedH = {
                start: {
                  x: Math.min(stepOther.x, otherMinX),
                  y: targetY,
                },
                end: {
                  x: Math.max(stepOther.x, otherMaxX),
                  y: targetY,
                },
              }
              if (!candidateIsValid([mergedH], cellContents)) continue

              const newV = { start: vFarEndpoint, end: { x, y: targetY } }
              if (isZeroLength(newV)) continue
              if (!candidateIsValid([newV], cellContents)) continue

              const candidate = collapsed
                .filter(
                  (_, index) =>
                    index !== firstIndex &&
                    index !== secondIndex &&
                    index !== verticalIndex,
                )
                .concat(mergedH, newV)
              if (!candidateIsValid(candidate, cellContents)) continue
              if (
                !preservesSeparatedCellPairs(
                  candidate,
                  cellContents,
                  requiredPairs,
                )
              ) {
                continue
              }
              if (
                sharedCellRegionCount(candidate, cellContents) > currentShared
              ) {
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

        if (changed) break
      }

      if (changed) break
    }
  }

  return collapsed
}
