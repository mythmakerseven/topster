import {
  getScaledDimensions,
  drawCover,
  setup,
  ChartItem,
  Chart,
  drawTitle,
  drawBackground
} from './lib'

const generateChart = (canvas: HTMLCanvasElement, chart: Chart): HTMLCanvasElement => {
  const canvasInfo = setup(canvas, chart)

  drawBackground(canvas, chart)

  drawTitle(canvas, chart)

  insertCoverImages(
    canvas,
    chart,
    canvasInfo.cellSize,
    chart.gap,
    canvasInfo.maxItemTitleWidth,
    canvasInfo.chartTitleMargin
  )

  return canvas
}

const insertCoverImages = (
  canvas: HTMLCanvasElement,
  chart: Chart,
  cellSize: number,
  gap: number,
  maxTitleWidth: number,
  chartTitleMargin: number
) => {
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas ctx not found')
  }

  const insertTitle = (item: ChartItem, index: number, coords: { x: number, y: number }, maxWidth: number) => {
    const titleString = item.creator ? `${item.creator} - ${item.title}` : item.title

    ctx.strokeText(
      titleString,
      canvas.width - maxWidth + 10,
      (25 * index) + (25 + gap) + ((coords.y % (index + 1)) * 35) + chartTitleMargin
    )

    ctx.fillText(
      titleString,
      canvas.width - maxWidth + 10,
      (25 * index) + (25 + gap) + ((coords.y % (index + 1)) * 35) + chartTitleMargin
    )
  }

  // Set up text formatting for titles.
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.shadowBlur = 4
  ctx.shadowColor = 'rgba(0,0,0,0.6)'
  ctx.font = `16pt ${chart.font ? chart.font : 'monospace'}`
  if (chart.textColor && /^#[0-9A-F]{6}$/i.test(chart.textColor)) {
    ctx.fillStyle = chart.textColor
  } else {
    ctx.fillStyle = 'white'
  }
  ctx.textAlign = 'left'

  ctx.lineWidth = 0.3
  ctx.strokeStyle = 'black'

  chart.items.forEach((item: ChartItem | null, index: number) => {
    if (!item) {
      return null
    }

    // Don't overflow outside the bounds of the chart
    // This way, items will be saved if the chart is too big for them
    // and the user can just expand the chart and they'll fill in again
    if (index + 1 > chart.size.x * chart.size.y) {
      return null
    }

    const coords = {
      x: (index % chart.size.x),
      y: Math.floor(index / chart.size.x)
    }

    insertImage(
      canvas,
      item,
      coords,
      cellSize,
      gap,
      chartTitleMargin
    )

    if (chart.showTitles) {
      insertTitle(item, index, coords, maxTitleWidth)
    }
  })
}

const insertImage = (
  canvas: HTMLCanvasElement,
  item: ChartItem,
  coords: { x: number, y: number },
  cellSize: number,
  gap: number,
  chartTitleMargin: number
) => {
  const dimensions = getScaledDimensions(item.coverImg, cellSize)

  drawCover(
    canvas,
    item.coverImg,
    coords,
    cellSize,
    gap,
    dimensions,
    chartTitleMargin
  )
}

export default generateChart
