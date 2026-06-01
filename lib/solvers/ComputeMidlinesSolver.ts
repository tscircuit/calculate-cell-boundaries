import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { CellContent, Midline } from "../utils"

interface Params {
  cellContents: CellContent[]
  containerWidth: number
  containerHeight: number
}

export class ComputeMidlinesSolver extends BaseSolver {
  midlines: Midline[] = []

  private _pairIdx = 0
  private _allPairs: [number, number][] = []

  constructor(private params: Params) {
    super()
    const { cellContents } = params
    for (let i = 0; i < cellContents.length; i++) {
      for (let j = i + 1; j < cellContents.length; j++) {
        this._allPairs.push([i, j])
      }
    }
  }

  override _step() {
    const { cellContents, containerWidth, containerHeight } = this.params

    if (this._pairIdx >= this._allPairs.length) {
      this.solved = true
      return
    }

    const [i, j] = this._allPairs[this._pairIdx]!
    const cell1 = cellContents[i]!
    const cell2 = cellContents[j]!

    const cell1Right = cell1.x + cell1.width
    const cell2Right = cell2.x + cell2.width
    const cell1Bottom = cell1.y + cell1.height
    const cell2Bottom = cell2.y + cell2.height

    if (cell1Right < cell2.x || cell2Right < cell1.x) {
      const midX =
        cell1Right < cell2.x
          ? (cell1Right + cell2.x) / 2
          : (cell2Right + cell1.x) / 2
      this.midlines.push({
        id: `midline-${this.midlines.length}`,
        start: { x: midX, y: 0 },
        end: { x: midX, y: containerHeight },
        cellIds: [cell1.cellId, cell2.cellId],
        type: "vertical",
      })
    }

    if (cell1Bottom < cell2.y || cell2Bottom < cell1.y) {
      const midY =
        cell1Bottom < cell2.y
          ? (cell1Bottom + cell2.y) / 2
          : (cell2Bottom + cell1.y) / 2
      this.midlines.push({
        id: `midline-${this.midlines.length}`,
        start: { x: 0, y: midY },
        end: { x: containerWidth, y: midY },
        cellIds: [cell1.cellId, cell2.cellId],
        type: "horizontal",
      })
    }

    this._pairIdx++
    if (this._pairIdx >= this._allPairs.length) this.solved = true
  }

  override getOutput() {
    return this.midlines
  }

  override getConstructorParams() {
    return [this.params] as any
  }

  override visualize(): GraphicsObject {
    const { cellContents } = this.params
    const currentPair = this._allPairs[this._pairIdx]
    const highlightIds = currentPair
      ? new Set([
          cellContents[currentPair[0]]?.cellId,
          cellContents[currentPair[1]]?.cellId,
        ])
      : new Set<string | undefined>()

    return {
      rects: cellContents.map((c) => ({
        center: { x: c.x + c.width / 2, y: c.y + c.height / 2 },
        width: c.width,
        height: c.height,
        fill: highlightIds.has(c.cellId)
          ? "rgba(255, 80, 80, 0.45)"
          : "rgba(255, 165, 0, 0.3)",
        stroke: highlightIds.has(c.cellId) ? "#ff2020" : "#c87000",
        label: c.cellId,
      })),
      lines: this.midlines.map((m) => ({
        points: [m.start, m.end],
        strokeColor: "#888888",
        strokeDash: [4, 4],
        label: m.id,
      })),
    }
  }
}
