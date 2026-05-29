import type { Line, Vec2, CellContent } from "../types"
import {
  TOL,
  pointKey,
  lineKey,
  pointsEqual,
  isZeroLength,
  pathLength,
  lineContainsPoint,
  lineWithEndpoint,
  candidateIsValid,
} from "./primitives"
import { connectedComponentCount } from "./cellUtils"
import { connectDanglingEndpoints } from "./connectDanglingEndpoints"
import { trimDanglingOverhangs } from "./trimDanglingOverhangs"
import { mergeAlignedSegments } from "../mergeAlignedSegments"

// --- simplifyChains ---

const compactPath = (points: Vec2[]) => {
  const lines: Line[] = []
  for (let i = 0; i + 1 < points.length; i++) {
    const start = points[i]
    const end = points[i + 1]
    if (!start || !end || pointsEqual(start, end)) continue
    lines.push({ start, end })
  }
  return lines
}

const bestReplacementForChain = (
  chain: Vec2[],
  cellContents: CellContent[],
): Line[] => {
  const original = compactPath(chain)
  const start = chain.at(0)
  const end = chain.at(-1)
  if (!start || !end || original.length < 2) return original

  const candidates: Line[][] = []

  if (Math.abs(start.x - end.x) < TOL || Math.abs(start.y - end.y) < TOL) {
    candidates.push([{ start, end }])
  } else {
    candidates.push(
      compactPath([start, { x: start.x, y: end.y }, end]),
      compactPath([start, { x: end.x, y: start.y }, end]),
    )
  }

  const xs = [...new Set(chain.map((p) => p.x))]
  const ys = [...new Set(chain.map((p) => p.y))]

  for (const x of xs) {
    if (Math.abs(x - start.x) < TOL || Math.abs(x - end.x) < TOL) continue
    candidates.push(
      compactPath([start, { x, y: start.y }, { x, y: end.y }, end]),
    )
  }

  for (const y of ys) {
    if (Math.abs(y - start.y) < TOL || Math.abs(y - end.y) < TOL) continue
    candidates.push(
      compactPath([start, { x: start.x, y }, { x: end.x, y }, end]),
    )
  }

  const validCandidates = candidates
    .filter((candidate) => candidate.length < original.length)
    .filter((candidate) => candidateIsValid(candidate, cellContents))
    .sort(
      (a, b) =>
        a.length - b.length ||
        pathLength(a) - pathLength(b) ||
        JSON.stringify(a).localeCompare(JSON.stringify(b)),
    )

  return validCandidates.at(0) ?? original
}

const simplifyChains = (lines: Line[], cellContents: CellContent[]): Line[] => {
  const pointByKey = new Map<string, Vec2>()
  const adjacency = new Map<string, Set<string>>()

  const addPoint = (point: Vec2) => {
    const key = pointKey(point)
    pointByKey.set(key, point)
    if (!adjacency.has(key)) adjacency.set(key, new Set())
    return key
  }

  for (const line of lines) {
    if (isZeroLength(line)) continue
    const startKey = addPoint(line.start)
    const endKey = addPoint(line.end)
    adjacency.get(startKey)?.add(endKey)
    adjacency.get(endKey)?.add(startKey)
  }

  const visitedEdges = new Set<string>()
  const simplified: Line[] = []

  for (const [startKey, neighbors] of adjacency) {
    if (neighbors.size === 2) continue

    for (const firstNeighborKey of neighbors) {
      const firstEdgeKey = lineKey(
        pointByKey.get(startKey)!,
        pointByKey.get(firstNeighborKey)!,
      )
      if (visitedEdges.has(firstEdgeKey)) continue

      const chain = [pointByKey.get(startKey)!]
      let previousKey = startKey
      let currentKey = firstNeighborKey

      while (true) {
        visitedEdges.add(
          lineKey(pointByKey.get(previousKey)!, pointByKey.get(currentKey)!),
        )
        chain.push(pointByKey.get(currentKey)!)

        const currentNeighbors = adjacency.get(currentKey)
        if (!currentNeighbors || currentNeighbors.size !== 2) break

        const nextKey = [...currentNeighbors].find((key) => key !== previousKey)
        if (!nextKey) break

        const nextEdgeKey = lineKey(
          pointByKey.get(currentKey)!,
          pointByKey.get(nextKey)!,
        )
        if (visitedEdges.has(nextEdgeKey)) break

        previousKey = currentKey
        currentKey = nextKey
      }

      simplified.push(...bestReplacementForChain(chain, cellContents))
    }
  }

  for (const [startKey, neighbors] of adjacency) {
    for (const endKey of neighbors) {
      const edgeKey = lineKey(
        pointByKey.get(startKey)!,
        pointByKey.get(endKey)!,
      )
      if (visitedEdges.has(edgeKey)) continue
      visitedEdges.add(edgeKey)
      simplified.push({
        start: pointByKey.get(startKey)!,
        end: pointByKey.get(endKey)!,
      })
    }
  }

  return simplified
}

