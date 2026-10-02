import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { computeBoundsFromCellContents } from "../../lib"
import { applyCellMargin } from "../../lib/applyCellMargin"
import { CellBoundariesPipeline } from "../../lib/solvers/CellBoundariesPipeline"

test.failing("cm4 sections finish building the grid after 100000 segments", async () => {
  // Exact section bounds captured from the CM4 schematic before the cell margin.
  const sectionBounds = [
    {
      minX: -29.63942199770606,
      minY: -6.904999999999999,
      maxX: -24.00942199770606,
      maxY: -1.2799999999999996,
    },
    {
      minX: -7.919421997706061,
      minY: -6.155,
      maxX: -1.0405780022939515,
      maxY: -2.4699999999999998,
    },
    {
      minX: 15.049421997706055,
      minY: -6.611249999999999,
      maxX: 18.539421997706057,
      maxY: -1.79375,
    },
    {
      minX: -20.00942199770606,
      minY: -4.5024999999999995,
      maxX: -11.91942199770606,
      maxY: -3.9025,
    },
    {
      minX: 2.959421997706051,
      minY: -4.5024999999999995,
      maxX: 11.049421997706052,
      maxY: -3.9025,
    },
    { minX: 10.015, minY: -33.165, maxX: 12.515, maxY: -22.524999999999995 },
    {
      minX: 16.515,
      minY: -33.165,
      maxX: 19.314999999999998,
      maxY: -22.524999999999995,
    },
    {
      minX: 22.539421997706057,
      minY: -6.422499999999999,
      maxX: 24.13942199770606,
      maxY: -1.9824999999999993,
    },
    {
      minX: 1.5100000000000016,
      minY: -18.745,
      maxX: 2.1600000000000015,
      maxY: -10.905,
    },
    { minX: -29.12, minY: -16.0975, maxX: -25.15, maxY: -13.3325 },
    {
      minX: -6.640000000000001,
      minY: -16.13,
      maxX: -2.370000000000001,
      maxY: -13.299999999999999,
    },
    {
      minX: 28.13942199770606,
      minY: -5.704999999999999,
      maxX: 29.63942199770606,
      maxY: -2.4799999999999995,
    },
    {
      minX: 6.16,
      minY: -15.125,
      maxX: 15.490000000000002,
      maxY: -14.524999999999999,
    },
    {
      minX: 19.490000000000002,
      minY: -15.125,
      maxX: 22.619999999999997,
      maxY: -14.524999999999999,
    },
    { minX: -11.84, minY: -15.745, maxX: -10.04, maxY: -13.905 },
    {
      minX: -21.15,
      minY: -15.645,
      maxX: -15.839999999999998,
      maxY: -14.004999999999999,
    },
    { minX: 26.62, minY: -16.345, maxX: 29.12, maxY: -13.305 },
    {
      minX: -30.114999999999995,
      minY: -29.2475,
      maxX: -28.914999999999992,
      maxY: -26.222499999999997,
    },
    {
      minX: -24.914999999999996,
      minY: -30.267499999999995,
      maxX: -20.904999999999998,
      maxY: -25.642499999999995,
    },
    {
      minX: -16.904999999999994,
      minY: -30.264999999999993,
      maxX: -15.224999999999994,
      maxY: -25.424999999999994,
    },
    {
      minX: -11.504999999999995,
      minY: -28.169999999999995,
      maxX: -10.904999999999994,
      maxY: -27.519999999999996,
    },
    {
      minX: -6.904999999999995,
      minY: -29.227499999999992,
      maxX: -1.5949999999999949,
      maxY: -26.242499999999993,
    },
    {
      minX: 2.405000000000001,
      minY: -28.264999999999993,
      maxX: 6.015000000000001,
      maxY: -27.424999999999997,
    },
    {
      minX: 23.314999999999998,
      minY: -28.364999999999995,
      maxX: 24.714999999999996,
      maxY: -27.324999999999996,
    },
    {
      minX: 28.714999999999996,
      minY: -28.664999999999996,
      maxX: 30.114999999999995,
      maxY: -27.024999999999995,
    },
    {
      minX: -6.050000000000001,
      minY: -37.614999999999995,
      maxX: -4.250000000000001,
      maxY: -36.77499999999999,
    },
    {
      minX: -0.7499999999999999,
      minY: -37.614999999999995,
      maxX: 1.0499999999999998,
      maxY: -36.77499999999999,
    },
    {
      minX: 4.6499999999999995,
      minY: -37.614999999999995,
      maxX: 6.09,
      maxY: -36.77499999999999,
    },
  ]
  const cells = applyCellMargin(sectionBounds, 1)
  const bounds = computeBoundsFromCellContents(cells)
  const pipeline = new CellBoundariesPipeline({
    cellContents: cells.map((cell, index) => ({
      cellId: String(index),
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

  await expect(
    getSvgFromGraphicsObject(
      {
        rects: [
          ...pipeline.inputProblem.cellContents.map((cell) => ({
            center: {
              x: cell.x + cell.width / 2,
              y: cell.y + cell.height / 2,
            },
            width: cell.width,
            height: cell.height,
            fill: "rgba(255, 165, 0, 0.4)",
            stroke: "#c87000",
          })),
          ...pipeline.buildGridSolver!.cellContainingRects.map((cell) => ({
            center: {
              x: cell.x + cell.width / 2,
              y: cell.y + cell.height / 2,
            },
            width: cell.width,
            height: cell.height,
            fill: "none",
            stroke: "#000000",
          })),
        ],
      },
      { backgroundColor: "white" },
    ),
  ).toMatchSvgSnapshot(import.meta.path)

  expect(pipeline.computeSegmentsSolver?.allSegments).toHaveLength(186634)
  expect(pipeline.buildGridSolver?.solved).toBe(true)
  expect(pipeline.buildGridSolver?.cellContainingRects).toHaveLength(28)
  expect(pipeline.failed).toBe(false)
})
