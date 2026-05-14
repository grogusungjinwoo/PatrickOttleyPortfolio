import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Box, Clock3, DatabaseZap, LineChart, RadioTower } from 'lucide-react'
import * as THREE from 'three'
import {
  aggregateNvdaHourBars,
  buildNvdaHourSummary,
  formatNvdaPrice,
  formatNvdaTimestamp,
  formatNvdaVolume,
  isNvdaSession,
  type NvdaHourBar,
  type NvdaHourSummary,
  type NvdaSession,
} from '../lib/nvdaHourChart'

const nvdaChartUrl = 'https://grogusungjinwoo.github.io/NVDA-at-a-Glance/'
const nvdaSessionUrl = `${nvdaChartUrl}data/nvda-session.json`

type DataStatus = 'loading' | 'synced' | 'error'

function scalePrice(value: number, summary: NvdaHourSummary) {
  const range = summary.high - summary.low || 1
  return -2.8 + ((value - summary.low) / range) * 5.6
}

function drawCanvasFallback(
  canvas: HTMLCanvasElement,
  bars: NvdaHourBar[],
  summary: NvdaHourSummary,
  width: number,
  height: number,
) {
  if (typeof CanvasRenderingContext2D === 'undefined') return

  let context: CanvasRenderingContext2D | null = null
  try {
    context = canvas.getContext('2d')
  } catch {
    return
  }
  if (!context) return

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = width * pixelRatio
  canvas.height = height * pixelRatio
  context.scale(pixelRatio, pixelRatio)
  context.clearRect(0, 0, width, height)
  context.fillStyle = '#06100f'
  context.fillRect(0, 0, width, height)
  context.strokeStyle = 'rgba(240, 223, 191, 0.14)'

  for (let index = 0; index <= 5; index += 1) {
    const y = 34 + index * ((height - 82) / 5)
    context.beginPath()
    context.moveTo(34, y)
    context.lineTo(width - 28, y)
    context.stroke()
  }

  const range = summary.high - summary.low || 1
  const barWidth = Math.max(9, (width - 84) / Math.max(bars.length, 1) - 8)
  bars.forEach((bar, index) => {
    const x = 42 + index * ((width - 84) / Math.max(bars.length, 1))
    const y = (price: number) => 32 + (1 - (price - summary.low) / range) * (height - 112)
    const up = bar.close >= bar.open
    context.strokeStyle = up ? '#6fd3a1' : '#ef4e5f'
    context.fillStyle = up ? 'rgba(111, 211, 161, 0.82)' : 'rgba(239, 78, 95, 0.82)'
    context.beginPath()
    context.moveTo(x + barWidth / 2, y(bar.high))
    context.lineTo(x + barWidth / 2, y(bar.low))
    context.stroke()
    context.fillRect(
      x,
      Math.min(y(bar.open), y(bar.close)),
      barWidth,
      Math.max(Math.abs(y(bar.close) - y(bar.open)), 3),
    )
    context.fillStyle = 'rgba(239, 136, 64, 0.64)'
    context.fillRect(
      x,
      height - 34 - (bar.volume / Math.max(summary.volume, 1)) * 90,
      barWidth,
      8 + (bar.volume / Math.max(summary.volume, 1)) * 90,
    )
  })
}

function NvdaThreeScene({ bars, summary }: { bars: NvdaHourBar[]; summary: NvdaHourSummary }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || bars.length === 0) return

    const width = canvas.clientWidth || 920
    const height = canvas.clientHeight || 420

    if (typeof WebGLRenderingContext === 'undefined') {
      drawCanvasFallback(canvas, bars, summary, width, height)
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      drawCanvasFallback(canvas, bars, summary, width, height)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5))
    renderer.setSize(width, height, false)
    renderer.setClearColor(0x06100f, 1)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x06100f, 10, 26)
    const camera = new THREE.PerspectiveCamera(42, width / Math.max(height, 1), 0.1, 100)
    camera.position.set(4.6, 6.6, 10.2)
    camera.lookAt(0, -0.2, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.62))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35)
    keyLight.position.set(4, 8, 5)
    scene.add(keyLight)

    const grid = new THREE.GridHelper(12, 12, 0x425c52, 0x1c302c)
    grid.position.y = -3.65
    grid.rotation.x = Math.PI / 2
    scene.add(grid)

    const group = new THREE.Group()
    const spacing = bars.length > 1 ? 0.86 : 0
    const totalWidth = (bars.length - 1) * spacing
    const candleGeometry = new THREE.BoxGeometry(0.34, 1, 0.44)
    const volumeGeometry = new THREE.BoxGeometry(0.42, 1, 0.52)
    const upMaterial = new THREE.MeshStandardMaterial({ color: 0x6fd3a1, emissive: 0x102a20, roughness: 0.34 })
    const downMaterial = new THREE.MeshStandardMaterial({ color: 0xef4e5f, emissive: 0x341016, roughness: 0.34 })
    const volumeMaterial = new THREE.MeshStandardMaterial({
      color: 0xef8840,
      opacity: 0.66,
      roughness: 0.42,
      transparent: true,
    })
    const wickMaterial = new THREE.LineBasicMaterial({ color: 0xf0dfbf, transparent: true, opacity: 0.82 })
    const vwapMaterial = new THREE.LineBasicMaterial({ color: 0xd6c2a1, transparent: true, opacity: 0.92 })

    bars.forEach((bar, index) => {
      const x = index * spacing - totalWidth / 2
      const openY = scalePrice(bar.open, summary)
      const closeY = scalePrice(bar.close, summary)
      const highY = scalePrice(bar.high, summary)
      const lowY = scalePrice(bar.low, summary)
      const bodyHeight = Math.max(Math.abs(closeY - openY), 0.08)
      const candle = new THREE.Mesh(candleGeometry, bar.close >= bar.open ? upMaterial : downMaterial)
      candle.scale.y = bodyHeight
      candle.position.set(x, (openY + closeY) / 2, 0)
      group.add(candle)

      const wick = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, lowY, 0), new THREE.Vector3(x, highY, 0)]),
        wickMaterial,
      )
      group.add(wick)

      const volumeHeight = Math.max(0.08, (bar.volume / Math.max(summary.volume, 1)) * 2.8)
      const volume = new THREE.Mesh(volumeGeometry, volumeMaterial)
      volume.scale.y = volumeHeight
      volume.position.set(x, -3.55 + volumeHeight / 2, 0.78)
      group.add(volume)
    })

    const vwapY = scalePrice(summary.vwap, summary)
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-totalWidth / 2 - 0.42, vwapY, -0.34),
          new THREE.Vector3(totalWidth / 2 + 0.42, vwapY, -0.34),
        ]),
        vwapMaterial,
      ),
    )

    scene.add(group)
    let animationFrame = 0
    let yaw = -0.22

    const renderFrame = () => {
      yaw += 0.0018
      group.rotation.y = Math.sin(yaw) * 0.1
      renderer.render(scene, camera)
      animationFrame = window.requestAnimationFrame(renderFrame)
    }

    renderFrame()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      scene.traverse((object) => {
        if ('geometry' in object && object.geometry instanceof THREE.BufferGeometry) object.geometry.dispose()
        if ('material' in object) {
          const material = object.material
          if (Array.isArray(material)) material.forEach((item) => item.dispose())
          else if (material instanceof THREE.Material) material.dispose()
        }
      })
      renderer.dispose()
    }
  }, [bars, summary])

  return (
    <canvas
      ref={canvasRef}
      className="nvda-three-canvas"
      role="img"
      aria-label="NVDA 1 hour 3D modeled OHLCV chart"
      data-testid="nvda-three-canvas"
    />
  )
}

