import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { CellContent, Line } from "./types"
import { lineIntersectsRectangle, pairs, rectsOverlap } from "./geometry"

interface Params {
  allSegments: Line[]
  cellContents: CellContent[]
  containerWidth: number
  containerHeight: number
}

const GROUP_COLORS = [
  "rgba(100, 149, 237, 0.25)",
  "rgba(144, 238, 144, 0.25)",
  "rgba(255, 182, 193, 0.25)",
  "rgba(221, 160, 221, 0.25)",
  "rgba(255, 218, 185, 0.25)",
  "rgba(175, 238, 238, 0.25)",
]

export class BuildGridSolver extends BaseSolver {
  validSegments: Line[] = []
  cellContainingRects: CellContent[] = []
  gridRects: CellContent[] = []

  private _phase = 0
  private _segIdx = 0
  private _acceptedSegs: Line[] = []
  private _rejectedSegs: Line[] = []

  constructor(private params: Params) {
    super()
  }

  override _step() {
    const { allSegments, cellContents, containerWidth, containerHeight } =
      this.params

    if (this._phase === 0) {
      if (this._segIdx >= allSegments.length) {
        this._phase = 1
        return
      }
      const seg = allSegments[this._segIdx]!
      const valid = !cellContents.some((c) =>
        lineIntersectsRectangle(seg.start, seg.end, c),
      )
      if (valid) this._acceptedSegs.push(seg)
      else this._rejectedSegs.push(seg)
      this._segIdx++
      return
    }

    // Phase 1: build grid from accepted segments
    const verticalXs = new Set<number>([0, containerWidth])
    const horizontalYs = new Set<number>([0, containerHeight])
    this._acceptedSegs.forEach((seg) => {
      if (Math.abs(seg.start.x - seg.end.x) < 0.001) verticalXs.add(seg.start.x)
      else horizontalYs.add(seg.start.y)
    })
    const xs = Array.from(verticalXs).sort((a, b) => a - b)
    const ys = Array.from(horizontalYs).sort((a, b) => a - b)

    const cellContainingRects: CellContent[] = []
    cellContents.forEach((cell) => {
      const left = xs.filter((v) => v <= cell.x).pop() ?? xs[0]!
      const right =
        xs.find((v) => v >= cell.x + cell.width) ?? xs[xs.length - 1]!
      const top = ys.filter((v) => v <= cell.y).pop() ?? ys[0]!
      const bot =
        ys.find((v) => v >= cell.y + cell.height) ?? ys[ys.length - 1]!
      cellContainingRects.push({
        cellId: `contain-${cell.cellId}`,
        x: left,
        y: top,
        width: Math.max(0, right - left),
        height: Math.max(0, bot - top),
      })
    })

    const gridRects: CellContent[] = []
    let gridRectId = 0
    for (const [x0, x1] of pairs(xs)) {
      if (x1 - x0 <= 0) continue
      for (const [y0, y1] of pairs(ys)) {
        if (y1 - y0 <= 0) continue
        const candidate: CellContent = {
          cellId: `gridRect-${gridRectId++}`,
          x: x0,
          y: y0,
          width: x1 - x0,
          height: y1 - y0,
        }
        if (cellContents.some((c) => rectsOverlap(candidate, c))) continue
        gridRects.push(candidate)
      }
    }
    cellContainingRects.forEach((r) => {
      const key = `${r.x},${r.y},${r.width},${r.height}`
      if (
        !gridRects.some((g) => `${g.x},${g.y},${g.width},${g.height}` === key)
      )
        gridRects.push(r)
    })

    this.validSegments = this._acceptedSegs
    this.cellContainingRects = cellContainingRects
    this.gridRects = gridRects
    this.solved = true
  }

  override getOutput() {
    return {
      validSegments: this.validSegments,
      cellContainingRects: this.cellContainingRects,
      gridRects: this.gridRects,
    }
  }

  override getConstructorParams() {
    return [this.params] as any
  }

  override visualize(): GraphicsObject {
    const { cellContents, allSegments } = this.params
    const currentSeg = allSegments[this._segIdx]

    return {
      rects: [
        ...this.gridRects.map((r, i) => ({
          center: { x: r.x + r.width / 2, y: r.y + r.height / 2 },
          width: r.width,
          height: r.height,
          fill: GROUP_COLORS[i % GROUP_COLORS.length],
          stroke: "#999999",
        })),
        ...cellContents.map((c) => ({
          center: { x: c.x + c.width / 2, y: c.y + c.height / 2 },
          width: c.width,
          height: c.height,
          fill: "rgba(255, 165, 0, 0.4)",
          stroke: "#c87000",
          label: c.cellId,
        })),
      ],
      lines: [
        ...this._rejectedSegs.map((seg) => ({
          points: [seg.start, seg.end] as [typeof seg.start, typeof seg.end],
          strokeColor: "rgba(220, 50, 50, 0.35)",
          strokeDash: [3, 3],
          strokeWidth: 1,
        })),
        ...this._acceptedSegs.map((seg) => ({
          points: [seg.start, seg.end] as [typeof seg.start, typeof seg.end],
          strokeColor: "#2196f3",
          strokeWidth: 1.5,
        })),
        ...(currentSeg && this._phase === 0
          ? [
              {
                points: [currentSeg.start, currentSeg.end] as [
                  typeof currentSeg.start,
                  typeof currentSeg.end,
                ],
                strokeColor: "#ff9800",
                strokeWidth: 3,
              },
            ]
          : []),
        ...this.validSegments.map((seg) => ({
          points: [seg.start, seg.end] as [typeof seg.start, typeof seg.end],
          strokeColor: "#2196f3",
          strokeWidth: 2,
        })),
      ],
    }
  }
}
