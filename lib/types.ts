export interface Point {
  x: number
  y: number
}

export type CellId = string | number

export interface InputRect {
  cellId?: CellId
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface CellContent {
  cellId: string
  cellGroupIndex: number
  x: number
  y: number
  width: number
  height: number
}

export interface Line {
  id?: string
  start: Point
  end: Point
  fromCellIds?: string[]
  distanceToAnyCell?: number
}

export interface Midline {
  id: string
  start: Point
  end: Point
  cellIds: [string, string]
  type: "horizontal" | "vertical"
}

export interface Intersection {
  point: Point
  midlineIds: string[]
}
