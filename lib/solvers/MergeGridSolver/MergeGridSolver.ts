import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { CellContent, Line, WorkRect } from "./types"
import {
  areAdjacent,
  edgeToEdgeDistance,
  POINT_COMPARISON_TOLERANCE,
  pointsEqual,
} from "./geometry"

interface Params {
  validSegments: Line[]
  gridRects: CellContent[]
  cellContainingRects: CellContent[]
  cellContents: CellContent[]
}

const GROUP_FILLS = [
  "rgba(100, 149, 237, 0.35)",
  "rgba(144, 238, 144, 0.35)",
  "rgba(255, 182, 193, 0.35)",
  "rgba(221, 160, 221, 0.35)",
  "rgba(255, 218, 185, 0.35)",
  "rgba(175, 238, 238, 0.35)",
  "rgba(250, 200, 100, 0.35)",
  "rgba(180, 220, 180, 0.35)",
]

const GROUP_STROKES = [
  "#6495ed",
  "#3cb371",
  "#ff69b4",
  "#9370db",
  "#ffa07a",
  "#20b2aa",
  "#daa520",
  "#5f9e5f",
]

export class MergeGridSolver extends BaseSolver {
  mergedRectGroups: CellContent[][] = []
  groupedRects: Array<CellContent & { groupId: number }> = []

  private _phase = 0
  private _workRects: WorkRect[] = []
  private _unmergedQueue: WorkRect[] = []

  constructor(private params: Params) {
    super()
  }

  override _step() {
    const { validSegments, gridRects, cellContainingRects, cellContents } =
      this.params

    if (this._phase === 0) {
      // Initialize workRects with boundary segment distances
      this._workRects = gridRects.map((r) => {
        let minDist = Infinity
        const { x, y, width, height } = r

        validSegments.forEach((seg) => {
          const sx1 = Math.min(seg.start.x, seg.end.x)
          const sx2 = Math.max(seg.start.x, seg.end.x)
          const sy1 = Math.min(seg.start.y, seg.end.y)
          const sy2 = Math.max(seg.start.y, seg.end.y)
          const isH =
            Math.abs(seg.start.y - seg.end.y) < POINT_COMPARISON_TOLERANCE
          const isV =
            Math.abs(seg.start.x - seg.end.x) < POINT_COMPARISON_TOLERANCE

          let onBoundary = false
          if (isH) {
            if (
              (Math.abs(sy1 - y) < POINT_COMPARISON_TOLERANCE ||
                Math.abs(sy1 - (y + height)) < POINT_COMPARISON_TOLERANCE) &&
              sx1 < x + width - POINT_COMPARISON_TOLERANCE &&
              sx2 > x + POINT_COMPARISON_TOLERANCE &&
              Math.max(sx1, x) + POINT_COMPARISON_TOLERANCE <
                Math.min(sx2, x + width)
            ) {
              onBoundary = true
            }
          } else if (isV) {
            if (
              (Math.abs(sx1 - x) < POINT_COMPARISON_TOLERANCE ||
                Math.abs(sx1 - (x + width)) < POINT_COMPARISON_TOLERANCE) &&
              sy1 < y + height - POINT_COMPARISON_TOLERANCE &&
              sy2 > y + POINT_COMPARISON_TOLERANCE &&
              Math.max(sy1, y) + POINT_COMPARISON_TOLERANCE <
                Math.min(sy2, y + height)
            ) {
              onBoundary = true
            }
          }

          if (onBoundary && seg.distanceToAnyCell !== undefined) {
            minDist = Math.min(minDist, seg.distanceToAnyCell)
          }
        })

        return {
          ...r,
          merged: false,
          groupId: null,
          minBoundingSegmentDistance: minDist,
        }
      })

      // Seed groups from cell-containing rects
      cellContainingRects.forEach((contRect, idx) => {
        const matchingWorkRect = this._workRects.find(
          (w) =>
            pointsEqual({ x: w.x, y: w.y }, { x: contRect.x, y: contRect.y }) &&
            Math.abs(w.width - contRect.width) < POINT_COMPARISON_TOLERANCE &&
            Math.abs(w.height - contRect.height) < POINT_COMPARISON_TOLERANCE,
        )
        if (matchingWorkRect) {
          matchingWorkRect.merged = true
          matchingWorkRect.groupId = idx
        }
      })

      this._unmergedQueue = this._workRects
        .filter((r) => !r.merged)
        .sort(
          (a, b) => a.minBoundingSegmentDistance - b.minBoundingSegmentDistance,
        )

      this._updateOutput()
      this._phase = 1
      return
    }

    // Phase 1: merge one rect per step
    if (this._unmergedQueue.length === 0) {
      this._finalize()
      this.solved = true
      return
    }

    let mergedAny = false
    const stillUnmerged: WorkRect[] = []

    for (const rect of this._unmergedQueue) {
      const workRect = this._workRects.find((w) => w.cellId === rect.cellId)
      if (!workRect || workRect.merged) continue

      const neighbours = this._workRects.filter(
        (o) => o.merged && areAdjacent(workRect, o),
      )

      if (neighbours.length > 0 && !mergedAny) {
        workRect.merged = true
        if (neighbours.length === 1) {
          workRect.groupId = neighbours[0]!.groupId
        } else {
          let bestGroupId: number | null = null
          let minDist = Infinity
          for (const nb of neighbours) {
            if (nb.groupId === null) continue
            const origCell = cellContents[nb.groupId]
            if (!origCell) continue
            const dist = edgeToEdgeDistance(workRect, origCell)
            if (
              dist < minDist ||
              (dist === minDist &&
                (bestGroupId === null ||
                  (nb.groupId !== null && nb.groupId < bestGroupId)))
            ) {
              minDist = dist
              bestGroupId = nb.groupId
            }
          }
          workRect.groupId = bestGroupId
        }
        mergedAny = true
      } else {
        stillUnmerged.push(rect)
      }
    }

    this._unmergedQueue = stillUnmerged.sort(
      (a, b) => a.minBoundingSegmentDistance - b.minBoundingSegmentDistance,
    )

    if (!mergedAny) {
      this._finalize()
      this.solved = true
    }

    this._updateOutput()
  }