export function NvdaHourChart() {
  const [status, setStatus] = useState<DataStatus>('loading')
  const [session, setSession] = useState<NvdaSession | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      try {
        const response = await fetch(`${nvdaSessionUrl}?t=${Date.now()}`, { cache: 'no-store' })
        if (!response.ok) throw new Error(`NVDA session returned ${response.status}`)
        const payload: unknown = await response.json()
        if (!isNvdaSession(payload)) throw new Error('NVDA session payload is invalid')
        if (!cancelled) {
          setSession(payload)
          setStatus('synced')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void loadSession()

    return () => {
      cancelled = true
    }
  }, [])

  const bars = useMemo(() => aggregateNvdaHourBars(session?.candles ?? []), [session])
  const summary = useMemo(() => buildNvdaHourSummary(bars), [bars])
  const latestBar = bars.at(-1)

  return (
    <section className="nvda-chart-card" role="region" aria-label="NVDA 1 hour 3D modeled chart">
      <div className="nvda-chart-copy">
        <div className="card-topline">
          <Box size={22} aria-hidden="true" />
          <span>NVDA at a Glance</span>
        </div>
        <h3>NVDA 1h modeled chart</h3>
        <p>
          One-hour 3D model of the latest published NVDA chart data, pulled from the public GitHub Pages signal map.
        </p>
        <div className="resource-actions nvda-chart-actions">
          <a href={nvdaChartUrl} target="_blank" rel="noreferrer">
            <ArrowUpRight size={16} aria-hidden="true" />
            Open NVDA at a Glance
          </a>
        </div>
      </div>

      <div className="nvda-chart-surface">
        {status === 'error' ? (
          <div className="nvda-chart-message">
            <RadioTower size={20} aria-hidden="true" />
            <strong>Latest NVDA chart data is temporarily unavailable.</strong>
            <span>The live GitHub IO page remains linked above.</span>
          </div>
        ) : bars.length > 0 ? (
          <>
            <div className="nvda-chart-scene">
              <NvdaThreeScene bars={bars} summary={summary} />
              <div className="nvda-axis-labels" aria-hidden="true">
                <span>{formatNvdaPrice(summary.high)}</span>
                <span>{formatNvdaPrice(summary.vwap)} VWAP</span>
                <span>{formatNvdaPrice(summary.low)}</span>
              </div>
            </div>
            <div className="nvda-chart-readout">
              <dl>
                <div>
                  <dt>Last Close</dt>
                  <dd>{formatNvdaPrice(summary.latestClose)}</dd>
                </div>
                <div>
                  <dt>1h Bars</dt>
                  <dd>{bars.length}</dd>
                </div>
                <div>
                  <dt>Volume</dt>
                  <dd>{formatNvdaVolume(summary.volume)}</dd>
                </div>
                <div>
                  <dt>Latest Bar</dt>
                  <dd>{latestBar ? formatNvdaTimestamp(latestBar.time) : 'n/a'}</dd>
                </div>
              </dl>
              <div className="nvda-source-row">
                <DatabaseZap size={15} aria-hidden="true" />
                <span>{session?.source ?? 'Loading published data'}</span>
              </div>
              <div className="nvda-source-row">
                <Clock3 size={15} aria-hidden="true" />
                <span>
                  {session ? `Retrieved ${formatNvdaTimestamp(session.retrievedAt)}` : 'Loading latest retrieval time'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="nvda-chart-message">
            <LineChart size={20} aria-hidden="true" />
            <strong>Loading latest NVDA 1h chart data.</strong>
            <span>Fetching the current GitHub IO session JSON.</span>
          </div>
        )}
      </div>
    </section>
  )
}