// --- alignParallelLinesAcrossConnectors ---

const alignParallelLinesAcrossConnectors = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let aligned = lines
  let changed = true

  while (changed) {
    changed = false
    const currentComponents = connectedComponentCount(aligned)
    const currentMergedLength = mergeAlignedSegments(aligned).length

    for (let moveIndex = 0; moveIndex < aligned.length; moveIndex++) {
      const lineToMove = aligned[moveIndex]
      if (!lineToMove) continue

      const movingVertical =
        Math.abs(lineToMove.start.x - lineToMove.end.x) < TOL
      const movingHorizontal =
        Math.abs(lineToMove.start.y - lineToMove.end.y) < TOL
      if (!movingVertical && !movingHorizontal) continue

      for (let anchorIndex = 0; anchorIndex < aligned.length; anchorIndex++) {
        if (moveIndex === anchorIndex) continue
        const anchor = aligned[anchorIndex]
        if (!anchor) continue

        const anchorVertical = Math.abs(anchor.start.x - anchor.end.x) < TOL
        const anchorHorizontal = Math.abs(anchor.start.y - anchor.end.y) < TOL
        if (movingVertical !== anchorVertical) continue
        if (movingHorizontal !== anchorHorizontal) continue

        if (
          (movingVertical &&
            Math.abs(lineToMove.start.x - anchor.start.x) < TOL) ||
          (movingHorizontal &&
            Math.abs(lineToMove.start.y - anchor.start.y) < TOL)
        ) {
          continue
        }
        const hasConnector = aligned.some((connector, connectorIndex) => {
          if (connectorIndex === moveIndex || connectorIndex === anchorIndex) {
            return false
          }

          const connectorVertical =
            Math.abs(connector.start.x - connector.end.x) < TOL
          const connectorHorizontal =
            Math.abs(connector.start.y - connector.end.y) < TOL

          if (movingVertical && connectorHorizontal) {
            return (
              lineContainsPoint(connector, {
                x: lineToMove.start.x,
                y: connector.start.y,
              }) &&
              lineContainsPoint(lineToMove, {
                x: lineToMove.start.x,
                y: connector.start.y,
              }) &&
              lineContainsPoint(connector, {
                x: anchor.start.x,
                y: connector.start.y,
              }) &&
              lineContainsPoint(anchor, {
                x: anchor.start.x,
                y: connector.start.y,
              })
            )
          }

          if (movingHorizontal && connectorVertical) {
            return (
              lineContainsPoint(connector, {
                x: connector.start.x,
                y: lineToMove.start.y,
              }) &&
              lineContainsPoint(lineToMove, {
                x: connector.start.x,
                y: lineToMove.start.y,
              }) &&
              lineContainsPoint(connector, {
                x: connector.start.x,
                y: anchor.start.y,
              }) &&
              lineContainsPoint(anchor, {
                x: connector.start.x,
                y: anchor.start.y,
              })
            )
          }

          return false
        })

        if (!hasConnector) continue

        const movedLine = movingVertical
          ? {
              start: { x: anchor.start.x, y: lineToMove.start.y },
              end: { x: anchor.start.x, y: lineToMove.end.y },
            }
          : {
              start: { x: lineToMove.start.x, y: anchor.start.y },
              end: { x: lineToMove.end.x, y: anchor.start.y },
            }

        if (!candidateIsValid([movedLine], cellContents)) continue

        const candidate = aligned.map((line, index) =>
          index === moveIndex ? movedLine : line,
        )
        if (connectedComponentCount(candidate) > currentComponents) {
          continue
        }

        const mergedCandidate = mergeAlignedSegments(candidate)
        if (mergedCandidate.length >= currentMergedLength) continue

        aligned = mergedCandidate
        changed = true
        break
      }

      if (changed) break
    }
  }

  return aligned
}

// --- removeRedundantParallelBridges ---

const removeRedundantParallelBridges = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let reduced = lines
  let changed = true

  while (changed) {
    changed = false
    const currentComponents = connectedComponentCount(reduced)

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
        if (connectedComponentCount(candidate) > currentComponents) {
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

// --- simplify phase ---

export const simplify = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  const simplified = simplifyChains(lines, cellContents)
  const connected = connectDanglingEndpoints(simplified, cellContents)
  const aligned = alignParallelLinesAcrossConnectors(connected, cellContents)
  const reduced = removeRedundantParallelBridges(aligned, cellContents)
  return trimDanglingOverhangs(reduced, cellContents)
}
