import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { CellContent, Line, Point } from "../utils"
import { POINT_COMPARISON_TOLERANCE, getSegmentKey } from "../utils"

interface Params {
  groupedRects: Array<CellContent & { groupId: number }>
}

const GROUP_FILLS = [
  "rgba(100, 149, 237, 0.25)",
  "rgba(144, 238, 144, 0.25)",
  "rgba(255, 182, 193, 0.25)",
  "rgba(221, 160, 221, 0.25)",
  "rgba(255, 218, 185, 0.25)",
  "rgba(175, 238, 238, 0.25)",
  "rgba(250, 200, 100, 0.25)",
  "rgba(180, 220, 180, 0.25)",
]

export class BuildOutlineSolver extends BaseSolver {
  outlineLines: Line[] = []

  private _outerIdx = 0
  private _segMap = new Map<string, { start: Point; end: Point }>()

  constructor(private params: Params) {
    super()
  }

  override _step() {
    const { groupedRects } = this.params
    const TOL = POINT_COMPARISON_TOLERANCE

    if (this._outerIdx >= groupedRects.length) {
      this._rebuildLines()
      this.solved = true
      return
    }

    const a = groupedRects[this._outerIdx]!

    for (const b of groupedRects.slice(this._outerIdx + 1)) {
      if (a.groupId === b.groupId) continue

      const aRight = a.x + a.width
      const bRight = b.x + b.width

      if (Math.abs(aRight - b.x) < TOL || Math.abs(bRight - a.x) < TOL) {
        const x = Math.abs(aRight - b.x) < TOL ? aRight : bRight
        const y0 = Math.max(a.y, b.y)
        const y1 = Math.min(a.y + a.height, b.y + b.height)
        if (y1 - y0 > TOL) {
          const s = { x, y: y0 }
          const e = { x, y: y1 }
          this._segMap.set(getSegmentKey(s, e), { start: s, end: e })
        }
      }

      const aBot = a.y + a.height
      const bBot = b.y + b.height
      if (Math.abs(aBot - b.y) < TOL || Math.abs(bBot - a.y) < TOL) {
        const y = Math.abs(aBot - b.y) < TOL ? aBot : bBot
        const x0 = Math.max(a.x, b.x)
        const x1 = Math.min(a.x + a.width, b.x + b.width)
        if (x1 - x0 > TOL) {
          const s = { x: x0, y }
          const e = { x: x1, y }
          this._segMap.set(getSegmentKey(s, e), { start: s, end: e })
        }
      }
    }

    this._outerIdx++
    this._rebuildLines()

    if (this._outerIdx >= groupedRects.length) this.solved = true
  }

  private _rebuildLines() {
    let id = 0
    this.outlineLines = []
    this._segMap.forEach(({ start, end }) => {
      this.outlineLines.push({ id: `outline-${id++}`, start, end })
    })
  }

  override getOutput() {
    return this.outlineLines
  }

  override getConstructorParams() {
    return [this.params] as any
  }

  override visualize(): GraphicsObject {
    const { groupedRects } = this.params
    const activeRect = groupedRects[this._outerIdx]

    return {
      rects: groupedRects.map((r) => ({
        center: {
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
        },
        width: r.width,
        height: r.height,
        fill:
          r === activeRect
            ? "rgba(255, 152, 0, 0.45)"
            : GROUP_FILLS[r.groupId % GROUP_FILLS.length],
        stroke: r === activeRect ? "#ff6600" : "#cccccc",
      })),
      lines: this.outlineLines.map((l) => ({
        points: [l.start, l.end],
        strokeColor: "#000000",
        strokeWidth: 3,
      })),
    }
  }
}
