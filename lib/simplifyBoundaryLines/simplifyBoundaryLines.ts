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
import { collapseSteps } from "./collapseVerticalDoglegs"
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
  const collapsed = collapseSteps(finalConnected, cellContents)
  const snapped = snapLongHorizontalsToNearbyOriginals(
    collapsed,
    lines,
    cellContents,
  )
  const edgeExtended = extendVerticalsToNearbyCellEdges(snapped, cellContents)
  const finalConnected2 = connectDanglingEndpoints(edgeExtended, cellContents, {
    preserveOriginalSpan: true,
  })

  return trimDanglingOverhangs(
    finalConnected2,
    cellContents,
    separatedCellPairs(finalConnected2, cellContents),
  )
}
