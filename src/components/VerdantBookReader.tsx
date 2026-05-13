import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import { useReducedMotion } from 'framer-motion'
import HTMLFlipBook from 'react-pageflip'
import { ArrowLeft, ArrowRight, ArrowUpRight, Download } from 'lucide-react'

type RenderStatus = 'queued' | 'rendering' | 'ready' | 'error'

type RenderedPage = {
  imageUrl?: string
  pageNumber: number
  status: RenderStatus
}

type PdfViewport = {
  height: number
  width: number
}

type PdfPage = {
  getViewport: (options: { scale: number }) => PdfViewport
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => {
    promise: Promise<void>
  }
}

type PdfDocument = {
  destroy?: () => Promise<void> | void
  getPage: (pageNumber: number) => Promise<PdfPage>
  numPages: number
}

type PageFlipApi = {
  getCurrentPageIndex: () => number
  getPageCount: () => number
  turnToPage: (pageNumber: number) => void
}

type FlipBookRef = {
  pageFlip: () => PageFlipApi
}

type VerdantBookReaderProps = {
  edition: string
  initialPageCount: number
  pdfUrl: string
  title: string
}

const PAGE_RENDER_WIDTH = 620
const MOBILE_PAGE_RENDER_WIDTH = 420
const MAX_RENDER_PIXEL_RATIO = 1
const PRELOAD_BEFORE = 1
const PRELOAD_AFTER = 2
const WHEEL_TURN_THRESHOLD = 72
const WHEEL_TURN_COOLDOWN_MS = 260

function makePageSlots(count: number): RenderedPage[] {
  return Array.from({ length: count }, (_, index) => ({
    pageNumber: index + 1,
    status: 'queued',
  }))
}

function getPageRenderWidth() {
  return window.innerWidth <= 480 ? MOBILE_PAGE_RENDER_WIDTH : PAGE_RENDER_WIDTH
}

function waitForIdleTurn() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 16)
  })
}

async function renderPdfPage(pdf: PdfDocument, pageNumber: number) {
  const page = await pdf.getPage(pageNumber)
  const baseViewport = page.getViewport({ scale: 1 })
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO)
  const scale = (getPageRenderWidth() / baseViewport.width) * pixelRatio
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas rendering is unavailable in this browser.')
  }

  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  await page.render({ canvasContext: context, viewport }).promise

  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('The manuscript page could not be prepared.'))
          return
        }

        resolve(URL.createObjectURL(blob))
      },
      'image/jpeg',
      0.86,
    )
  })
}

async function loadPdfDocument(pdfUrl: string) {
  const [pdfjsLib, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default

  return (await pdfjsLib.getDocument(pdfUrl).promise) as unknown as PdfDocument
}

const FlipPage = forwardRef<HTMLDivElement, { page: RenderedPage; title: string }>(({ page, title }, ref) => (
  <div className="book-page" ref={ref}>
    <div className="book-page-paper">
      {page.status === 'ready' && page.imageUrl ? (
        <img src={page.imageUrl} alt={`${title} manuscript page ${page.pageNumber}`} draggable="false" />
      ) : (
        <div className="book-page-placeholder" aria-label={`Loading ${title} page ${page.pageNumber}`}>
          <span>Page {page.pageNumber}</span>
        </div>
      )}
    </div>
  </div>
))

FlipPage.displayName = 'FlipPage'

function getFlipPageIndex(eventData: unknown) {
  return typeof eventData === 'number' && Number.isFinite(eventData) ? eventData : 0
}

function getPageFlip(ref: FlipBookRef | null) {
  return ref?.pageFlip()
}

function clampPage(page: number, pageCount: number) {
  return Math.min(Math.max(page, 0), Math.max(pageCount - 1, 0))
}

function getPreloadPageNumbers(currentPage: number, pageCount: number) {
  const currentPageNumber = currentPage + 1
  const firstPage = Math.max(1, currentPageNumber - PRELOAD_BEFORE)
  const lastPage = Math.min(pageCount, currentPageNumber + PRELOAD_AFTER)

  return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => index + firstPage).sort((a, b) => {
    const distance = Math.abs(a - currentPageNumber) - Math.abs(b - currentPageNumber)

    return distance === 0 ? a - b : distance
  })
}

