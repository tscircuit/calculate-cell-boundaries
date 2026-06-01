import type { CellContent } from "../../types"

export type { CellContent, Line, Point } from "../../types"

export interface WorkRect extends CellContent {
  merged: boolean
  groupId: number | null
  minBoundingSegmentDistance: number
}
