import type { Line as BLine, Vec2, InputRect } from "./types"
import {
  TOL,
  pointsEqual,
  pointKey,
  lineKey,
  isZeroLength,
  pathLength,
  candidateIsValid,
} from "./geometry"

const compactPath = (points: Vec2[]) => {
  const lines: BLine[] = []
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
  cellContents: InputRect[],
): BLine[] => {
  const original = compactPath(chain)
  const start = chain.at(0)
  const end = chain.at(-1)
  if (!start || !end || original.length < 2) return original

  const candidates: BLine[][] = []

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

export const simplifyChains = (
  lines: BLine[],
  cellContents: InputRect[],
): BLine[] => {
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
  const simplified: BLine[] = []

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
