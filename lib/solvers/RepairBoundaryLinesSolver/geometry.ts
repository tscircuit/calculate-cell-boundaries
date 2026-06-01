import type { Vec2, Line as BLine, InputRect } from "./types"

export const TOL = 0.001

const pointsEqual = (p1: Vec2, p2: Vec2, tolerance: number = TOL): boolean =>
  Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance

const pointKey = (p: Vec2) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`

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

export const lineContainsPoint = (line: BLine, point: Vec2) => {
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

const cellCenter = (cell: InputRect): Vec2 => ({
  x: (cell.minX + cell.maxX) / 2,
  y: (cell.minY + cell.maxY) / 2,
})

const valueBetween = (value: number, a: number, b: number) =>
  value > Math.min(a, b) + TOL && value < Math.max(a, b) - TOL

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

export const lineSeparatesCellPair = (
  line: BLine,
  a: InputRect,
  b: InputRect,
) => {
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

export const axisValues = (lines: BLine[], cellContents: InputRect[]) => {
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
