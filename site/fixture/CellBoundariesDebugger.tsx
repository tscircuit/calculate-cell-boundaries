import { useMemo } from "react"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { CellBoundariesPipeline } from "../../lib/solvers/CellBoundariesPipeline"
const computeBoundsFromCellContents = (
  cellContents: { minX: number; minY: number; maxX: number; maxY: number }[],
) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const cell of cellContents) {
    minX = Math.min(minX, cell.minX)
    minY = Math.min(minY, cell.minY)
    maxX = Math.max(maxX, cell.maxX)
    maxY = Math.max(maxY, cell.maxY)
  }
  return { minX, minY, maxX, maxY }
}

interface Cell {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface Props {
  cells: Cell[]
  animationSpeed?: number
}

export function CellBoundariesDebugger({ cells, animationSpeed = 200 }: Props) {
  const solver = useMemo(() => {
    const withIds = cells.map((c, i) => ({
      cellId: `cell-${i}`,
      x: c.minX,
      y: c.minY,
      width: c.maxX - c.minX,
      height: c.maxY - c.minY,
    }))

    const bounds = computeBoundsFromCellContents(
      withIds.map((c) => ({
        minX: c.x,
        minY: c.y,
        maxX: c.x + c.width,
        maxY: c.y + c.height,
      })),
    )

    const offsetX = bounds.minX
    const offsetY = bounds.minY

    return new CellBoundariesPipeline({
      cellContents: withIds.map((c) => ({
        ...c,
        x: c.x - offsetX,
        y: c.y - offsetY,
      })),
      containerWidth: bounds.maxX - bounds.minX,
      containerHeight: bounds.maxY - bounds.minY,
    })
  }, [cells])

  return (
    <GenericSolverDebugger solver={solver} animationSpeed={animationSpeed} />
  )
}
