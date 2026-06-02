import type { Point, Line as BLine, InputRect } from "./types"

export const TOL = 0.001

export const pointsEqual = (
  p1: Point,
  p2: Point,
  tolerance: number = TOL,
): boolean =>
  Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance

export const pointKey = (p: Point) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`

export const isZeroLength = (line: BLine) => pointsEqual(line.start, line.end)

const isAxisAligned = (line: BLine) =>
  Math.abs(line.start.x - line.end.x) < TOL ||
  Math.abs(line.start.y - line.end.y) < TOL

const rangesOverlap = (
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
) => Math.min(aMax, bMax) - Math.max(aMin, bMin) > TOL

export const pathLength = (lines: BLine[]) =>
  lines.reduce(
    (total, line) =>
      total +
      Math.abs(line.start.x - line.end.x) +
      Math.abs(line.start.y - line.end.y),
    0,
  )

export const lineContainsPoint = (line: BLine, point: Point) => {
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

export const lineWithEndpoint = (
  line: BLine,
  endpoint: "start" | "end",
  point: Point,
) =>
  endpoint === "start"
    ? { start: point, end: line.end }
    : { start: line.start, end: point }

export const lineOtherEndpoint = (line: BLine, endpoint: "start" | "end") =>
  endpoint === "start" ? line.end : line.start

const cellCenter = (cell: InputRect): Point => ({
  x: (cell.minX + cell.maxX) / 2,
  y: (cell.minY + cell.maxY) / 2,
})

const valueBetween = (value: number, a: number, b: number) =>
  value > Math.min(a, b) + TOL && value < Math.max(a, b) - TOL

export const pointDegrees = (lines: BLine[]) => {
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

export const pointOnAnyCellEdge = (point: Point, cellContents: InputRect[]) =>
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

export const endpointOnLineAtY = (line: BLine, y: number) => {
  if (Math.abs(line.start.x - line.end.x) >= TOL) return undefined
  if (Math.abs(line.start.y - y) < TOL) return "start" as const
  if (Math.abs(line.end.y - y) < TOL) return "end" as const
  return undefined
}

export const endpointOnLineAtX = (line: BLine, x: number) => {
  if (Math.abs(line.start.y - line.end.y) >= TOL) return undefined
  if (Math.abs(line.start.x - x) < TOL) return "start" as const
  if (Math.abs(line.end.x - x) < TOL) return "end" as const
  return undefined
}

const segmentCrossesRectInterior = (line: BLine, rect: InputRect) => {
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
      yMax > rect.minY - TOL &&
      yMin < rect.maxY + TOL
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

const segmentOverlapsRectEdge = (line: BLine, rect: InputRect) => {
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

export const candidateIsValid = (lines: BLine[], cellContents: InputRect[]) =>
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

const lineSeparatesCells = (line: BLine, cellContents: InputRect[]) => {
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

const lineSeparatesCellPair = (line: BLine, a: InputRect, b: InputRect) => {
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

export const separatedCellPairs = (
  lines: BLine[],
  cellContents: InputRect[],
) => {
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

export const preservesSeparatedCellPairs = (
  lines: BLine[],
  cellContents: InputRect[],
  requiredPairs: Set<string>,
) => {
  const actualPairs = separatedCellPairs(lines, cellContents)
  return [...requiredPairs].every((pair) => actualPairs.has(pair))
}

const axisValues = (lines: BLine[], cellContents: InputRect[]) => {
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
  lines: BLine[],
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
  lines: BLine[],
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

const cellRegionComponents = (lines: BLine[], cellContents: InputRect[]) => {
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
          if (next.x < 0 || next.x >= xCount || next.y < 0 || next.y >= yCount)
            continue
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
            )
              continue
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
            )
              continue
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

export const sharedCellRegionCount = (
  lines: BLine[],
  cellContents: InputRect[],
) => {
  const components = cellRegionComponents(lines, cellContents)
  let shared = 0
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      if (components[i] === components[j]) shared++
    }
  }
  return shared
}

export const connectedComponentCount = (lines: BLine[]) => {
  const adjacency = new Map<string, Set<string>>()
  const pointsByLine = lines.map((line) => [line.start, line.end])
  const add = (a: Point, b: Point) => {
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

export const connectDanglingEndpoints = (
  lines: BLine[],
  cellContents: InputRect[],
  options?: { preserveOriginalSpan?: boolean },
): BLine[] => {
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
        const candidates: { x: number; y: number }[] = []
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
          .filter(
            ({ line: candidateLine }) =>
              !options?.preserveOriginalSpan ||
              lineContainsPoint(candidateLine, endpoint),
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

const intersectionPointsOnLine = (line: BLine, lines: BLine[]) => {
  const points: Point[] = []
  const lineVertical = Math.abs(line.start.x - line.end.x) < TOL
  const lineHorizontal = Math.abs(line.start.y - line.end.y) < TOL
  for (const other of lines) {
    if (other === line) continue
    const otherVertical = Math.abs(other.start.x - other.end.x) < TOL
    const otherHorizontal = Math.abs(other.start.y - other.end.y) < TOL
    if (lineVertical && otherHorizontal) {
      const point = { x: line.start.x, y: other.start.y }
      if (lineContainsPoint(line, point) && lineContainsPoint(other, point))
        points.push(point)
    }
    if (lineHorizontal && otherVertical) {
      const point = { x: other.start.x, y: line.start.y }
      if (lineContainsPoint(line, point) && lineContainsPoint(other, point))
        points.push(point)
    }
  }
  return points
}

export const trimDanglingOverhangs = (
  lines: BLine[],
  cellContents: InputRect[],
  requiredPairs?: Set<string>,
): BLine[] => {
  let trimmed = lines
  let changed = true
  while (changed) {
    changed = false
    const degrees = pointDegrees(trimmed)
    const currentComponents = connectedComponentCount(trimmed)
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
        if (connectedComponentCount(candidate) > currentComponents) continue
        if (
          requiredPairs &&
          !preservesSeparatedCellPairs(candidate, cellContents, requiredPairs)
        )
          continue
        trimmed = candidate
        changed = true
        break
      }
      if (changed) break
    }
  }
  return trimmed
}

const normalizeSegment = (segment: BLine): BLine => {
  let { start, end } = segment
  if (start.y === end.y && start.x > end.x) {
    ;[start, end] = [
      { x: end.x, y: start.y },
      { x: start.x, y: end.y },
    ]
  } else if (start.x === end.x && start.y > end.y) {
    ;[start, end] = [
      { x: start.x, y: end.y },
      { x: end.x, y: start.y },
    ]
  }
  return { start, end }
}

export const mergeAlignedSegments = (segments: BLine[]): BLine[] => {
  if (!segments || segments.length === 0) return []
  const normalizedSegments = segments.map(normalizeSegment)
  const horizontalSegments: BLine[] = []
  const verticalSegments: BLine[] = []
  for (const seg of normalizedSegments) {
    if (seg.start.y === seg.end.y) horizontalSegments.push(seg)
    else if (seg.start.x === seg.end.x) verticalSegments.push(seg)
  }
  const mergedSegments: BLine[] = []
  const horizontalByY = new Map<number, BLine[]>()
  for (const seg of horizontalSegments) {
    const bucket = horizontalByY.get(seg.start.y) ?? []
    bucket.push(seg)
    horizontalByY.set(seg.start.y, bucket)
  }
  for (const [, segs] of horizontalByY) {
    segs.sort((a, b) => a.start.x - b.start.x)
    let currentMerged: BLine | undefined
    for (const seg of segs) {
      if (!currentMerged) {
        currentMerged = { ...seg }
        continue
      }
      if (seg.start.x <= currentMerged.end.x) {
        currentMerged.end.x = Math.max(currentMerged.end.x, seg.end.x)
      } else {
        mergedSegments.push(currentMerged)
        currentMerged = { ...seg }
      }
    }
    if (currentMerged) mergedSegments.push(currentMerged)
  }
  const verticalByX = new Map<number, BLine[]>()
  for (const seg of verticalSegments) {
    const bucket = verticalByX.get(seg.start.x) ?? []
    bucket.push(seg)
    verticalByX.set(seg.start.x, bucket)
  }
  for (const [, segs] of verticalByX) {
    segs.sort((a, b) => a.start.y - b.start.y)
    let currentMerged: BLine | undefined
    for (const seg of segs) {
      if (!currentMerged) {
        currentMerged = { ...seg }
        continue
      }
      if (seg.start.y <= currentMerged.end.y) {
        currentMerged.end.y = Math.max(currentMerged.end.y, seg.end.y)
      } else {
        mergedSegments.push(currentMerged)
        currentMerged = { ...seg }
      }
    }
    if (currentMerged) mergedSegments.push(currentMerged)
  }
  return mergedSegments
}
