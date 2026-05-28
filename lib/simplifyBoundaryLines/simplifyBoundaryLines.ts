import type { Line, CellContent } from "../types"
import { separatedCellPairs } from "./cellSeparation"
import { simplifyChains } from "./simplifyChains"
import { connectDanglingEndpoints } from "./connectDanglingEndpoints"
import { alignParallelLinesAcrossConnectors } from "./alignParallelLinesAcrossConnectors"
import { removeRedundantParallelBridges } from "./removeRedundantParallelBridges"
import { trimDanglingOverhangs } from "./trimDanglingOverhangs"
import { restoreMissingSeparators } from "./restoreMissingSeparators"
import { extendLinesToImproveCellRegions } from "./extendLinesToImproveCellRegions"
import { restoreSharedCellRegions } from "./restoreSharedCellRegions"
import { removeRedundantSeparators } from "./removeRedundantSeparators"
import { collapseVerticalDoglegs } from "./collapseVerticalDoglegs"
import { collapseHorizontalSteps } from "./collapseHorizontalSteps"
import { snapLongHorizontalsToNearbyOriginals } from "./snapLongHorizontalsToNearbyOriginals"
import { extendVerticalsToNearbyCellEdges } from "./extendVerticalsToNearbyCellEdges"

export const simplifyBoundaryLines = (
  lines: Line[],
  cellContents: CellContent[],
): Line[] => {
  const requiredSeparatedPairs = separatedCellPairs(lines, cellContents)

  const simplified = simplifyChains(lines, cellContents)
  const connected = connectDanglingEndpoints(simplified, cellContents)
  const aligned = alignParallelLinesAcrossConnectors(connected, cellContents)
  const reduced = removeRedundantParallelBridges(aligned, cellContents)
  const trimmed = trimDanglingOverhangs(reduced, cellContents)
  const restored = restoreMissingSeparators(
    trimmed,
    lines,
    cellContents,
    requiredSeparatedPairs,
  )
  const extended = extendLinesToImproveCellRegions(restored, cellContents)
  const partitioned = restoreSharedCellRegions(extended, lines, cellContents)
  const finalReduced = removeRedundantSeparators(partitioned, cellContents)
  const finalConnected = connectDanglingEndpoints(finalReduced, cellContents, {
    preserveOriginalSpan: true,
  })
  const collapsed = collapseVerticalDoglegs(finalConnected, cellContents)
  const stepsCollapsed = collapseHorizontalSteps(collapsed, cellContents)
  const snapped = snapLongHorizontalsToNearbyOriginals(
    stepsCollapsed,
    lines,
    cellContents,
  )
  const edgeExtended = extendVerticalsToNearbyCellEdges(snapped, cellContents)
  const finalConnected2 = connectDanglingEndpoints(edgeExtended, cellContents, {
    preserveOriginalSpan: true,
  })
  const livePairs = separatedCellPairs(finalConnected2, cellContents)

  return trimDanglingOverhangs(finalConnected2, cellContents, livePairs)
}
