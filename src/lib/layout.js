/**
 * Układa nakładające się w czasie kafelki obok siebie.
 * items: [{ start, end }] posortowane rosnąco po start (minuty).
 * Zwraca te same obiekty z polami: col (numer kolumny) i cols (liczba kolumn w grupie).
 */
export function layoutColumns(items) {
  const result = []
  let cluster = []
  let clusterEnd = -1

  const flush = () => {
    const columnEnds = []

    cluster.forEach((item) => {
      let column = columnEnds.findIndex((end) => end <= item.start)
      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(item.end)
      } else {
        columnEnds[column] = item.end
      }
      item.col = column
    })

    cluster.forEach((item) => {
      item.cols = columnEnds.length
    })

    result.push(...cluster)
    cluster = []
    clusterEnd = -1
  }

  for (const item of items) {
    if (cluster.length > 0 && item.start >= clusterEnd) flush()
    cluster.push(item)
    clusterEnd = Math.max(clusterEnd, item.end)
  }
  if (cluster.length > 0) flush()

  return result
}