import type { Line, CellContent } from "../types"
import { TOL, pointsEqual, lineContainsPoint, lineWithEndpoint } from "./primitives"
import { candidateIsValid } from "./validation"
import { connectedComponentCount } from "./connectivity"

export const removeRedundantParallelBridges = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let reduced = lines
  let changed = true

  while (changed) {
    changed = false

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
        const attachmentPoints = bridgeIsHorizontal
          ? bridgeEndpoints.map((p) => ({ x: p.x, y: spine.start.y }))
          : bridgeEndpoints.map((p) => ({ x: spine.start.x, y: p.y }))

        if (
          !attachmentPoints.every((point) => lineContainsPoint(spine, point))
        ) {
          continue
        }

        const updates = new Map<number, Line>()
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

          if (connectorIndex === -1) {
            continue
          }

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

          const updatedConnector = lineWithEndpoint(
            connector,
            startMatches ? "start" : "end",
            attachment,
          )

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
        if (
          connectedComponentCount(candidate) > connectedComponentCount(reduced)
        ) {
          continue
        }

        reduced = candidate
        changed = true
        break
      }

      if (changed) break
    }
  }

  return reduced
}
