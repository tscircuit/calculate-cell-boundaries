import {
  candidateIsValid,
  connectedComponentCount,
  endpointOnLineAtY,
  lineContainsPoint,
  lineOtherEndpoint,
  mergeAlignedSegments,
  separatedCellPairs,
  sharedCellRegionCount,
  TOL,
} from "./geometry"
import type { Line as BLine, InputRect } from "./types"

export const collapseVerticalDoglegs = (
  lines: BLine[],
  cellContents: InputRect[],
): BLine[] => {
  let collapsed = lines
  let changed = true

  const preservesSeparatedPairs = (candidate: BLine[]) => {
    const requiredPairs = separatedCellPairs(collapsed, cellContents)
    const candidatePairs = separatedCellPairs(candidate, cellContents)
    return [...requiredPairs].every((pair) => candidatePairs.has(pair))
  }

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
          if (!preservesSeparatedPairs(candidate)) continue
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

    if (changed) continue

    const currentComponents = connectedComponentCount(collapsed)

    for (let firstIndex = 0; firstIndex < collapsed.length; firstIndex++) {
      const first = collapsed[firstIndex]
      if (!first || Math.abs(first.start.x - first.end.x) >= TOL) continue

      for (
        let secondIndex = firstIndex + 1;
        secondIndex < collapsed.length;
        secondIndex++
      ) {
        const second = collapsed[secondIndex]
        if (!second || Math.abs(second.start.x - second.end.x) >= TOL) continue
        if (Math.abs(first.start.x - second.start.x) < TOL) continue

        const overlapMinY = Math.max(
          Math.min(first.start.y, first.end.y),
          Math.min(second.start.y, second.end.y),
        )
        const overlapMaxY = Math.min(
          Math.max(first.start.y, first.end.y),
          Math.max(second.start.y, second.end.y),
        )
        if (overlapMaxY - overlapMinY <= TOL) continue

        const hasHorizontalConnector = collapsed.some((line, index) => {
          if (index === firstIndex || index === secondIndex) return false
          if (Math.abs(line.start.y - line.end.y) >= TOL) return false
          const y = line.start.y
          if (y < overlapMinY - TOL || y > overlapMaxY + TOL) return false
          return (
            lineContainsPoint(line, { x: first.start.x, y }) &&
            lineContainsPoint(line, { x: second.start.x, y })
          )
        })
        if (!hasHorizontalConnector) continue

        const minY = Math.min(
          first.start.y,
          first.end.y,
          second.start.y,
          second.end.y,
        )
        const maxY = Math.max(
          first.start.y,
          first.end.y,
          second.start.y,
          second.end.y,
        )

        const candidateLines = [first.start.x, second.start.x]
          .map((x) => ({
            start: { x, y: minY },
            end: { x, y: maxY },
          }))
          .filter((line) => candidateIsValid([line], cellContents))

        for (const candidateLine of candidateLines) {
          let candidate = collapsed
            .filter((_, index) => index !== firstIndex && index !== secondIndex)
            .concat(candidateLine)
          if (!candidateIsValid(candidate, cellContents)) continue
          if (!preservesSeparatedPairs(candidate)) continue
          if (connectedComponentCount(candidate) > currentComponents) continue
          if (sharedCellRegionCount(candidate, cellContents) > currentShared) {
            continue
          }

          for (let connectorIndex = 0; connectorIndex < candidate.length; ) {
            const connector = candidate[connectorIndex]
            if (
              !connector ||
              Math.abs(connector.start.y - connector.end.y) >= TOL ||
              connector.start.y < overlapMinY - TOL ||
              connector.start.y > overlapMaxY + TOL ||
              !lineContainsPoint(connector, {
                x: first.start.x,
                y: connector.start.y,
              }) ||
              !lineContainsPoint(connector, {
                x: second.start.x,
                y: connector.start.y,
              })
            ) {
              connectorIndex++
              continue
            }

            const withoutConnector = candidate.filter(
              (_, index) => index !== connectorIndex,
            )
            if (
              candidateIsValid(withoutConnector, cellContents) &&
              preservesSeparatedPairs(withoutConnector) &&
              connectedComponentCount(withoutConnector) <= currentComponents &&
              sharedCellRegionCount(withoutConnector, cellContents) <=
                currentShared
            ) {
              candidate = withoutConnector
              continue
            }

            connectorIndex++
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