function revokeRenderedUrl(imageUrl: string) {
  URL.revokeObjectURL(imageUrl)
}

export function VerdantBookReader({ edition, initialPageCount, pdfUrl, title }: VerdantBookReaderProps) {
  const reduceMotion = useReducedMotion()
  const [currentPage, setCurrentPage] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(initialPageCount)
  const [pdfReadyKey, setPdfReadyKey] = useState(0)
  const [pages, setPages] = useState<RenderedPage[]>(() => makePageSlots(initialPageCount))
  const currentPageRef = useRef(0)
  const flipBookRef = useRef<FlipBookRef | null>(null)
  const pdfDocumentRef = useRef<PdfDocument | null>(null)
  const renderedPageUrlsRef = useRef(new Map<number, string>())
  const renderingPagesRef = useRef(new Set<number>())
  const suppressStageClickRef = useRef(false)
  const turnDragStartRef = useRef<{ x: number; y: number } | null>(null)
  const wheelDeltaRef = useRef(0)
  const wheelTurnCooldownRef = useRef(false)

  const readyPageCount = useMemo(() => pages.filter((page) => page.status === 'ready').length, [pages])
  const isRendering = useMemo(() => pages.some((page) => page.status === 'rendering'), [pages])

  const updateCurrentPage = useCallback(
    (page: number) => {
      const nextPage = clampPage(page, pageCount)

      currentPageRef.current = nextPage
      setCurrentPage(nextPage)
    },
    [pageCount],
  )

  const turnToPage = useCallback(
    (page: number) => {
      const nextPage = clampPage(page, pageCount)

      if (nextPage === currentPageRef.current) return

      getPageFlip(flipBookRef.current)?.turnToPage(nextPage)
      updateCurrentPage(nextPage)
    },
    [pageCount, updateCurrentPage],
  )

  useEffect(() => {
    let cancelled = false
    const renderedPageUrls = renderedPageUrlsRef.current
    const renderingPages = renderingPagesRef.current

    async function loadBook() {
      try {
        setLoadError(null)
        renderedPageUrls.forEach(revokeRenderedUrl)
        renderedPageUrls.clear()
        renderingPages.clear()
        pdfDocumentRef.current = null
        setPageCount(initialPageCount)
        setPages(makePageSlots(initialPageCount))

        const loadedPdf = await loadPdfDocument(pdfUrl)

        if (cancelled) return

        pdfDocumentRef.current = loadedPdf
        setPageCount(loadedPdf.numPages)
        setPages(makePageSlots(loadedPdf.numPages))
        setPdfReadyKey((key) => key + 1)
      } catch {
        if (!cancelled) {
          setLoadError('The book reader could not load the manuscript in this browser.')
        }
      }
    }

    void loadBook()

    return () => {
      cancelled = true
      renderedPageUrls.forEach(revokeRenderedUrl)
      renderedPageUrls.clear()
      renderingPages.clear()
      const pdfDocument = pdfDocumentRef.current
      pdfDocumentRef.current = null
      void pdfDocument?.destroy?.()
    }
  }, [initialPageCount, pdfUrl])

  useEffect(() => {
    const pdfDocument = pdfDocumentRef.current

    if (!pdfDocument || loadError) return

    const activePdfDocument = pdfDocument
    let cancelled = false
    const preloadedPages = getPreloadPageNumbers(currentPage, pageCount)
    const preloadedPageSet = new Set(preloadedPages)

    renderedPageUrlsRef.current.forEach((imageUrl, pageNumber) => {
      if (preloadedPageSet.has(pageNumber)) return

      revokeRenderedUrl(imageUrl)
      renderedPageUrlsRef.current.delete(pageNumber)
    })

    setPages((previousPages) =>
      previousPages.map((page) => {
        if (preloadedPageSet.has(page.pageNumber)) return page
        if (page.status === 'ready') return { pageNumber: page.pageNumber, status: 'queued' }

        return page
      }),
    )

    async function renderVisiblePages() {
      for (const pageNumber of preloadedPages) {
        if (cancelled || renderedPageUrlsRef.current.has(pageNumber) || renderingPagesRef.current.has(pageNumber)) {
          continue
        }

        renderingPagesRef.current.add(pageNumber)
        setPages((previousPages) =>
          previousPages.map((page) => (page.pageNumber === pageNumber ? { ...page, status: 'rendering' } : page)),
        )

        try {
          const imageUrl = await renderPdfPage(activePdfDocument, pageNumber)

          if (cancelled || !preloadedPageSet.has(pageNumber)) {
            revokeRenderedUrl(imageUrl)
            continue
          }

          renderedPageUrlsRef.current.set(pageNumber, imageUrl)
          setPages((previousPages) =>
            previousPages.map((page) =>
              page.pageNumber === pageNumber ? { imageUrl, pageNumber, status: 'ready' } : page,
            ),
          )
        } catch {
          if (!cancelled) {
            setPages((previousPages) =>
              previousPages.map((page) => (page.pageNumber === pageNumber ? { ...page, status: 'error' } : page)),
            )
          }
        } finally {
          renderingPagesRef.current.delete(pageNumber)
        }

        await waitForIdleTurn()
      }
    }

    void renderVisiblePages()

    return () => {
      cancelled = true
    }
  }, [currentPage, loadError, pageCount, pdfReadyKey])

  function handleFlip(event: { data?: unknown }) {
    updateCurrentPage(getFlipPageIndex(event.data))
  }

  const goToPreviousPage = useCallback(() => {
    turnToPage(currentPageRef.current - 1)
  }, [turnToPage])

  const goToNextPage = useCallback(() => {
    turnToPage(currentPageRef.current + 1)
  }, [turnToPage])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      goToPreviousPage()
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      goToNextPage()
    }
  }

  function handleReaderWheel(event: WheelEvent<HTMLElement>) {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

    const direction = event.deltaY > 0 ? 1 : -1
    const isAtStart = currentPageRef.current === 0
    const isAtEnd = currentPageRef.current >= pageCount - 1

    if ((direction < 0 && isAtStart) || (direction > 0 && isAtEnd)) {
      wheelDeltaRef.current = 0
      return
    }

    event.preventDefault()
    wheelDeltaRef.current += event.deltaY

    if (wheelTurnCooldownRef.current || Math.abs(wheelDeltaRef.current) < WHEEL_TURN_THRESHOLD) return

    const shouldTurnForward = wheelDeltaRef.current > 0
    wheelDeltaRef.current = 0
    wheelTurnCooldownRef.current = true

    if (shouldTurnForward) {
      goToNextPage()
    } else {
      goToPreviousPage()
    }

    window.setTimeout(
      () => {
        wheelTurnCooldownRef.current = false
      },
      reduceMotion ? 80 : WHEEL_TURN_COOLDOWN_MS,
    )
  }

  function handleBackwardZoneClick() {
    if (suppressStageClickRef.current) return

    goToPreviousPage()
  }

  function handleForwardZoneClick() {
    if (suppressStageClickRef.current) return

    goToNextPage()
  }

  function beginTurnDrag(x: number, y: number) {
    turnDragStartRef.current = { x, y }
  }

  function finishTurnDrag(x: number, y: number) {
    const dragStart = turnDragStartRef.current
    turnDragStartRef.current = null

    if (!dragStart) return

    const deltaX = x - dragStart.x
    const deltaY = y - dragStart.y

    if (Math.abs(deltaX) < 46 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return

    suppressStageClickRef.current = true
    window.setTimeout(() => {
      suppressStageClickRef.current = false
    }, 0)

    if (deltaX < 0) {
      goToNextPage()
      return
    }

    goToPreviousPage()
  }

  function handleStagePointerDown(event: PointerEvent<HTMLElement>) {
    beginTurnDrag(event.clientX, event.clientY)
  }

  function handleStagePointerUp(event: PointerEvent<HTMLElement>) {
    finishTurnDrag(event.clientX, event.clientY)
  }

  function handleStageMouseDown(event: MouseEvent<HTMLElement>) {
    beginTurnDrag(event.clientX, event.clientY)
  }

  function handleStageMouseUp(event: MouseEvent<HTMLElement>) {
    finishTurnDrag(event.clientX, event.clientY)
  }

  return (
    <div
      className="book-reader-shell"
      role="region"
      aria-label={`${title} flipbook reader`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleReaderWheel}
    >
      <div className="book-reader-copy">
        <div className="card-topline">
          <span>Book draft</span>
        </div>
        <h3>{edition}</h3>
        <p>
          Read the current manuscript draft directly on the page, with turnable pages rendered from the replaceable PDF
          asset.
        </p>
        <div className="book-reader-stats" aria-label={`${title} draft details`}>
          <span>{pageCount} pages</span>
          <span>{isRendering ? `${readyPageCount} ready` : 'Ready to read'}</span>
        </div>
        {loadError ? <p className="book-reader-error">{loadError}</p> : null}
        <div className="book-reader-actions">
          <a href={pdfUrl} target="_blank" rel="noreferrer">
            <ArrowUpRight size={16} aria-hidden="true" />
            Open PDF
          </a>
          <a href={pdfUrl} download>
            <Download size={16} aria-hidden="true" />
            Download Draft
          </a>
        </div>
      </div>

      <div className="book-reader-frame">
        <div className="book-reader-toolbar" aria-label={`${title} page controls`}>
          <button type="button" onClick={goToPreviousPage} disabled={currentPage === 0} aria-label="Previous page">
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <span aria-live="polite">
            Page {currentPage + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage >= pageCount - 1}
            aria-label="Next page"
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="book-reader-stage" role="group" aria-label={`${title} turnable pages`}>
          <HTMLFlipBook
            ref={flipBookRef}
            autoSize
            className="verdant-flipbook"
            clickEventForward
            disableFlipByClick
            drawShadow={!reduceMotion}
            flippingTime={reduceMotion ? 1 : 780}
            height={594}
            maxHeight={720}
            maxShadowOpacity={0.35}
            maxWidth={520}
            minHeight={390}
            minWidth={230}
            mobileScrollSupport
            showCover={false}
            showPageCorners={!reduceMotion}
            size="stretch"
            startPage={0}
            startZIndex={0}
            style={{}}
            swipeDistance={30}
            useMouseEvents
            usePortrait
            width={459}
            onFlip={handleFlip}
          >
            {pages.map((page) => (
              <FlipPage key={page.pageNumber} page={page} title={title} />
            ))}
          </HTMLFlipBook>
          <div className="book-reader-turn-zones">
            <button
              className="book-reader-turn-zone"
              type="button"
              aria-label="Turn back"
              tabIndex={-1}
              onClick={handleBackwardZoneClick}
              onMouseDown={handleStageMouseDown}
              onMouseUp={handleStageMouseUp}
              onPointerDown={handleStagePointerDown}
              onPointerUp={handleStagePointerUp}
            />
            <button
              className="book-reader-turn-zone"
              type="button"
              aria-label="Turn forward"
              tabIndex={-1}
              onClick={handleForwardZoneClick}
              onMouseDown={handleStageMouseDown}
              onMouseUp={handleStageMouseUp}
              onPointerDown={handleStagePointerDown}
              onPointerUp={handleStagePointerUp}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
