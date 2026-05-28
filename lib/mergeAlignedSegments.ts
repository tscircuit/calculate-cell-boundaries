import type { Line } from "./types"

// Normalizes a segment so that for horizontal lines, start.x <= end.x,
// and for vertical lines, start.y <= end.y.
const normalizeSegment = (segment: Line): Line => {
  let { start, end } = segment
  // For horizontal lines (start.y === end.y), ensure start.x <= end.x
  if (start.y === end.y && start.x > end.x) {
    ;[start, end] = [
      { x: end.x, y: start.y },
      { x: start.x, y: end.y },
    ]
  }
  // For vertical lines (start.x === end.x), ensure start.y <= end.y
  else if (start.x === end.x && start.y > end.y) {
    ;[start, end] = [
      { x: start.x, y: end.y },
      { x: end.x, y: start.y },
    ]
  }
  return { start, end }
}

export const mergeAlignedSegments = (segments: Line[]): Line[] => {
  if (!segments || segments.length === 0) {
    return []
  }

  const normalizedSegments = segments.map(normalizeSegment)

  const horizontalSegments: Line[] = []
  const verticalSegments: Line[] = []

  for (const seg of normalizedSegments) {
    if (seg.start.y === seg.end.y) {
      // Horizontal
      horizontalSegments.push(seg)
    } else if (seg.start.x === seg.end.x) {
      // Vertical
      verticalSegments.push(seg)
    }
    // Non-axis-aligned segments are ignored for merging
  }

  const mergedSegments: Line[] = []

  // Merge horizontal segments
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

  // Merge vertical segments
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
