import { describe, expect, it } from 'vitest'
import { aggregateNvdaHourBars, buildNvdaHourSummary, normalizeNvdaCandles } from './nvdaHourChart'

const sampleCandles = [
  {
    timestamp: '2026-05-13T13:30:00.000Z',
    tradingDate: '2026-05-13',
    session: 'regular',
    open: 100,
    high: 106,
    low: 99,
    close: 104,
    volume: 100,
  },
  {
    timestamp: '2026-05-13T13:35:00.000Z',
    tradingDate: '2026-05-13',
    session: 'regular',
    open: 104,
    high: 108,
    low: 103,
    close: 107,
    volume: 200,
  },
  {
    timestamp: '2026-05-13T14:25:00.000Z',
    tradingDate: '2026-05-13',
    session: 'regular',
    open: 107,
    high: 112,
    low: 105,
    close: 110,
    volume: 300,
  },
  {
    timestamp: '2026-05-13T14:30:00.000Z',
    tradingDate: '2026-05-13',
    session: 'regular',
    open: 110,
    high: 113,
    low: 109,
    close: 111,
    volume: 400,
  },
  {
    timestamp: '2026-05-13T15:15:00.000Z',
    tradingDate: '2026-05-13',
    session: 'regular',
    open: 111,
    high: 114,
    low: 108,
    close: 109,
    volume: 500,
  },
]

describe('NVDA hour chart model', () => {
  it('normalizes published candles into sorted finite OHLCV bars', () => {
    const normalized = normalizeNvdaCandles([
      sampleCandles[1],
      { ...sampleCandles[0], volume: Number.NaN },
      sampleCandles[0],
    ])

    expect(normalized).toEqual([sampleCandles[0], sampleCandles[1]])
  })

  it('aggregates 5 minute candles into 1 hour bars anchored to the regular open', () => {
    const bars = aggregateNvdaHourBars(sampleCandles)

    expect(bars).toHaveLength(2)
    expect(bars[0]).toMatchObject({
      time: '2026-05-13T13:30:00.000Z',
      tradingDate: '2026-05-13',
      open: 100,
      high: 112,
      low: 99,
      close: 110,
      volume: 600,
      sourceBarCount: 3,
      isPartial: true,
    })
    expect(bars[1]).toMatchObject({
      time: '2026-05-13T14:30:00.000Z',
      tradingDate: '2026-05-13',
      open: 110,
      high: 114,
      low: 108,
      close: 109,
      volume: 900,
      sourceBarCount: 2,
      isPartial: true,
    })
  })

  it('summarizes range, volume, latest close, and session vwap for the 1 hour chart', () => {
    const bars = aggregateNvdaHourBars(sampleCandles)
    const summary = buildNvdaHourSummary(bars)

    expect(summary).toMatchObject({
      high: 114,
      low: 99,
      latestClose: 109,
      volume: 1500,
    })
    expect(summary.vwap).toBeCloseTo(109.18, 2)
  })
})
