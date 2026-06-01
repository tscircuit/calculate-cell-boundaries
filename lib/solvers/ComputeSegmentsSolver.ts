import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { CellContent, Midline, Intersection, Line } from "../utils"
import { segmentDistanceToAnyCell, pairs } from "../utils"

interface Params {
  midlines: Midline[]
  intersections: Intersection[]
  cellContents: CellContent[]
}

export class ComputeSegmentsSolver extends BaseSolver {
  allSegments: Line[] = []

  private _midlineIdx = 0
  private _segmentId = 0

  constructor(private params: Params) {
    super()
  }

  override _step() {
    const { midlines, intersections, cellContents } = this.params

    if (this._midlineIdx >= midlines.length) {
      this.solved = true
      return
    }

    const midline = midlines[this._midlineIdx]!
    const intersectionPoints = intersections
      .filter((int) => int.midlineIds.includes(midline.id))
      .map((int) => int.point)
      .sort((a, b) => (midline.type === "vertical" ? a.y - b.y : a.x - b.x))

    for (const [start, end] of pairs([
      midline.start,
      ...intersectionPoints,
      midline.end,
    ])) {
      this.allSegments.push({
        id: `segment-${this._segmentId++}`,
        start,
        end,
        fromCellIds: midline.cellIds,
        distanceToAnyCell: segmentDistanceToAnyCell(start, end, cellContents),
      })
    }

    this._midlineIdx++
    if (this._midlineIdx >= midlines.length) this.solved = true
  }

  override getOutput() {
    return this.allSegments
  }

  override getConstructorParams() {
    return [this.params] as any
  }

  override visualize(): GraphicsObject {
    const { cellContents, midlines } = this.params
    const activeMidline = midlines[this._midlineIdx]
    const maxDist = Math.max(
      ...this.allSegments.map((s) => s.distanceToAnyCell ?? 0),
      1,
    )

    return {
      rects: cellContents.map((c) => ({
        center: { x: c.x + c.width / 2, y: c.y + c.height / 2 },
        width: c.width,
        height: c.height,
        fill: "rgba(255, 165, 0, 0.2)",
        stroke: "#c87000",
      })),
      lines: [
        ...this.allSegments.map((seg) => {
          const t = (seg.distanceToAnyCell ?? 0) / maxDist
          const r = Math.round(255 * (1 - t))
          const g = Math.round(200 * t)
          return {
            points: [seg.start, seg.end] as [typeof seg.start, typeof seg.end],
            strokeColor: `rgb(${r}, ${g}, 80)`,
            strokeWidth: 1.5,
          }
        }),
        ...(activeMidline
          ? [
              {
                points: [activeMidline.start, activeMidline.end] as [
                  typeof activeMidline.start,
                  typeof activeMidline.end,
                ],
                strokeColor: "#2196f3",
                strokeWidth: 2,
                strokeDash: [8, 4],
              },
            ]
          : []),
      ],
    }
  }
}
