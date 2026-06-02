import { CellBoundariesPipeline } from "./solvers/CellBoundariesPipeline"
import type { CellContent, Line, Point } from "./types"

const offsetLine = <T extends { start: Point; end: Point }>(
  l: T,
  offsetX: number,
  offsetY: number,
): T => ({
  ...l,
  start: { x: l.start.x + offsetX, y: l.start.y + offsetY },
  end: { x: l.end.x + offsetX, y: l.end.y + offsetY },
})

export const computeBoundsFromCellContents = (
  cellContents: { minX: number; minY: number; maxX: number; maxY: number }[],
) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const cell of cellContents) {
    minX = Math.min(minX, cell.minX)
    minY = Math.min(minY, cell.minY)
    maxX = Math.max(maxX, cell.maxX)
    maxY = Math.max(maxY, cell.maxY)
  }
  return { minX, minY, maxX, maxY }
}

const normalizeSegment = (segment: Line): Line => {
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
  return { ...segment, start, end }
}

const mergeAlignedSegments = (segments: Line[]): Line[] => {
  if (!segments || segments.length === 0) {
    return []
  }

  const normalizedSegments = segments.map(normalizeSegment)

  const horizontalSegments: Line[] = []
  const verticalSegments: Line[] = []

  for (const seg of normalizedSegments) {
    if (seg.start.y === seg.end.y) {
      horizontalSegments.push(seg)
    } else if (seg.start.x === seg.end.x) {
      verticalSegments.push(seg)
    }
  }

  const mergedSegments: Line[] = []

  const horizontalByY = new Map<number, Line[]>()
  for (const seg of horizontalSegments) {
    const bucket = horizontalByY.get(seg.start.y) ?? []
    bucket.push(seg)
    horizontalByY.set(seg.start.y, bucket)
  }

  for (const [, segs] of horizontalByY) {
    segs.sort((a, b) => a.start.x - b.start.x)
    let currentMerged: Line | undefined
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

  const verticalByX = new Map<number, Line[]>()
  for (const seg of verticalSegments) {
    const bucket = verticalByX.get(seg.start.x) ?? []
    bucket.push(seg)
    verticalByX.set(seg.start.x, bucket)
  }

  for (const [, segs] of verticalByX) {
    segs.sort((a, b) => a.start.y - b.start.y)
    let currentMerged: Line | undefined
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

const pointSortKey = (A: Point, B: Point) =>
  A.x !== B.x ? A.x - B.x : A.y - B.y

export const calculateCellBoundaries = (
  inputCellContents: Omit<CellContent, "cellId">[],
  containerWidth?: number,
  containerHeight?: number,
) => {
  const cellContents = inputCellContents.map((c, i) => ({
    ...c,
    cellId: `cell-${i}`,
  }))

  const bounds = computeBoundsFromCellContents(
    cellContents.map((c) => ({
      minX: c.x,
      minY: c.y,
      maxX: c.x + c.width,
      maxY: c.y + c.height,
    })),
  )

  const offsetX = bounds.minX
  const offsetY = bounds.minY
  containerWidth ??= bounds.maxX - bounds.minX
  containerHeight ??= bounds.maxY - bounds.minY

  const normalizedCells = cellContents.map((c) => ({
    ...c,
    x: c.x - offsetX,
    y: c.y - offsetY,
  }))

  const pipeline = new CellBoundariesPipeline({
    cellContents: normalizedCells,
    containerWidth,
    containerHeight,
  })
  pipeline.solve()

  const output = pipeline.getOutput()

  const applyLineOffset = (l: Line) => offsetLine(l, offsetX, offsetY)

  const rawOutlineLines = output.outlineLines.map(applyLineOffset)
  const outlineLines = mergeAlignedSegments(rawOutlineLines)
    .map((l) => ({
      start: pointSortKey(l.start, l.end) < 0 ? l.start : l.end,
      end: pointSortKey(l.start, l.end) < 0 ? l.end : l.start,
    }))
    .sort(
      (a, b) => pointSortKey(a.start, b.start) || pointSortKey(a.end, b.end),
    )

  return outlineLines
}
