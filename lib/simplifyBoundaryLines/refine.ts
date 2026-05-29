import type { Line, CellContent } from "../types"
import {
  TOL,
  lineContainsPoint,
  isZeroLength,
  endpointOnLineAtY,
  endpointOnLineAtX,
  lineOtherEndpoint,
  candidateIsValid,
} from "./primitives"
import { sharedCellRegionCount, separatedCellPairs } from "./cellUtils"
import { connectDanglingEndpoints } from "./connectDanglingEndpoints"
import { trimDanglingOverhangs } from "./trimDanglingOverhangs"
import { mergeAlignedSegments } from "../mergeAlignedSegments"

// --- collapseSteps (vertical doglegs + horizontal steps) ---

const collapseVerticalDoglegs = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
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
          if (!lineContainsPoint(horizontal, { x: second.start.x, y })) continue

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

const collapseHorizontalSteps = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let collapsed = lines
  let changed = true

  while (changed) {
    changed = false
    const currentShared = sharedCellRegionCount(collapsed, cellContents)

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

          if (!endpointOnLineAtX(second, x)) continue
          if (!lineContainsPoint(vertical, { x, y: second.start.y })) continue

          if (Math.abs(first.start.y - second.start.y) < TOL) continue

          for (const [stepH, otherH] of [
            [first, second],
            [second, first],
          ] as const) {
            const vStepName = endpointOnLineAtY(vertical, stepH.start.y)
            if (!vStepName) continue

            const stepHEndpointName = endpointOnLineAtX(stepH, x)
            const otherHEndpointName = endpointOnLineAtX(otherH, x)
            if (!stepHEndpointName || !otherHEndpointName) continue

            const stepOther = lineOtherEndpoint(stepH, stepHEndpointName)
            const otherOther = lineOtherEndpoint(otherH, otherHEndpointName)
            if ((stepOther.x - x) * (otherOther.x - x) >= -TOL) continue

            const vFarEndpoint = lineOtherEndpoint(vertical, vStepName)

            for (const targetY of [stepH.start.y, otherH.start.y]) {
              const mergedH = {
                start: {
                  x: Math.min(stepOther.x, otherOther.x),
                  y: targetY,
                },
                end: {
                  x: Math.max(stepOther.x, otherOther.x),
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

const collapseSteps = (lines: Line[], cellContents: CellContent[]): Line[] =>
  collapseHorizontalSteps(
    collapseVerticalDoglegs(lines, cellContents),
    cellContents,
  )

// --- refine phase ---

export const refine = (lines: Line[], cellContents: CellContent[]): Line[] => {
  const connected = connectDanglingEndpoints(lines, cellContents, {
    preserveOriginalSpan: true,
  })
  const collapsed = collapseSteps(connected, cellContents)
  const finalConnected = connectDanglingEndpoints(collapsed, cellContents, {
    preserveOriginalSpan: true,
  })
  return trimDanglingOverhangs(
    finalConnected,
    cellContents,
    separatedCellPairs(finalConnected, cellContents),
  )
}
