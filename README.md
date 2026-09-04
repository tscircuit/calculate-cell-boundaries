# calculate-cell-boundary

Algorithm to calculate optimal cell boundaries between multiple boxes

`calculateCellBoundaries(cells, { cellMargin: 1 })` requests a margin around
the supplied raw bounds, in the same units as the cells. The default is zero.
If the expanded cells all connect through overlaps or touching edges, the
margin is omitted so separate contents can still receive boundaries. Actual
overlapping contents are never shrunk. Other expanded layouts are preserved.

<img width="1656" height="1326" alt="image" src="https://github.com/user-attachments/assets/b581f493-c420-415c-8e34-c96343abb752" />