  private _updateOutput() {
    this.groupedRects = this._workRects.filter(
      (r): r is WorkRect & { groupId: number } => r.groupId !== null,
    )
  }

  private _finalize() {
    const { cellContainingRects, cellContents } = this.params
    this.mergedRectGroups = []
    cellContainingRects.forEach((containerRect, idx) => {
      const groupRects = this._workRects
        .filter((r) => r.merged && r.groupId === idx)
        .map(
          ({
            merged: _m,
            groupId: _g,
            minBoundingSegmentDistance: _d,
            ...plain
          }) => plain,
        )
      const cellRect = cellContents[idx]
      if (!cellRect) return
      this.mergedRectGroups.push([
        containerRect,
        cellRect,
        ...groupRects.filter((r) => r.cellId !== containerRect.cellId),
      ])
    })
  }

  override getOutput() {
    return {
      mergedRectGroups: this.mergedRectGroups,
      groupedRects: this.groupedRects,
    }
  }

  override getConstructorParams() {
    return [this.params] as any
  }

  override visualize(): GraphicsObject {
    const { cellContents } = this.params
    return {
      rects: [
        ...this.groupedRects.map((r) => ({
          center: { x: r.x + r.width / 2, y: r.y + r.height / 2 },
          width: r.width,
          height: r.height,
          fill: GROUP_FILLS[r.groupId % GROUP_FILLS.length],
          stroke: GROUP_STROKES[r.groupId % GROUP_STROKES.length],
        })),
        ...this._workRects
          .filter((r) => !r.merged)
          .map((r) => ({
            center: { x: r.x + r.width / 2, y: r.y + r.height / 2 },
            width: r.width,
            height: r.height,
            fill: "rgba(200, 200, 200, 0.2)",
            stroke: "#aaaaaa",
            strokeDash: [3, 3],
          })),
        ...cellContents.map((c) => ({
          center: { x: c.x + c.width / 2, y: c.y + c.height / 2 },
          width: c.width,
          height: c.height,
          fill: "rgba(255, 165, 0, 0.5)",
          stroke: "#c87000",
          label: c.cellId,
        })),
      ],
    }
  }
}
