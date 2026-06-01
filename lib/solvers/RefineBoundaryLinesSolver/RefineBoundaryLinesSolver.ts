import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { CellContent, Line as BLine, InputRect } from "./types"
import {
  separatedCellPairs,
  connectDanglingEndpoints,
  trimDanglingOverhangs,
  mergeAlignedSegments,
} from "./geometry"
import { collapseVerticalDoglegs } from "./collapseVerticalDoglegs"
import { collapseHorizontalSteps } from "./collapseHorizontalSteps"

interface Params {
  repairedLines: BLine[]
  cellContents: CellContent[]
}

enum Stage {
  ConnectDanglingEndpoints,
  CollapseVerticalDoglegs,
  CollapseHorizontalSteps,
  ReconnectDanglingEndpoints,
  TrimDanglingOverhangs,
  MergeAlignedSegments,
}

export class RefineBoundaryLinesSolver extends BaseSolver {
  refinedLines: BLine[] = []

  private _stage = Stage.ConnectDanglingEndpoints
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
    this._currentLines = params.repairedLines
  }

  override _step() {
    const inputRects = this._inputRects

    switch (this._stage) {
      case Stage.ConnectDanglingEndpoints:
        this._currentLines = connectDanglingEndpoints(
          this._currentLines,
          inputRects,
          { preserveOriginalSpan: true },
        )
        break
      case Stage.CollapseVerticalDoglegs:
        this._currentLines = collapseVerticalDoglegs(
          this._currentLines,
          inputRects,
        )
        break
      case Stage.CollapseHorizontalSteps:
        this._currentLines = collapseHorizontalSteps(
          this._currentLines,
          inputRects,
        )
        break
      case Stage.ReconnectDanglingEndpoints:
        this._currentLines = connectDanglingEndpoints(
          this._currentLines,
          inputRects,
          { preserveOriginalSpan: true },
        )
        break
      case Stage.TrimDanglingOverhangs:
        this._currentLines = trimDanglingOverhangs(
          this._currentLines,
          inputRects,
          separatedCellPairs(this._currentLines, inputRects),
        )
        break
      case Stage.MergeAlignedSegments:
        this._currentLines = mergeAlignedSegments(this._currentLines)
        this.refinedLines = this._currentLines
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
    return this.refinedLines
  }

  override getConstructorParams() {
    return [this.params] as any
  }

  override visualize(): GraphicsObject {
    const { cellContents, repairedLines } = this.params

    return {
      rects: cellContents.map((c) => ({
        center: { x: c.x + c.width / 2, y: c.y + c.height / 2 },
        width: c.width,
        height: c.height,
        fill: "rgba(255, 165, 0, 0.2)",
        stroke: "#c87000",
      })),
      lines: [
        ...repairedLines.map((l) => ({
          points: [l.start, l.end] as [typeof l.start, typeof l.end],
          strokeColor: "rgba(180, 180, 180, 0.4)",
          strokeWidth: 1,
          strokeDash: [4, 4],
        })),
        ...this._currentLines.map((l) => ({
          points: [l.start, l.end] as [typeof l.start, typeof l.end],
          strokeColor: "#000000",
          strokeWidth: 3,
        })),
      ],
    }
  }
}
