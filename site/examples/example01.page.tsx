import { CellBoundariesDebugger } from "../fixture/CellBoundariesDebugger"

const cells = [
  { minX: 100, minY: 100, maxX: 220, maxY: 180 },
  { minX: 300, minY: 150, maxX: 400, maxY: 250 },
  { minX: 150, minY: 300, maxX: 290, maxY: 390 },
]

export default function CellBoundariesPipelineDemo() {
  return <CellBoundariesDebugger cells={cells} />
}
