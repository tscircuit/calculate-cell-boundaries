import {
  BasePipelineSolver,
  definePipelineStep,
  type PipelineStep,
} from "@tscircuit/solver-utils"
import type { CellContent, Line, Midline } from "../types"
import { ComputeMidlinesSolver } from "./ComputeMidlinesSolver/ComputeMidlinesSolver"
import { ComputeIntersectionsSolver } from "./ComputeIntersectionsSolver/ComputeIntersectionsSolver"
import { ComputeSegmentsSolver } from "./ComputeSegmentsSolver/ComputeSegmentsSolver"
import { BuildGridSolver } from "./BuildGridSolver/BuildGridSolver"
import { MergeGridSolver } from "./MergeGridSolver/MergeGridSolver"
import { BuildOutlineSolver } from "./BuildOutlineSolver/BuildOutlineSolver"
import { ReduceBoundaryLinesSolver } from "./ReduceBoundaryLinesSolver/ReduceBoundaryLinesSolver"
import { RepairBoundaryLinesSolver } from "./RepairBoundaryLinesSolver/RepairBoundaryLinesSolver"
import { RefineBoundaryLinesSolver } from "./RefineBoundaryLinesSolver/RefineBoundaryLinesSolver"

export interface CellBoundariesInput {
  cellContents: CellContent[]
  containerWidth: number
  containerHeight: number
}

export class CellBoundariesPipeline extends BasePipelineSolver<CellBoundariesInput> {
  computeMidlinesSolver?: ComputeMidlinesSolver
  computeIntersectionsSolver?: ComputeIntersectionsSolver
  computeSegmentsSolver?: ComputeSegmentsSolver
  buildGridSolver?: BuildGridSolver
  mergeGridSolver?: MergeGridSolver
  buildOutlineSolver?: BuildOutlineSolver
  reduceBoundaryLinesSolver?: ReduceBoundaryLinesSolver
  repairBoundaryLinesSolver?: RepairBoundaryLinesSolver
  refineBoundaryLinesSolver?: RefineBoundaryLinesSolver

  pipelineDef: PipelineStep<any>[] = [
    definePipelineStep(
      "computeMidlinesSolver",
      ComputeMidlinesSolver,
      (p: CellBoundariesPipeline) => [
        {
          cellContents: p.inputProblem.cellContents,
          containerWidth: p.inputProblem.containerWidth,
          containerHeight: p.inputProblem.containerHeight,
        },
      ],
    ),
    definePipelineStep(
      "computeIntersectionsSolver",
      ComputeIntersectionsSolver,
      (p: CellBoundariesPipeline) => [
        {
          midlines: p.getSolver<ComputeMidlinesSolver>("computeMidlinesSolver")!
            .midlines,
        },
      ],
    ),
    definePipelineStep(
      "computeSegmentsSolver",
      ComputeSegmentsSolver,
      (p: CellBoundariesPipeline) => [
        {
          midlines: p.getSolver<ComputeMidlinesSolver>("computeMidlinesSolver")!
            .midlines,
          intersections: p.getSolver<ComputeIntersectionsSolver>(
            "computeIntersectionsSolver",
          )!.intersections,
          cellContents: p.inputProblem.cellContents,
        },
      ],
    ),
    definePipelineStep(
      "buildGridSolver",
      BuildGridSolver,
      (p: CellBoundariesPipeline) => [
        {
          allSegments: p.getSolver<ComputeSegmentsSolver>(
            "computeSegmentsSolver",
          )!.allSegments,
          cellContents: p.inputProblem.cellContents,
          containerWidth: p.inputProblem.containerWidth,
          containerHeight: p.inputProblem.containerHeight,
        },
      ],
    ),
    definePipelineStep(
      "mergeGridSolver",
      MergeGridSolver,
      (p: CellBoundariesPipeline) => [
        {
          validSegments:
            p.getSolver<BuildGridSolver>("buildGridSolver")!.validSegments,
          gridRects: p.getSolver<BuildGridSolver>("buildGridSolver")!.gridRects,
          cellContainingRects:
            p.getSolver<BuildGridSolver>("buildGridSolver")!
              .cellContainingRects,
          cellContents: p.inputProblem.cellContents,
        },
      ],
    ),
    definePipelineStep(
      "buildOutlineSolver",
      BuildOutlineSolver,
      (p: CellBoundariesPipeline) => [
        {
          groupedRects:
            p.getSolver<MergeGridSolver>("mergeGridSolver")!.groupedRects,
        },
      ],
    ),
    definePipelineStep(
      "reduceBoundaryLinesSolver",
      ReduceBoundaryLinesSolver,
      (p: CellBoundariesPipeline) => [
        {
          outlineLines:
            p.getSolver<BuildOutlineSolver>("buildOutlineSolver")!.outlineLines,
          cellContents: p.inputProblem.cellContents,
        },
      ],
    ),
    definePipelineStep(
      "repairBoundaryLinesSolver",
      RepairBoundaryLinesSolver,
      (p: CellBoundariesPipeline) => [
        {
          reducedLines: p.getSolver<ReduceBoundaryLinesSolver>(
            "reduceBoundaryLinesSolver",
          )!.reducedLines,
          originalLines: p.getSolver<ReduceBoundaryLinesSolver>(
            "reduceBoundaryLinesSolver",
          )!.mergedOriginalLines,
          cellContents: p.inputProblem.cellContents,
        },
      ],
    ),
    definePipelineStep(
      "refineBoundaryLinesSolver",
      RefineBoundaryLinesSolver,
      (p: CellBoundariesPipeline) => [
        {
          repairedLines: p.getSolver<RepairBoundaryLinesSolver>(
            "repairBoundaryLinesSolver",
          )!.repairedLines,
          cellContents: p.inputProblem.cellContents,
        },
      ],
    ),
  ]

