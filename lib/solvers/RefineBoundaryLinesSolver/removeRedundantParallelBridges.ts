import type { Line as BLine, InputRect } from "./types"
import {
  TOL,
  lineContainsPoint,
  candidateIsValid,
  connectedComponentCount,
  separatedCellPairs,
  preservesSeparatedCellPairs,
  pointsEqual,
  lineWithEndpoint,
} from "./geometry"

export const removeRedundantParallelBridges = (
  lines: BLine[],
  cellContents: InputRect[],
): BLine[] => {
  let reduced = lines
  let changed = true

  while (changed) {
    changed = false
    const currentComponents = connectedComponentCount(reduced)
    const requiredPairs = separatedCellPairs(reduced, cellContents)

    for (let bridgeIndex = 0; bridgeIndex < reduced.length; bridgeIndex++) {
      const bridge = reduced[bridgeIndex]
      if (!bridge) continue

      const bridgeIsHorizontal = Math.abs(bridge.start.y - bridge.end.y) < TOL
      const bridgeIsVertical = Math.abs(bridge.start.x - bridge.end.x) < TOL
      if (!bridgeIsHorizontal && !bridgeIsVertical) continue

      for (let spineIndex = 0; spineIndex < reduced.length; spineIndex++) {
        if (bridgeIndex === spineIndex) continue
        const spine = reduced[spineIndex]
        if (!spine) continue

        const spineIsHorizontal = Math.abs(spine.start.y - spine.end.y) < TOL
        const spineIsVertical = Math.abs(spine.start.x - spine.end.x) < TOL
        if (bridgeIsHorizontal !== spineIsHorizontal) continue
        if (bridgeIsVertical !== spineIsVertical) continue

        const bridgeEndpoints = [bridge.start, bridge.end]
        let attachmentPoints: { x: number; y: number }[]
        if (bridgeIsHorizontal) {
          attachmentPoints = bridgeEndpoints.map((p) => ({
            x: p.x,
            y: spine.start.y,
          }))
        } else {
          attachmentPoints = bridgeEndpoints.map((p) => ({
            x: spine.start.x,
            y: p.y,
          }))
        }

        if (
          !attachmentPoints.every((point) => lineContainsPoint(spine, point))
        ) {
          continue
        }

        const updates = new Map<number, BLine>()
        let canRemoveBridge = true

        for (let i = 0; i < bridgeEndpoints.length; i++) {
          const endpoint = bridgeEndpoints[i]
          const attachment = attachmentPoints[i]
          if (!endpoint || !attachment) {
            canRemoveBridge = false
            break
          }

          const connectorIndex = reduced.findIndex((line, index) => {
            if (index === bridgeIndex || index === spineIndex) return false
            const connectorIsHorizontal =
              Math.abs(line.start.y - line.end.y) < TOL
            const connectorIsVertical =
              Math.abs(line.start.x - line.end.x) < TOL
            return (
              ((bridgeIsHorizontal && connectorIsVertical) ||
                (bridgeIsVertical && connectorIsHorizontal)) &&
              lineContainsPoint(line, endpoint)
            )
          })

          if (connectorIndex === -1) continue

          const connector = reduced[connectorIndex]
          if (!connector) {
            canRemoveBridge = false
            break
          }

          const startMatches = pointsEqual(connector.start, endpoint)
          const endMatches = pointsEqual(connector.end, endpoint)
          if (
            !startMatches &&
            !endMatches &&
            lineContainsPoint(connector, attachment)
          ) {
            continue
          }

          if (!startMatches && !endMatches) {
            canRemoveBridge = false
            break
          }

          let updatedConnector: BLine
          if (startMatches) {
            updatedConnector = lineWithEndpoint(connector, "start", attachment)
          } else {
            updatedConnector = lineWithEndpoint(connector, "end", attachment)
          }

          if (!candidateIsValid([updatedConnector], cellContents)) {
            canRemoveBridge = false
            break
          }

          updates.set(connectorIndex, updatedConnector)
        }

        if (!canRemoveBridge) continue

        const candidate = reduced
          .map((line, index) => updates.get(index) ?? line)
          .filter((_, index) => index !== bridgeIndex)
        if (connectedComponentCount(candidate) > currentComponents) continue
        if (
          !preservesSeparatedCellPairs(candidate, cellContents, requiredPairs)
        )
          continue

        reduced = candidate
        changed = true
        break
      }

      if (changed) break
    }
  }

  return reduced
}
