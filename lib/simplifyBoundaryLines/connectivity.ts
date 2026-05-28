import type { Line, Vec2, CellContent } from "../types"
import {
  TOL,
  pointKey,
  pointsEqual,
  isZeroLength,
  lineContainsPoint,
} from "./primitives"
import { lineSeparatesCells } from "./cellSeparation"

export const connectedComponentCount = (lines: Line[]) => {
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

export const pruneNonSeparatingLeaves = (
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