  override finalVisualize() {
    const refinedSolver = this.getSolver<RefineBoundaryLinesSolver>(
      "refineBoundaryLinesSolver",
    )
    const outlineSolver =
      this.getSolver<BuildOutlineSolver>("buildOutlineSolver")
    const lines = refinedSolver?.refinedLines ?? outlineSolver?.outlineLines
    if (!lines) return null
    return {
      rects: this.inputProblem.cellContents.map((c) => ({
        center: { x: c.x + c.width / 2, y: c.y + c.height / 2 },
        width: c.width,
        height: c.height,
        fill: "rgba(255, 165, 0, 0.3)",
        stroke: "#c87000",
        label: c.cellId,
      })),
      lines: lines.map((l) => ({
        points: [l.start, l.end],
        strokeColor: "#000000",
        strokeWidth: 3,
      })),
    }
  }

  override initialVisualize() {
    return {
      rects: this.inputProblem.cellContents.map((c) => ({
        center: { x: c.x + c.width / 2, y: c.y + c.height / 2 },
        width: c.width,
        height: c.height,
        fill: "rgba(255, 165, 0, 0.3)",
        stroke: "#c87000",
        label: c.cellId,
      })),
    }
  }

  override getConstructorParams() {
    return [this.inputProblem] as any
  }

  override getOutput(): {
    midlines: Midline[]
    allSegments: Line[]
    validSegments: Line[]
    mergedRectGroups: CellContent[][]
    cellRects: CellContent[]
    gridRects: CellContent[]
    outlineLines: Line[]
  } {
    return {
      midlines:
        this.getSolver<ComputeMidlinesSolver>("computeMidlinesSolver")
          ?.midlines ?? [],
      allSegments:
        this.getSolver<ComputeSegmentsSolver>("computeSegmentsSolver")
          ?.allSegments ?? [],
      validSegments:
        this.getSolver<BuildGridSolver>("buildGridSolver")?.validSegments ?? [],
      mergedRectGroups:
        this.getSolver<MergeGridSolver>("mergeGridSolver")?.mergedRectGroups ??
        [],
      cellRects: this.inputProblem.cellContents,
      gridRects:
        this.getSolver<BuildGridSolver>("buildGridSolver")?.gridRects ?? [],
      outlineLines:
        this.getSolver<RefineBoundaryLinesSolver>("refineBoundaryLinesSolver")
          ?.refinedLines ??
        this.getSolver<BuildOutlineSolver>("buildOutlineSolver")
          ?.outlineLines ??
        [],
    }
  }
}
