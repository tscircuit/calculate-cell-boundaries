import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { CellContent, Line as BLine, InputRect } from "./types"
import { separatedCellPairs } from "./geometry"
import { restoreMissingSeparators } from "./restoreMissingSeparators"
import { fixSharedCellRegions } from "./fixSharedCellRegions"
import { removeRedundantSeparators } from "./removeRedundantSeparators"

interface Params {
  reducedLines: BLine[]
  originalLines: BLine[]
  cellContents: CellContent[]
}

enum Stage {
  RestoreMissingSeparators,
  FixSharedCellRegions,
  RemoveRedundantSeparators,
}

export class RepairBoundaryLinesSolver extends BaseSolver {
  repairedLines: BLine[] = []

  private _stage = Stage.RestoreMissingSeparators
  private _currentLines: BLine[] = []
  private _inputRects: InputRect[]

  constructor(private params: Params) {
    super()
    this._inputRects = params.cellContents.map((c) => ({
      minX: c.x,
      minY: c.y,
      maxX: c.x + c.width,
      maxY: c.y + c.height,
    }))
    this._currentLines = params.reducedLines
  }

  override _step() {
    const { originalLines } = this.params
    const inputRects = this._inputRects

    switch (this._stage) {
      case Stage.RestoreMissingSeparators: {
        const requiredPairs = separatedCellPairs(originalLines, inputRects)
        this._currentLines = restoreMissingSeparators(
          this._currentLines,
          originalLines,
          inputRects,
          requiredPairs,
        )
        break
      }
      case Stage.FixSharedCellRegions:
        this._currentLines = fixSharedCellRegions(
          this._currentLines,
          originalLines,
          inputRects,
        )
        break
      case Stage.RemoveRedundantSeparators:
        this._currentLines = removeRedundantSeparators(
          this._currentLines,
          inputRects,
        )
        this.repairedLines = this._currentLines
        this.solved = true
        break
    }

    const nextStage = this.getNextStage(this._stage)
    if (nextStage) this._stage = nextStage
  }

  getNextStage(stage: Stage) {
    const stages = Object.values(Stage)
    return stages[stages.indexOf(stage) + 1] as Stage
  }

  override getOutput() {
    return this.repairedLines
  }

  override getConstructorParams() {
    return [this.params] as any
  }

  override visualize(): GraphicsObject {
    const { cellContents, reducedLines } = this.params

    return {
      rects: cellContents.map((c) => ({
        center: { x: c.x + c.width / 2, y: c.y + c.height / 2 },
        width: c.width,
        height: c.height,
        fill: "rgba(255, 165, 0, 0.2)",
        stroke: "#c87000",
      })),
      lines: [
        ...reducedLines.map((l) => ({
          points: [l.start, l.end] as [typeof l.start, typeof l.end],
          strokeColor: "rgba(180, 180, 180, 0.4)",
          strokeWidth: 1,
          strokeDash: [4, 4],
        })),
        ...this._currentLines.map((l) => ({
          points: [l.start, l.end] as [typeof l.start, typeof l.end],
          strokeColor: "#cc5500",
          strokeWidth: 2,
        })),
      ],
    }
  }
}
