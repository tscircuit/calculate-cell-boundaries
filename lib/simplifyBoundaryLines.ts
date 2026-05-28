import type { CellContent, Line, Vec2 } from "./types"
import { mergeAlignedSegments } from "./mergeAlignedSegments"

const TOL = 0.001

const pointKey = (p: Vec2) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`

const lineKey = (a: Vec2, b: Vec2) => {
  const ak = pointKey(a)
  const bk = pointKey(b)
  return ak < bk ? `${ak}_${bk}` : `${bk}_${ak}`
}

const pointsEqual = (a: Vec2, b: Vec2) =>
  Math.abs(a.x - b.x) < TOL && Math.abs(a.y - b.y) < TOL

const isZeroLength = (line: Line) => pointsEqual(line.start, line.end)

const isAxisAligned = (line: Line) =>
  Math.abs(line.start.x - line.end.x) < TOL ||
  Math.abs(line.start.y - line.end.y) < TOL

const segmentCrossesRectInterior = (line: Line, rect: CellContent) => {
  const x1 = line.start.x
  const y1 = line.start.y
  const x2 = line.end.x
  const y2 = line.end.y

  if (Math.abs(x1 - x2) < TOL) {
    const yMin = Math.min(y1, y2)
    const yMax = Math.max(y1, y2)
    return (
      x1 > rect.minX + TOL &&
      x1 < rect.maxX - TOL &&
      yMax > rect.minY + TOL &&
      yMin < rect.maxY - TOL
    )
  }

  if (Math.abs(y1 - y2) < TOL) {
    const xMin = Math.min(x1, x2)
    const xMax = Math.max(x1, x2)
    return (
      y1 > rect.minY + TOL &&
      y1 < rect.maxY - TOL &&
      xMax > rect.minX + TOL &&
      xMin < rect.maxX - TOL
    )
  }

  return true
}

const segmentOverlapsRectEdge = (line: Line, rect: CellContent) => {
  const x1 = line.start.x
  const y1 = line.start.y
  const x2 = line.end.x
  const y2 = line.end.y

  if (Math.abs(x1 - x2) < TOL) {
    const yMin = Math.min(y1, y2)
    const yMax = Math.max(y1, y2)
    return (
      (Math.abs(x1 - rect.minX) < TOL || Math.abs(x1 - rect.maxX) < TOL) &&
      rangesOverlap(yMin, yMax, rect.minY, rect.maxY)
    )
  }

  if (Math.abs(y1 - y2) < TOL) {
    const xMin = Math.min(x1, x2)
    const xMax = Math.max(x1, x2)
    return (
      (Math.abs(y1 - rect.minY) < TOL || Math.abs(y1 - rect.maxY) < TOL) &&
      rangesOverlap(xMin, xMax, rect.minX, rect.maxX)
    )
  }

  return false
}

const candidateIsValid = (lines: Line[], cellContents: CellContent[]) =>
  lines.length > 0 &&
  lines.every(
    (line) =>
      !isZeroLength(line) &&
      isAxisAligned(line) &&
      !cellContents.some(
        (rect) =>
          segmentCrossesRectInterior(line, rect) ||
          segmentOverlapsRectEdge(line, rect),
      ),
  )

const pathLength = (lines: Line[]) =>
  lines.reduce(
    (total, line) =>
      total +
      Math.abs(line.start.x - line.end.x) +
      Math.abs(line.start.y - line.end.y),
    0,
  )

const rangesOverlap = (
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
) => Math.min(aMax, bMax) - Math.max(aMin, bMin) > TOL

const lineSeparatesCells = (line: Line, cellContents: CellContent[]) => {
  if (Math.abs(line.start.x - line.end.x) < TOL) {
    const x = line.start.x
    const yMin = Math.min(line.start.y, line.end.y)
    const yMax = Math.max(line.start.y, line.end.y)

    return cellContents.some(
      (left) =>
        left.maxX <= x + TOL &&
        rangesOverlap(yMin, yMax, left.minY, left.maxY) &&
        cellContents.some(
          (right) =>
            right.minX >= x - TOL &&
            rangesOverlap(yMin, yMax, right.minY, right.maxY) &&
            rangesOverlap(left.minY, left.maxY, right.minY, right.maxY),
        ),
    )
  }

  if (Math.abs(line.start.y - line.end.y) < TOL) {
    const y = line.start.y
    const xMin = Math.min(line.start.x, line.end.x)
    const xMax = Math.max(line.start.x, line.end.x)

    return cellContents.some(
      (top) =>
        top.maxY <= y + TOL &&
        rangesOverlap(xMin, xMax, top.minX, top.maxX) &&
        cellContents.some(
          (bottom) =>
            bottom.minY >= y - TOL &&
            rangesOverlap(xMin, xMax, bottom.minX, bottom.maxX) &&
            rangesOverlap(top.minX, top.maxX, bottom.minX, bottom.maxX),
        ),
    )
  }

  return false
}

const pointOnAnyCellEdge = (point: Vec2, cellContents: CellContent[]) =>
  cellContents.some((cell) => {
    const onVerticalEdge =
      (Math.abs(point.x - cell.minX) < TOL ||
        Math.abs(point.x - cell.maxX) < TOL) &&
      point.y >= cell.minY - TOL &&
      point.y <= cell.maxY + TOL
    const onHorizontalEdge =
      (Math.abs(point.y - cell.minY) < TOL ||
        Math.abs(point.y - cell.maxY) < TOL) &&
      point.x >= cell.minX - TOL &&
      point.x <= cell.maxX + TOL

    return onVerticalEdge || onHorizontalEdge
  })

const cellCenter = (cell: CellContent): Vec2 => ({
  x: (cell.minX + cell.maxX) / 2,
  y: (cell.minY + cell.maxY) / 2,
})

const valueBetween = (value: number, a: number, b: number) =>
  value > Math.min(a, b) + TOL && value < Math.max(a, b) - TOL

const lineSeparatesCellPair = (line: Line, a: CellContent, b: CellContent) => {
  const aCenter = cellCenter(a)
  const bCenter = cellCenter(b)

  if (Math.abs(line.start.x - line.end.x) < TOL) {
    const x = line.start.x
    const yMin = Math.min(line.start.y, line.end.y)
    const yMax = Math.max(line.start.y, line.end.y)
    return (
      valueBetween(x, aCenter.x, bCenter.x) &&
      rangesOverlap(yMin, yMax, a.minY, a.maxY) &&
      rangesOverlap(yMin, yMax, b.minY, b.maxY)
    )
  }

  if (Math.abs(line.start.y - line.end.y) < TOL) {
    const y = line.start.y
    const xMin = Math.min(line.start.x, line.end.x)
    const xMax = Math.max(line.start.x, line.end.x)
    return (
      valueBetween(y, aCenter.y, bCenter.y) &&
      rangesOverlap(xMin, xMax, a.minX, a.maxX) &&
      rangesOverlap(xMin, xMax, b.minX, b.maxX)
    )
  }

  return false
}

const separatedCellPairs = (lines: Line[], cellContents: CellContent[]) => {
  const pairs = new Set<string>()

  for (let i = 0; i < cellContents.length; i++) {
    const a = cellContents[i]
    if (!a) continue

    for (let j = i + 1; j < cellContents.length; j++) {
      const b = cellContents[j]
      if (!b) continue

      if (lines.some((line) => lineSeparatesCellPair(line, a, b))) {
        pairs.add(`${i}:${j}`)
      }
    }
  }

  return pairs
}

const preservesSeparatedCellPairs = (
  lines: Line[],
  cellContents: CellContent[],
  requiredPairs: Set<string>,
) => {
  const actualPairs = separatedCellPairs(lines, cellContents)
  return [...requiredPairs].every((pair) => actualPairs.has(pair))
}

const connectedComponentCount = (lines: Line[]) => {
  const adjacency = new Map<string, Set<string>>()
  const pointsByLine = lines.map((line) => [line.start, line.end])

  const add = (a: Vec2, b: Vec2) => {
    const ak = pointKey(a)
    const bk = pointKey(b)
    if (!adjacency.has(ak)) adjacency.set(ak, new Set())
    if (!adjacency.has(bk)) adjacency.set(bk, new Set())
    adjacency.get(ak)?.add(bk)
    adjacency.get(bk)?.add(ak)
  }

  for (let i = 0; i < lines.length; i++) {
    const a = lines[i]
    if (!a || isZeroLength(a)) continue

    for (let j = i + 1; j < lines.length; j++) {
      const b = lines[j]
      if (!b || isZeroLength(b)) continue

      const aVertical = Math.abs(a.start.x - a.end.x) < TOL
      const aHorizontal = Math.abs(a.start.y - a.end.y) < TOL
      const bVertical = Math.abs(b.start.x - b.end.x) < TOL
      const bHorizontal = Math.abs(b.start.y - b.end.y) < TOL

      if (aVertical && bHorizontal) {
        const point = { x: a.start.x, y: b.start.y }
        if (lineContainsPoint(a, point) && lineContainsPoint(b, point)) {
          pointsByLine[i]?.push(point)
          pointsByLine[j]?.push(point)
        }
      }

      if (aHorizontal && bVertical) {
        const point = { x: b.start.x, y: a.start.y }
        if (lineContainsPoint(a, point) && lineContainsPoint(b, point)) {
          pointsByLine[i]?.push(point)
          pointsByLine[j]?.push(point)
        }
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || isZeroLength(line)) continue

    const points = [...new Map(pointsByLine[i]?.map((p) => [pointKey(p), p]))]
      .map(([, point]) => point)
      .sort((a, b) =>
        Math.abs(line.start.x - line.end.x) < TOL ? a.y - b.y : a.x - b.x,
      )

    for (let j = 0; j + 1 < points.length; j++) {
      const start = points[j]
      const end = points[j + 1]
      if (start && end && !pointsEqual(start, end)) add(start, end)
    }
  }

  let count = 0
  const visited = new Set<string>()

  for (const key of adjacency.keys()) {
    if (visited.has(key)) continue
    count++
    const stack = [key]
    visited.add(key)

    while (stack.length > 0) {
      const current = stack.pop()
      if (!current) continue

      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue
        visited.add(next)
        stack.push(next)
      }
    }
  }

  return count
}

const pruneNonSeparatingLeaves = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let pruned = lines
  let changed = true

  while (changed) {
    changed = false
    const componentCountBefore = connectedComponentCount(pruned)
    const degrees = new Map<string, number>()

    for (const line of pruned) {
      degrees.set(
        pointKey(line.start),
        (degrees.get(pointKey(line.start)) ?? 0) + 1,
      )
      degrees.set(
        pointKey(line.end),
        (degrees.get(pointKey(line.end)) ?? 0) + 1,
      )
    }

    for (let i = 0; i < pruned.length; i++) {
      const line = pruned[i]
      if (!line) continue
      if (lineSeparatesCells(line, cellContents)) continue
      if (
        degrees.get(pointKey(line.start)) !== 1 &&
        degrees.get(pointKey(line.end)) !== 1
      ) {
        continue
      }

      const candidate = pruned.filter((_, index) => index !== i)
      if (connectedComponentCount(candidate) !== componentCountBefore) continue

      pruned = candidate
      changed = true
      break
    }
  }

  return pruned
}

const pointDegrees = (lines: Line[]) => {
  const degrees = new Map<string, number>()

  for (const line of lines) {
    degrees.set(
      pointKey(line.start),
      (degrees.get(pointKey(line.start)) ?? 0) + 1,
    )
    degrees.set(pointKey(line.end), (degrees.get(pointKey(line.end)) ?? 0) + 1)
  }

  return degrees
}

const lineWithEndpoint = (
  line: Line,
  endpoint: "start" | "end",
  point: Vec2,
) =>
  endpoint === "start"
    ? { start: point, end: line.end }
    : { start: line.start, end: point }

const lineContainsPoint = (line: Line, point: Vec2) => {
  if (Math.abs(line.start.x - line.end.x) < TOL) {
    return (
      Math.abs(point.x - line.start.x) < TOL &&
      point.y >= Math.min(line.start.y, line.end.y) - TOL &&
      point.y <= Math.max(line.start.y, line.end.y) + TOL
    )
  }

  if (Math.abs(line.start.y - line.end.y) < TOL) {
    return (
      Math.abs(point.y - line.start.y) < TOL &&
      point.x >= Math.min(line.start.x, line.end.x) - TOL &&
      point.x <= Math.max(line.start.x, line.end.x) + TOL
    )
  }

  return false
}

const connectDanglingEndpoints = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let connected = lines
  let changed = true

  while (changed) {
    changed = false
    const degrees = pointDegrees(connected)

    for (let lineIndex = 0; lineIndex < connected.length; lineIndex++) {
      const line = connected[lineIndex]
      if (!line) continue

      for (const endpointName of ["start", "end"] as const) {
        const endpoint = line[endpointName]
        if (degrees.get(pointKey(endpoint)) !== 1) continue

        const candidates: Vec2[] = []
        const lineIsVertical = Math.abs(line.start.x - line.end.x) < TOL
        const lineIsHorizontal = Math.abs(line.start.y - line.end.y) < TOL

        for (let otherIndex = 0; otherIndex < connected.length; otherIndex++) {
          if (lineIndex === otherIndex) continue
          const other = connected[otherIndex]
          if (!other) continue

          if (lineIsVertical && Math.abs(other.start.y - other.end.y) < TOL) {
            const candidate = { x: line.start.x, y: other.start.y }
            if (lineContainsPoint(other, candidate)) candidates.push(candidate)
          }

          if (lineIsHorizontal && Math.abs(other.start.x - other.end.x) < TOL) {
            const candidate = { x: other.start.x, y: line.start.y }
            if (lineContainsPoint(other, candidate)) candidates.push(candidate)
          }
        }

        const bestCandidate = candidates
          .filter((candidate) => !pointsEqual(candidate, endpoint))
          .map((candidate) => ({
            point: candidate,
            line: lineWithEndpoint(line, endpointName, candidate),
          }))
          .filter(
            ({ line: candidateLine }) =>
              pathLength([candidateLine]) > pathLength([line]) + TOL,
          )
          .filter(({ line }) => candidateIsValid([line], cellContents))
          .sort(
            (a, b) =>
              pathLength([a.line]) - pathLength([b.line]) ||
              JSON.stringify(a.point).localeCompare(JSON.stringify(b.point)),
          )
          .at(0)

        if (!bestCandidate) continue

        connected = connected.map((item, index) =>
          index === lineIndex ? bestCandidate.line : item,
        )
        changed = true
        break
      }

      if (changed) break
    }
  }

  return connected
}

const removeRedundantParallelBridges = (
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

const alignParallelLinesAcrossConnectors = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let aligned = lines
  let changed = true

  while (changed) {
    changed = false

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
        if (pathLength([lineToMove]) > pathLength([anchor]) + TOL) continue

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
        if (
          connectedComponentCount(candidate) > connectedComponentCount(aligned)
        ) {
          continue
        }

        const mergedCandidate = mergeAlignedSegments(candidate)
        const currentMerged = mergeAlignedSegments(aligned)
        if (mergedCandidate.length >= currentMerged.length) continue

        aligned = mergedCandidate
        changed = true
        break
      }

      if (changed) break
    }
  }

  return aligned
}

const intersectionPointsOnLine = (line: Line, lines: Line[]) => {
  const points: Vec2[] = []
  const lineVertical = Math.abs(line.start.x - line.end.x) < TOL
  const lineHorizontal = Math.abs(line.start.y - line.end.y) < TOL

  for (const other of lines) {
    if (other === line) continue

    const otherVertical = Math.abs(other.start.x - other.end.x) < TOL
    const otherHorizontal = Math.abs(other.start.y - other.end.y) < TOL

    if (lineVertical && otherHorizontal) {
      const point = { x: line.start.x, y: other.start.y }
      if (lineContainsPoint(line, point) && lineContainsPoint(other, point)) {
        points.push(point)
      }
    }

    if (lineHorizontal && otherVertical) {
      const point = { x: other.start.x, y: line.start.y }
      if (lineContainsPoint(line, point) && lineContainsPoint(other, point)) {
        points.push(point)
      }
    }
  }

  return points
}

const trimDanglingOverhangs = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  let trimmed = lines
  let changed = true

  while (changed) {
    changed = false
    const degrees = pointDegrees(trimmed)

    for (let lineIndex = 0; lineIndex < trimmed.length; lineIndex++) {
      const line = trimmed[lineIndex]
      if (!line) continue

      const intersections = intersectionPointsOnLine(line, trimmed).filter(
        (point) =>
          !pointsEqual(point, line.start) && !pointsEqual(point, line.end),
      )
      if (intersections.length === 0) continue

      for (const endpointName of ["start", "end"] as const) {
        const endpoint = line[endpointName]
        if (degrees.get(pointKey(endpoint)) !== 1) continue
        if (pointOnAnyCellEdge(endpoint, cellContents)) continue

        const nearest = intersections
          .map((point) => ({
            point,
            distance:
              Math.abs(point.x - endpoint.x) + Math.abs(point.y - endpoint.y),
          }))
          .sort((a, b) => a.distance - b.distance)
          .at(0)

        if (!nearest) continue

        const tail = { start: endpoint, end: nearest.point }
        if (lineSeparatesCells(tail, cellContents)) continue

        const candidateLine = lineWithEndpoint(
          line,
          endpointName,
          nearest.point,
        )
        if (!candidateIsValid([candidateLine], cellContents)) continue

        const candidate = trimmed.map((item, index) =>
          index === lineIndex ? candidateLine : item,
        )
        if (
          connectedComponentCount(candidate) > connectedComponentCount(trimmed)
        ) {
          continue
        }

        trimmed = candidate
        changed = true
        break
      }

      if (changed) break
    }
  }

  return trimmed
}

const restoreMissingSeparators = (
  lines: Line[],
  originalLines: Line[],
  cellContents: CellContent[],
  requiredPairs: Set<string>,
) => {
  let restored = lines

  while (!preservesSeparatedCellPairs(restored, cellContents, requiredPairs)) {
    const actualPairs = separatedCellPairs(restored, cellContents)
    const missingPair = [...requiredPairs].find(
      (pair) => !actualPairs.has(pair),
    )
    if (!missingPair) break

    const [aIndex, bIndex] = missingPair.split(":").map(Number)
    const a = cellContents[aIndex]
    const b = cellContents[bIndex]
    if (!a || !b) break

    const replacement = originalLines
      .filter((line) => lineSeparatesCellPair(line, a, b))
      .sort(
        (lineA, lineB) =>
          pathLength([lineA]) - pathLength([lineB]) ||
          JSON.stringify(lineA).localeCompare(JSON.stringify(lineB)),
      )
      .at(0)

    if (!replacement) break
    restored = mergeAlignedSegments([...restored, replacement])
  }

  return restored
}

const axisValues = (lines: Line[], cellContents: CellContent[]) => {
  const xs = new Set<number>()
  const ys = new Set<number>()

  for (const cell of cellContents) {
    xs.add(cell.minX)
    xs.add(cell.maxX)
    xs.add(cellCenter(cell).x)
    ys.add(cell.minY)
    ys.add(cell.maxY)
    ys.add(cellCenter(cell).y)
  }

  for (const line of lines) {
    xs.add(line.start.x)
    xs.add(line.end.x)
    ys.add(line.start.y)
    ys.add(line.end.y)
  }

  return {
    xs: [...xs].sort((a, b) => a - b),
    ys: [...ys].sort((a, b) => a - b),
  }
}

const intervalBlockedByVerticalLine = (
  lines: Line[],
  x: number,
  yMin: number,
  yMax: number,
) =>
  lines.some((line) => {
    if (Math.abs(line.start.x - line.end.x) >= TOL) return false
    if (Math.abs(line.start.x - x) >= TOL) return false

    const lineYMin = Math.min(line.start.y, line.end.y)
    const lineYMax = Math.max(line.start.y, line.end.y)
    return yMin >= lineYMin - TOL && yMax <= lineYMax + TOL
  })

const intervalBlockedByHorizontalLine = (
  lines: Line[],
  y: number,
  xMin: number,
  xMax: number,
) =>
  lines.some((line) => {
    if (Math.abs(line.start.y - line.end.y) >= TOL) return false
    if (Math.abs(line.start.y - y) >= TOL) return false

    const lineXMin = Math.min(line.start.x, line.end.x)
    const lineXMax = Math.max(line.start.x, line.end.x)
    return xMin >= lineXMin - TOL && xMax <= lineXMax + TOL
  })

const cellRegionComponents = (lines: Line[], cellContents: CellContent[]) => {
  const { xs, ys } = axisValues(lines, cellContents)
  const xCount = xs.length - 1
  const yCount = ys.length - 1
  const componentByTile = new Map<string, number>()

  const tileKey = (xIndex: number, yIndex: number) => `${xIndex}:${yIndex}`

  let componentId = 0
  for (let startX = 0; startX < xCount; startX++) {
    for (let startY = 0; startY < yCount; startY++) {
      const startKey = tileKey(startX, startY)
      if (componentByTile.has(startKey)) continue

      const stack = [{ x: startX, y: startY }]
      componentByTile.set(startKey, componentId)

      while (stack.length > 0) {
        const current = stack.pop()
        if (!current) continue

        const neighbours = [
          { x: current.x - 1, y: current.y },
          { x: current.x + 1, y: current.y },
          { x: current.x, y: current.y - 1 },
          { x: current.x, y: current.y + 1 },
        ]

        for (const next of neighbours) {
          if (
            next.x < 0 ||
            next.x >= xCount ||
            next.y < 0 ||
            next.y >= yCount
          ) {
            continue
          }

          const nextKey = tileKey(next.x, next.y)
          if (componentByTile.has(nextKey)) continue

          let blocked = false
          if (next.x !== current.x) {
            const boundaryX = xs[Math.max(next.x, current.x)]
            const yMin = ys[current.y]
            const yMax = ys[current.y + 1]
            if (
              boundaryX === undefined ||
              yMin === undefined ||
              yMax === undefined
            ) {
              continue
            }
            blocked = intervalBlockedByVerticalLine(
              lines,
              boundaryX,
              yMin,
              yMax,
            )
          } else {
            const boundaryY = ys[Math.max(next.y, current.y)]
            const xMin = xs[current.x]
            const xMax = xs[current.x + 1]
            if (
              boundaryY === undefined ||
              xMin === undefined ||
              xMax === undefined
            ) {
              continue
            }
            blocked = intervalBlockedByHorizontalLine(
              lines,
              boundaryY,
              xMin,
              xMax,
            )
          }

          if (blocked) continue

          componentByTile.set(nextKey, componentId)
          stack.push(next)
        }
      }

      componentId++
    }
  }

  return cellContents.map((cell) => {
    const center = cellCenter(cell)
    const xIndex = xs.findIndex(
      (x, index) =>
        index + 1 < xs.length &&
        center.x >= x - TOL &&
        center.x <= (xs[index + 1] ?? x) + TOL,
    )
    const yIndex = ys.findIndex(
      (y, index) =>
        index + 1 < ys.length &&
        center.y >= y - TOL &&
        center.y <= (ys[index + 1] ?? y) + TOL,
    )

    return componentByTile.get(tileKey(xIndex, yIndex)) ?? -1
  })
}

const sharedCellRegionCount = (lines: Line[], cellContents: CellContent[]) => {
  const components = cellRegionComponents(lines, cellContents)
  let shared = 0

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      if (components[i] === components[j]) shared++
    }
  }

  return shared
}

const extendLinesToImproveCellRegions = (
  lines: Line[],
  cellContents: CellContent[],
) => {
  let improved = lines
  let changed = true

  while (changed) {
    changed = false
    const currentShared = sharedCellRegionCount(improved, cellContents)
    if (currentShared === 0) break

    const { xs, ys } = axisValues(improved, cellContents)
    const candidates: Line[][] = []

    for (let i = 0; i < improved.length; i++) {
      const line = improved[i]
      if (!line) continue

      if (Math.abs(line.start.y - line.end.y) < TOL) {
        const minX = Math.min(line.start.x, line.end.x)
        const maxX = Math.max(line.start.x, line.end.x)
        for (const x of xs) {
          if (x >= minX - TOL && x <= maxX + TOL) continue
          const candidateLine = {
            start: { x: Math.min(x, minX), y: line.start.y },
            end: { x: Math.max(x, maxX), y: line.start.y },
          }
          if (!candidateIsValid([candidateLine], cellContents)) continue
          candidates.push(
            improved.map((item, index) => (index === i ? candidateLine : item)),
          )
        }
      }

      if (Math.abs(line.start.x - line.end.x) < TOL) {
        const minY = Math.min(line.start.y, line.end.y)
        const maxY = Math.max(line.start.y, line.end.y)
        for (const y of ys) {
          if (y >= minY - TOL && y <= maxY + TOL) continue
          const candidateLine = {
            start: { x: line.start.x, y: Math.min(y, minY) },
            end: { x: line.start.x, y: Math.max(y, maxY) },
          }
          if (!candidateIsValid([candidateLine], cellContents)) continue
          candidates.push(
            improved.map((item, index) => (index === i ? candidateLine : item)),
          )
        }
      }
    }

    const best = candidates
      .map((candidate) => ({
        lines: mergeAlignedSegments(candidate),
        shared: sharedCellRegionCount(candidate, cellContents),
      }))
      .filter((candidate) => candidate.shared < currentShared)
      .sort(
        (a, b) =>
          a.shared - b.shared ||
          a.lines.length - b.lines.length ||
          pathLength(a.lines) - pathLength(b.lines),
      )
      .at(0)

    if (!best) break
    improved = best.lines
    changed = true
  }

  return improved
}

const restoreSharedCellRegions = (
  lines: Line[],
  originalLines: Line[],
  cellContents: CellContent[],
) => {
  let restored = lines

  while (sharedCellRegionCount(restored, cellContents) > 0) {
    const currentShared = sharedCellRegionCount(restored, cellContents)
    const best = originalLines
      .map((line) => {
        const candidate = mergeAlignedSegments([...restored, line])
        return {
          lines: candidate,
          shared: sharedCellRegionCount(candidate, cellContents),
        }
      })
      .filter((candidate) => candidate.shared < currentShared)
      .sort(
        (a, b) =>
          a.shared - b.shared ||
          a.lines.length - b.lines.length ||
          pathLength(a.lines) - pathLength(b.lines),
      )
      .at(0)

    if (!best) break
    restored = best.lines
  }

  return restored
}

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

export const simplifyBoundaryLines = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  const requiredSeparatedPairs = separatedCellPairs(lines, cellContents)
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

  const emitChain = (chain: Vec2[]) => {
    simplified.push(...bestReplacementForChain(chain, cellContents))
  }

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

      emitChain(chain)
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

  const connected = connectDanglingEndpoints(simplified, cellContents)
  const aligned = alignParallelLinesAcrossConnectors(connected, cellContents)
  const reduced = removeRedundantParallelBridges(aligned, cellContents)
  const trimmed = trimDanglingOverhangs(reduced, cellContents)
  const restored = restoreMissingSeparators(
    trimmed,
    lines,
    cellContents,
    requiredSeparatedPairs,
  )
  const extended = extendLinesToImproveCellRegions(restored, cellContents)
  const partitioned = restoreSharedCellRegions(extended, lines, cellContents)

  return partitioned
}
