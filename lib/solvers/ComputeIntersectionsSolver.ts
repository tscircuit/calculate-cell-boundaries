import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { Midline, Intersection } from "../utils"
import { lineIntersection } from "../utils"

interface Params {
  midlines: Midline[]
}

export class ComputeIntersectionsSolver extends BaseSolver {
  intersections: Intersection[] = []

  private _outerIdx = 0

  constructor(private params: Params) {
    super()
  }

  override _step() {
    const { midlines } = this.params

    if (midlines.length <= 1) {
      this.solved = true
      return
    }

    if (this._outerIdx >= midlines.length - 1) {
      this.solved = true
      return
    }

    const midlineA = midlines[this._outerIdx]!
    for (const midlineB of midlines.slice(this._outerIdx + 1)) {
      const intersection = lineIntersection(midlineA, midlineB)
      if (intersection) {
        this.intersections.push({
          point: intersection,
          midlineIds: [midlineA.id, midlineB.id],
        })
      }
    }

    this._outerIdx++
    if (this._outerIdx >= midlines.length - 1) this.solved = true
  }

  override getOutput() {
    return this.intersections
  }

  override getConstructorParams() {
    return [this.params] as any
  }

  override visualize(): GraphicsObject {
    const { midlines } = this.params
    const activeMidline = midlines[this._outerIdx]

    return {
      lines: midlines.map((m) => ({
        points: [m.start, m.end],
        strokeColor: m === activeMidline ? "#2196f3" : "#cccccc",
        strokeWidth: m === activeMidline ? 2.5 : 1,
        strokeDash: m === activeMidline ? undefined : [4, 4],
      })),
      points: this.intersections.map((int) => ({
        x: int.point.x,
        y: int.point.y,
        color: "#e63946",
        label: `(${int.point.x.toFixed(1)}, ${int.point.y.toFixed(1)})`,
      })),
    }
  }
}
