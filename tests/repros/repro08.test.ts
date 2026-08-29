import { expect, test } from "bun:test"
import { type Cell, calculateCellBoundaries } from "../../lib"

const rcCarSectionMemberClusters: Cell[] = [
  { cellId: "power", minX: -17.5, maxX: -13.1, minY: -3.7, maxY: -2.3 },
  {
    cellId: "power",
    minX: -12.95,
    maxX: -8.544999999999998,
    minY: -3.8800000000000003,
    maxY: -2.1199999999999997,
  },
  {
    cellId: "power",
    minX: -15.45,
    maxX: -7.565000000000001,
    minY: -8.379999999999999,
    maxY: -4.32,
  },
  {
    cellId: "power",
    minX: -7.950000000000001,
    maxX: -3.545,
    minY: -7.88,
    maxY: -6.12,
  },
  {
    cellId: "esp",
    minX: -5.9750000000000005,
    maxX: 3.1225,
    minY: -10.385000000000002,
    maxY: -5.32,
  },
  {
    cellId: "esp",
    minX: -6.6975,
    maxX: -4.7325,
    minY: -6.415000000000002,
    maxY: -4.815000000000002,
  },
  {
    cellId: "esp",
    minX: -4.7,
    maxX: -2.5349999999999993,
    minY: -6.42,
    maxY: -4.66,
  },
  {
    cellId: "esp",
    minX: -3.7129000000000003,
    maxX: 0.16799999999999993,
    minY: -5.039455349999999,
    maxY: -2.8550000000000004,
  },
  {
    cellId: "esp",
    minX: -1.3075000000000003,
    maxX: 2.825,
    minY: -12.06045535,
    maxY: -9.325,
  },
  {
    cellId: "motors",
    minX: 6.150000000000002,
    maxX: 22.557499999999997,
    minY: -13.61,
    maxY: -0.6549999999999998,
  },
  {
    cellId: "io",
    minX: -2.2125,
    maxX: 2.2125,
    minY: -20.759999999999998,
    maxY: -15.36,
  },
]

test("rc car intersecting section bounds produce grouped boundaries", async () => {
  const lines = calculateCellBoundaries(rcCarSectionMemberClusters)

  expect(lines).toEqual([
    {
      start: { x: -17.5, y: -4.18 },
      end: { x: -4.436250000000001, y: -4.18 },
    },
    {
      start: { x: -8.40645, y: -20.759999999999998 },
      end: { x: -8.40645, y: -13.710227674999999 },
    },
    {
      start: { x: -8.40645, y: -13.710227674999999 },
      end: { x: 4.63625, y: -13.710227674999999 },
    },
    {
      start: { x: -7.131250000000001, y: -5.579727674999999 },
      end: { x: -7.131250000000001, y: -4.600000000000001 },
    },
    {
      start: { x: -7.131250000000001, y: -4.600000000000001 },
      end: { x: -3.712900000000001, y: -4.600000000000001 },
    },
    {
      start: { x: -6.770000000000001, y: -4.18 },
      end: { x: -6.770000000000001, y: -0.6550000000000011 },
    },
    {
      start: { x: -4.436250000000001, y: -4.600000000000001 },
      end: { x: -4.436250000000001, y: -4.18 },
    },
    {
      start: { x: -4.436249999999999, y: -5.579727675000001 },
      end: { x: -3.474999999999998, y: -5.579727675000001 },
    },
    {
      start: { x: 4.63625, y: -20.759999999999998 },
      end: { x: 4.63625, y: -0.6550000000000011 },
    },
  ])
  await expect({
    lines,
    cellContents: rcCarSectionMemberClusters,
  }).toMatchCellBoundariesSnapshot(import.meta.path)
})
