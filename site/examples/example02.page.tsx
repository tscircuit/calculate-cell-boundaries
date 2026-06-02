import { CellBoundariesDebugger } from "../fixture/CellBoundariesDebugger"

const cells = [
  {
    minX: -13.4075,
    minY: 3.0599999999999996,
    maxX: -10.5925,
    maxY: 12.940000000000001,
  },
  {
    minX: -15.764999999999999,
    minY: -3.25,
    maxX: -4.535,
    maxY: 0.42500000000000004,
  },
  {
    minX: -1.4649999999999999,
    minY: 6.15,
    maxX: 1.4649999999999999,
    maxY: 8.55,
  },
  {
    minX: 8.85,
    minY: 5.175000000000001,
    maxX: 13,
    maxY: 9.25,
  },
  {
    minX: -2.2,
    minY: -2.5944553499999996,
    maxX: 3.75,
    maxY: 1,
  },
  {
    minX: 9.049999999999999,
    minY: -0.4944553499999995,
    maxX: 12.185,
    maxY: 0.8944553499999994,
  },
  {
    minX: -1.95,
    minY: -8.9,
    maxX: 1.1225,
    maxY: -6.40554465,
  },
  {
    minX: 10.5,
    minY: -9.05,
    maxX: 11.899999999999999,
    maxY: -7.75,
  },
  {
    minX: -13.2325,
    minY: -10.4,
    maxX: -8.1675,
    maxY: -7.6,
  },
]

export default function CellBoundariesPipelineDemo() {
  return <CellBoundariesDebugger cells={cells} />
}
