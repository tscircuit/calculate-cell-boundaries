export interface Vec2 {
  x: number
  y: number
}

export type Point = Vec2

export interface InputRect {
  cellId?: string
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface CellContent {
  cellId: string
  x: number
  y: number
  width: number
  height: number
}

export interface Line {
  id?: string
  start: Vec2
  end: Vec2
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
