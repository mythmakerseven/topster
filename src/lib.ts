interface ChartSize {
  x: number,
  y: number
}

export enum BackgroundTypes {
  Color = 'color',
  Image = 'image'
}

export interface ChartItem {
  title: string,
  creator?: string,
  coverURL: string,
  coverImg: HTMLImageElement
}

export interface Chart {
  title: string,
  items: Array<ChartItem | null>,
  size: ChartSize,
  background: {
    type: BackgroundTypes,
    value: string,
    img: HTMLImageElement | null
  },
  showTitles: boolean,
  gap: number,
  font?: string,
  textColor?: string,
  shadows?: boolean
}

interface CanvasInfo {
  width: number,
  height: number,
  cellSize: number,
  chartTitleMargin: number,
  maxItemTitleWidth: number
}

// The sidebar containing the titles of chart items should only be as
// wide as the longest title, plus a little bit of margin.
const getMaxTitleWidth = (chart: Chart, ctx: CanvasRenderingContext2D): number => {
  let maxTitleWidth = 0
  ctx.font = `16pt ${chart.font ? chart.font : 'monospace'}`
  if (chart.textColor && /^#[0-9A-F]{6}$/i.test(chart.textColor)) {
    ctx.fillStyle = chart.textColor
  } else {
    ctx.fillStyle = 'white'
  }

  // Don't need to adjust the size for items that aren't visible on the chart
  const totalItemsOnChart = chart.size.x * chart.size.y

  if (chart.showTitles) {
    for (let x = 0; x < totalItemsOnChart; x++) {
      const item = chart.items[x]
      if (item) {
        const name = item.creator ? `${item.creator} - ${item.title}` : item.title
        const width = ctx.measureText(name).width
        if (width > maxTitleWidth) {
          maxTitleWidth = width
        }
      }
    }
  }

  // A minimum margin of 20px keeps titles from being right up against the sides.
  return maxTitleWidth + 20 + chart.gap
}

// Finds how many pixels the horizontal and/or vertical margin should be
// in order to center the cover within its cell.
const findCenteringOffset = (dimension: number, cellSize: number) => {
  if (dimension < cellSize) {
    return Math.floor((cellSize - dimension) / 2)
  } else {
    return 0
  }
}

export const getScaledDimensions = (img: HTMLImageElement, cellSize: number): { height: number, width: number } => {
  let differencePercentage = 1

  if (img.width > cellSize && img.height > cellSize) {
    differencePercentage = Math.min((cellSize / img.width), (cellSize / img.height))
  } else if (img.width > cellSize) {
    differencePercentage = cellSize / img.width
  } else if (img.height > cellSize) {
    differencePercentage = cellSize / img.height
  } else if (img.width < cellSize && img.height < cellSize) {
    differencePercentage = Math.min((cellSize / img.width), (cellSize / img.height))
  }

  return {
    height: Math.floor(img.height * differencePercentage),
    width: Math.floor(img.width * differencePercentage)
  }
}

export const drawCover = (
  canvas: HTMLCanvasElement,
  cover: HTMLImageElement,
  coords: { x: number, y: number },
  cellSize: number,
  gap: number,
  dimensions: { height: number, width: number },
  chartTitleMargin: number
): void => {
  const ctx = getContext(canvas)

  ctx.drawImage(
    // We have to cast this as HTMLImageElement even if it's a Node Canvas Image,
    // because ctx doesn't know what to do with the latter.
    cover as HTMLImageElement,
    (coords.x * (cellSize + gap)) + gap + findCenteringOffset(dimensions.width, cellSize),
    (coords.y * (cellSize + gap)) + gap + findCenteringOffset(dimensions.height, cellSize) + chartTitleMargin,
    dimensions.width,
    dimensions.height
  )
}

// Just calculates some data and sets the size of the chart
export const setup = (
  canvas: HTMLCanvasElement,
  chart: Chart
): CanvasInfo => {
  const gap = chart.gap
  const ctx = canvas.getContext('2d', { alpha: false })

  if (!ctx) {
    throw new Error('Rendering context not found, try reloading!')
  }

  const maxItemTitleWidth = getMaxTitleWidth(chart, ctx)

  // height/width of each square cell
  const cellSize = 260

  const chartTitleMargin = chart.title === '' ? 0 : 60

  const pixelDimensions = {
    // room for each cell + gap between cells + margins
    x: (chart.size.x * (cellSize + gap)) + gap + maxItemTitleWidth,
    y: (chart.size.y * (cellSize + gap)) + gap + chartTitleMargin
  }

  canvas.width = pixelDimensions.x
  canvas.height = pixelDimensions.y

  return {
    width: pixelDimensions.x,
    height: pixelDimensions.y,
    cellSize,
    chartTitleMargin,
    maxItemTitleWidth
  }
}

export const drawBackground = (
  canvas: HTMLCanvasElement,
  chart: Chart
): void => {
  if (chart.background.type === BackgroundTypes.Color) {
    const ctx = getContext(canvas)
    ctx.beginPath()
    ctx.fillStyle = chart.background.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else {
    if (chart.background.img?.complete) {
      const ctx = getContext(canvas)

      const imageRatio = chart.background.img.height / chart.background.img.width
      const canvasRatio = canvas.height / canvas.width

      if (imageRatio > canvasRatio) {
        const height = canvas.width * imageRatio
        ctx.drawImage(
          chart.background.img,
          0,
          Math.floor((canvas.height - height) / 2),
          canvas.width,
          height
        )
      } else {
        const width = canvas.width * canvasRatio / imageRatio
        ctx.drawImage(
          chart.background.img,
          Math.floor((canvas.width - width) / 2),
          0,
          width,
          canvas.height
        )
      }
    }
  }
}

export const drawTitle = (
  canvas: HTMLCanvasElement,
  chart: Chart
): void => {
  const ctx = getContext(canvas)
  ctx.font = `38pt ${chart.font ? chart.font : 'monospace'}`
  if (chart.textColor && /^#[0-9A-F]{6}$/i.test(chart.textColor)) {
    ctx.fillStyle = chart.textColor
  } else {
    ctx.fillStyle = 'white'
  }
  ctx.textAlign = 'center'

  if (chart.shadows !== false) {
    // Set up text formatting for titles.
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.shadowBlur = 4
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
  }

  ctx.lineWidth = 0.2
  ctx.strokeStyle = 'black'
  ctx.fillText(chart.title, canvas.width / 2, ((chart.gap + 90) / 2))
  ctx.strokeText(chart.title, canvas.width / 2, ((chart.gap + 90) / 2))
}

const getContext = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Missing canvas context.')
  }

  return ctx
}
