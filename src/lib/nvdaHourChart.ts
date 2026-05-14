export interface NvdaCandle {
  timestamp: string
  tradingDate?: string
  time?: string
  session?: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface NvdaSession {
  symbol: string
  sessionDate: string
  retrievedAt: string
  source: string
  candles: NvdaCandle[]
}

export interface NvdaHourBar {
  time: string
  tradingDate: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap: number
  sourceBarCount: number
  isPartial: boolean
}

export interface NvdaHourSummary {
  high: number
  low: number
  latestClose: number
  volume: number
  vwap: number
}

const newYorkTimeZone = 'America/New_York'
const fiveMinuteBarsPerHour = 12
const hourMs = 60 * 60 * 1000
const preMarketOpenMinutes = 4 * 60
const regularOpenMinutes = 9 * 60 + 30
const regularCloseMinutes = 16 * 60

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function round(value: number, places = 2) {
  const scale = 10 ** places
  return Math.round((value + Number.EPSILON) * scale) / scale
}

function getZonedParts(date: Date): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: newYorkTimeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

function zonedTimeToUtc(parts: ZonedParts): number {
  const desiredAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  let estimate = desiredAsUtc

  for (let index = 0; index < 2; index += 1) {
    const actual = getZonedParts(new Date(estimate))
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second)
    estimate += desiredAsUtc - actualAsUtc
  }

  return estimate
}

function getTradingDate(value: string) {
  const parts = getZonedParts(new Date(value))
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

function getSegmentAnchorUtc(timestamp: string) {
  const date = new Date(timestamp)
  const parts = getZonedParts(date)
  const minutes = parts.hour * 60 + parts.minute
  const anchorMinutes =
    minutes < regularOpenMinutes
      ? preMarketOpenMinutes
      : minutes < regularCloseMinutes
        ? regularOpenMinutes
        : regularCloseMinutes

  return zonedTimeToUtc({
    ...parts,
    hour: Math.floor(anchorMinutes / 60),
    minute: anchorMinutes % 60,
    second: 0,
  })
}

function isNvdaCandle(value: unknown): value is NvdaCandle {
  const candle = value as NvdaCandle
  if (!candle || typeof candle.timestamp !== 'string') return false
  const timestamp = new Date(candle.timestamp).getTime()
  if (!Number.isFinite(timestamp)) return false
  if (![candle.open, candle.high, candle.low, candle.close, candle.volume].every(isFiniteNumber)) return false
  if (candle.volume < 0) return false
  if (candle.high < Math.max(candle.open, candle.close)) return false
  if (candle.low > Math.min(candle.open, candle.close)) return false

  return true
}

export function isNvdaSession(value: unknown): value is NvdaSession {
  const session = value as NvdaSession
  return Boolean(
    session?.symbol === 'NVDA' &&
      typeof session.sessionDate === 'string' &&
      typeof session.retrievedAt === 'string' &&
      typeof session.source === 'string' &&
      Array.isArray(session.candles),
  )
}

export function normalizeNvdaCandles(candles: unknown): NvdaCandle[] {
  if (!Array.isArray(candles)) return []

  return candles
    .filter(isNvdaCandle)
    .map((candle) => ({
      ...candle,
      tradingDate: candle.tradingDate ?? getTradingDate(candle.timestamp),
    }))
    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime())
}

export function aggregateNvdaHourBars(candles: unknown): NvdaHourBar[] {
  const normalized = normalizeNvdaCandles(candles)
  const buckets = new Map<number, NvdaCandle[]>()

  for (const candle of normalized) {
    const timestamp = new Date(candle.timestamp).getTime()
    const anchor = getSegmentAnchorUtc(candle.timestamp)
    const bucketStart = anchor + Math.floor((timestamp - anchor) / hourMs) * hourMs
    const bucket = buckets.get(bucketStart) ?? []
    bucket.push(candle)
    buckets.set(bucketStart, bucket)
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left - right)
    .map(([bucketStart, bucket]) => {
      const volume = bucket.reduce((sum, candle) => sum + candle.volume, 0)
      const vwapNumerator = bucket.reduce((sum, candle) => {
        const typical = (candle.high + candle.low + candle.close) / 3
        return sum + typical * candle.volume
      }, 0)

      return {
        time: new Date(bucketStart).toISOString(),
        tradingDate: bucket[0].tradingDate ?? getTradingDate(bucket[0].timestamp),
        open: round(bucket[0].open),
        high: round(Math.max(...bucket.map((candle) => candle.high))),
        low: round(Math.min(...bucket.map((candle) => candle.low))),
        close: round(bucket.at(-1)?.close ?? bucket[0].close),
        volume: Math.round(volume),
        vwap: round(volume === 0 ? bucket.at(-1)?.close ?? bucket[0].close : vwapNumerator / volume),
        sourceBarCount: bucket.length,
        isPartial: bucket.length < fiveMinuteBarsPerHour,
      }
    })
}

export function buildNvdaHourSummary(bars: NvdaHourBar[]): NvdaHourSummary {
  const fallback = { high: 0, low: 0, latestClose: 0, volume: 0, vwap: 0 }
  if (bars.length === 0) return fallback

  const volume = bars.reduce((sum, bar) => sum + bar.volume, 0)
  const vwapNumerator = bars.reduce((sum, bar) => sum + bar.vwap * bar.volume, 0)

  return {
    high: round(Math.max(...bars.map((bar) => bar.high))),
    low: round(Math.min(...bars.map((bar) => bar.low))),
    latestClose: round(bars.at(-1)?.close ?? 0),
    volume: Math.round(volume),
    vwap: round(volume === 0 ? bars.at(-1)?.close ?? 0 : vwapNumerator / volume),
  }
}

export function formatNvdaPrice(value: number) {
  return `$${value.toFixed(2)}`
}

export function formatNvdaVolume(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatNvdaTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: newYorkTimeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value))
}
