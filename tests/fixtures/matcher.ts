import { getSvgFromGraphicsObject, type GraphicsObject } from "graphics-debug"
import { expect, type MatcherResult, type CustomMatcher } from "bun:test"
import type { Line } from "lib/types"

type MatcherContext = ThisParameterType<CustomMatcher<unknown, never[]>>

type CellRect = { minX: number; minY: number; maxX: number; maxY: number }

type CellBoundariesInput = {
  lines: Line[]
  cellContents: CellRect[]
}

function toGraphicsObject({
  lines,
  cellContents,
}: CellBoundariesInput): GraphicsObject {
  return {
    lines: lines.map((l) => ({
      points: [
        { x: l.start.x, y: l.start.y },
        { x: l.end.x, y: l.end.y },
      ],
      strokeColor: "#000",
      strokeWidth: 2,
    })),
    rects: cellContents.map((c) => ({
      center: { x: (c.minX + c.maxX) / 2, y: (c.minY + c.maxY) / 2 },
      width: c.maxX - c.minX,
      height: c.maxY - c.minY,
      fill: "rgba(255, 165, 0, 0.4)",
      stroke: "#c87000",
    })),
  }
}

async function toMatchCellBoundariesSnapshot(
  this: MatcherContext,
  received: unknown,
  testPathOriginal: string,
  svgName?: string,
): Promise<MatcherResult> {
  const graphicsObject = toGraphicsObject(received as CellBoundariesInput)
  const svg = getSvgFromGraphicsObject(graphicsObject, {
    backgroundColor: "white",
  })
  return expect(svg).toMatchSvgSnapshot(testPathOriginal, svgName)
}

expect.extend({
  toMatchCellBoundariesSnapshot,
})

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchCellBoundariesSnapshot(
      testPath: string,
      svgName?: string,
    ): Promise<MatcherResult>
  }
}
