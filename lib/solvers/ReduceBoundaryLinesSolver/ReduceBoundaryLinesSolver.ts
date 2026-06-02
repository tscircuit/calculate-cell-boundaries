import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import type { CellContent, Line as BLine, InputRect } from "./types"
import {
  connectDanglingEndpoints,
  trimDanglingOverhangs,
  mergeAlignedSegments,
} from "./geometry"
import { simplifyChains } from "./simplifyChains"
import { alignParallelLinesAcrossConnectors } from "./alignParallelLinesAcrossConnectors"
import { removeRedundantParallelBridges } from "./removeRedundantParallelBridges"

interface Params {
  outlineLines: BLine[]
  cellContents: CellContent[]
}

enum Stage {
  MergeAlignedSegments,
  SimplifyChains,
  ConnectDanglingEndpoints,
  AlignParallelLinesAcrossConnectors,
  RemoveRedundantParallelBridges,
  TrimDanglingOverhangs,
}

export class ReduceBoundaryLinesSolver extends BaseSolver {
  mergedOriginalLines: BLine[] = []
  reducedLines: BLine[] = []

  private _stage = Stage.MergeAlignedSegments
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
  }

  override _step() {
    const { outlineLines } = this.params
    const inputRects = this._inputRects

    switch (this._stage) {
      case Stage.MergeAlignedSegments:
        this._currentLines = mergeAlignedSegments(
          outlineLines.map((l) => ({ start: l.start, end: l.end })),
        )
        this.mergedOriginalLines = this._currentLines
        break
      case Stage.SimplifyChains:
        this._currentLines = simplifyChains(this._currentLines, inputRects)
        break
      case Stage.ConnectDanglingEndpoints:
        this._currentLines = connectDanglingEndpoints(
          this._currentLines,
          inputRects,
        )
        break
      case Stage.AlignParallelLinesAcrossConnectors:
        this._currentLines = alignParallelLinesAcrossConnectors(
          this._currentLines,
          inputRects,
        )
        break
      case Stage.RemoveRedundantParallelBridges:
        this._currentLines = removeRedundantParallelBridges(
          this._currentLines,
          inputRects,
        )
        break
      case Stage.TrimDanglingOverhangs:
        this._currentLines = trimDanglingOverhangs(
          this._currentLines,
          inputRects,
        )
        this.reducedLines = this._currentLines
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
    return this.reducedLines
  }

  override getConstructorParams() {
    return [this.params] as any
  }

  override visualize(): GraphicsObject {
    const { cellContents, outlineLines } = this.params

    return {
      rects: cellContents.map((c) => ({
        center: { x: c.x + c.width / 2, y: c.y + c.height / 2 },
        width: c.width,
        height: c.height,
        fill: "rgba(255, 165, 0, 0.2)",
        stroke: "#c87000",
      })),
      lines: [
        ...outlineLines.map((l) => ({
          points: [l.start, l.end] as [typeof l.start, typeof l.end],
          strokeColor: "rgba(180, 180, 180, 0.4)",
          strokeWidth: 1,
          strokeDash: [4, 4],
        })),
        ...this._currentLines.map((l) => ({
          points: [l.start, l.end] as [typeof l.start, typeof l.end],
          strokeColor: "#0055cc",
          strokeWidth: 2,
        })),
      ],
    }
  }
}
