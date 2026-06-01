import { CellBoundariesDebugger } from "../fixture/CellBoundariesDebugger"

const cells = [
  { minX: 38, minY: 62, maxX: 150, maxY: 178 },
  { minX: 230, minY: 28, maxX: 360, maxY: 138 },
  { minX: 485, minY: 90, maxX: 612, maxY: 230 },
  { minX: 105, minY: 255, maxX: 248, maxY: 370 },
  { minX: 340, minY: 215, maxX: 430, maxY: 345 },
  { minX: 655, minY: 260, maxX: 760, maxY: 385 },
  { minX: 35, minY: 455, maxX: 185, maxY: 560 },
  { minX: 280, minY: 500, maxX: 395, maxY: 640 },
  { minX: 520, minY: 430, maxX: 675, maxY: 535 },
  { minX: 760, minY: 515, maxX: 890, maxY: 650 },
]

export default function CellBoundariesPipelineDemo() {
  return <CellBoundariesDebugger cells={cells} />
}
