import { expect, test } from "bun:test"
import { spawnSync } from "node:child_process"
import { resolve } from "node:path"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { computeBoundsFromCellContents } from "../../lib"
import { applyCellMargin } from "../../lib/applyCellMargin"
import { CellBoundariesPipeline } from "../../lib/solvers/CellBoundariesPipeline"

const PUBLIC_API_TIMEOUT_MS = 5_000
const TEST_TIMEOUT_MS = 15_000

test(
  "repro: Tang Nano sections exceed the boundary calculation time budget",
  async () => {
    // Captured from core's SchematicSectionRender, before its 1-unit cell margin.
    const cellContents = [
      { cellId: "cell-0", minX: -5, minY: -9.22, maxX: 5, maxY: 9.22 },
      {
        cellId: "cell-1",
        minX: -36.565,
        minY: -17.325,
        maxX: -23.7,
        maxY: 10.325,
      },
      {
        cellId: "cell-2",
        minX: -57.3,
        minY: -7.325,
        maxX: -50.7,
        maxY: 10.235,
      },
      {
        cellId: "cell-3",
        minX: -58.3,
        minY: -34.325,
        maxX: -50.7,
        maxY: -22.48,
      },
      { cellId: "cell-4", minX: -55.3, minY: 19.675, maxX: -6.7, maxY: 26.52 },
      { cellId: "cell-5", minX: -50.3, minY: 32.675, maxX: -5.7, maxY: 43.72 },
      { cellId: "cell-6", minX: 16, minY: -28.325, maxX: 22, maxY: -19.28 },
      { cellId: "cell-7", minX: 12.7, minY: 11.675, maxX: 33.3, maxY: 12.325 },
      {
        cellId: "cell-8",
        minX: 12.53,
        minY: -12.325,
        maxX: 24.47,
        maxY: -0.675,
      },
      {
        cellId: "cell-9",
        minX: 11.435,
        minY: 26.675,
        maxX: 26.565,
        maxY: 32.325,
      },
      { cellId: "cell-10", minX: 45.5, minY: -12.22, maxX: 68.5, maxY: 2.22 },
      { cellId: "cell-11", minX: 45.8, minY: 15.48, maxX: 56.2, maxY: 16.52 },
      { cellId: "cell-12", minX: 43, minY: -42.72, maxX: 60.3, maxY: -20.675 },
      {
        cellId: "cell-13",
        minX: -33.3,
        minY: -35.325,
        maxX: -16.7,
        maxY: -21.73,
      },
    ]
    expect(cellContents).toHaveLength(14)
    await expect({ cellContents, lines: [] }).toMatchCellBoundariesSnapshot(
      import.meta.path,
      "tang-nano-sections-input",
    )

    const expandedCells = applyCellMargin(cellContents, 1)
    const bounds = computeBoundsFromCellContents(expandedCells)
    const pipeline = new CellBoundariesPipeline({
      cellContents: expandedCells.map((cell) => ({
        cellId: cell.cellId!,
        x: cell.minX - bounds.minX,
        y: cell.minY - bounds.minY,
        width: cell.maxX - cell.minX,
        height: cell.maxY - cell.minY,
      })),
      containerWidth: bounds.maxX - bounds.minX,
      containerHeight: bounds.maxY - bounds.minY,
      offsetX: bounds.minX,
      offsetY: bounds.minY,
    })
    pipeline.solveUntilStage("mergeGridSolver")
    expect(pipeline.buildGridSolver?.solved).toBe(true)
    expect(pipeline.buildGridSolver?.gridRects).toHaveLength(5364)
    expect(pipeline.buildGridSolver?.validSegments).toHaveLength(7538)

    // Create the merger, initialize its seed groups, then perform one merge.
    pipeline.step()
    pipeline.step()
    pipeline.step()
    const merger = pipeline.mergeGridSolver!
    expect(merger.iterations).toBe(2)
    expect(merger.groupedRects).toHaveLength(15)
    expect(merger.solved).toBe(false)
    expect(pipeline.solved).toBe(false)
    await expect(
      getSvgFromGraphicsObject(merger.visualize(), {
        backgroundColor: "white",
      }),
    ).toMatchSvgSnapshot(import.meta.path, "tang-nano-sections-partial-merge")

    // Isolate the synchronous public call so a stall cannot block the test runner.
    const result = spawnSync(
      process.execPath,
      [
        "--eval",
        'import { calculateCellBoundaries } from "./lib"; calculateCellBoundaries(JSON.parse(await Bun.stdin.text()), { cellMargin: 1 })',
      ],
      {
        cwd: resolve(import.meta.dir, "../.."),
        input: JSON.stringify(cellContents),
        encoding: "utf8",
        timeout: PUBLIC_API_TIMEOUT_MS,
      },
    )
    expect(result.error).toMatchObject({ code: "ETIMEDOUT" })
    expect(result.status).toBeNull()
    expect(result.stderr).toBe("")
  },
  TEST_TIMEOUT_MS,
)
