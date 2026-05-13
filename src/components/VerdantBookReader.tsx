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
} from 'react'
import { useReducedMotion } from 'framer-motion'
import HTMLFlipBook from 'react-pageflip'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'

type BookPageAsset = {
  imageUrl: string
  pageNumber: number
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
  pageImageUrls: string[]
  title: string
}

const PRELOAD_BEFORE = 1
const PRELOAD_AFTER = 2
const WHEEL_TURN_THRESHOLD = 72
const WHEEL_TURN_COOLDOWN_MS = 260

function makePageAssets(pageImageUrls: string[]) {
  return pageImageUrls.map((imageUrl, index) => ({
    imageUrl,
    pageNumber: index + 1,
  }))
}

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
  if (pageCount <= 0) return []

  const currentPageNumber = currentPage + 1
  const firstPage = Math.max(1, currentPageNumber - PRELOAD_BEFORE)
  const lastPage = Math.min(pageCount, currentPageNumber + PRELOAD_AFTER)

  return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => index + firstPage)
}

const FlipPage = forwardRef<
  HTMLDivElement,
  { isPreloaded: boolean; page: BookPageAsset; title: string }
>(({ isPreloaded, page, title }, ref) => (
  <div className="book-page" ref={ref}>
    <div className="book-page-paper">
      {isPreloaded ? (
        <img
          src={page.imageUrl}
          alt={`${title} manuscript page ${page.pageNumber}`}
          draggable="false"
          loading={page.pageNumber <= 2 ? 'eager' : 'lazy'}
        />
      ) : (
        <div className="book-page-placeholder" aria-label={`Preparing ${title} page ${page.pageNumber}`}>
          <span>Page {page.pageNumber}</span>
        </div>
      )}
    </div>
  </div>
))

FlipPage.displayName = 'FlipPage'

export function VerdantBookReader({ edition, pageImageUrls, title }: VerdantBookReaderProps) {
  const reduceMotion = useReducedMotion()
  const pages = useMemo(() => makePageAssets(pageImageUrls), [pageImageUrls])
  const pageCount = pages.length
  const [currentPage, setCurrentPage] = useState(0)
  const currentPageRef = useRef(0)
  const flipBookRef = useRef<FlipBookRef | null>(null)
  const readerShellRef = useRef<HTMLDivElement | null>(null)
  const suppressStageClickRef = useRef(false)
  const turnDragStartRef = useRef<{ x: number; y: number } | null>(null)
  const wheelDeltaRef = useRef(0)
  const wheelTurnCooldownRef = useRef(false)

  const preloadedPageSet = useMemo(
    () => new Set(getPreloadPageNumbers(currentPage, pageCount)),
    [currentPage, pageCount],
  )

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

  function handleFlip(event: { data?: unknown }) {
    updateCurrentPage(getFlipPageIndex(event.data))
  }

  const goToPreviousPage = useCallback(() => {
    turnToPage(currentPageRef.current - 1)
  }, [turnToPage])

  const goToNextPage = useCallback(() => {
    turnToPage(currentPageRef.current + 1)
  }, [turnToPage])

  const handleReaderWheel = useCallback(
    (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      const direction = event.deltaY > 0 ? 1 : -1
      const isAtStart = currentPageRef.current === 0
      const isAtEnd = currentPageRef.current >= pageCount - 1

      if ((direction < 0 && isAtStart) || (direction > 0 && isAtEnd)) {
        wheelDeltaRef.current = 0
        return
      }

      event.preventDefault()
      event.stopPropagation()
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
    },
    [goToNextPage, goToPreviousPage, pageCount, reduceMotion],
  )

  useEffect(() => {
    const readerShell = readerShellRef.current

    if (!readerShell) return

    readerShell.addEventListener('wheel', handleReaderWheel, { passive: false })

    return () => {
      readerShell.removeEventListener('wheel', handleReaderWheel)
    }
  }, [handleReaderWheel])

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
      ref={readerShellRef}
      className="book-reader-shell"
      role="region"
      aria-label={`${title} flipbook reader`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="book-reader-copy">
        <div className="card-topline">
          <BookOpen size={22} aria-hidden="true" />
          <span>Animated book edition</span>
        </div>
        <h3>{edition}</h3>
        <p>
          Read the current manuscript as a turnable in-page book with enlarged pages, a cover, and tactile page
          movement.
        </p>
        <div className="book-reader-stats" aria-label={`${title} draft details`}>
          <span>{pageCount} pages</span>
          <span>Static page art</span>
        </div>
      </div>

      <div className="book-reader-frame">
        <div className="book-reader-toolbar" aria-label={`${title} page controls`}>
          <button type="button" onClick={goToPreviousPage} disabled={currentPage === 0} aria-label="Previous page">
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <span aria-live="polite">
            Page {pageCount === 0 ? 0 : currentPage + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={goToNextPage}
            disabled={pageCount === 0 || currentPage >= pageCount - 1}
            aria-label="Next page"
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="book-reader-stage" role="group" aria-label={`${title} turnable pages`}>
          <HTMLFlipBook
            key={pageCount}
            ref={flipBookRef}
            autoSize
            className="verdant-flipbook"
            clickEventForward
            disableFlipByClick
            drawShadow={!reduceMotion}
            flippingTime={reduceMotion ? 1 : 860}
            height={760}
            maxHeight={860}
            maxShadowOpacity={0.42}
            maxWidth={680}
            minHeight={460}
            minWidth={280}
            mobileScrollSupport
            showCover
            showPageCorners={!reduceMotion}
            size="stretch"
            startPage={0}
            startZIndex={0}
            style={{}}
            swipeDistance={30}
            useMouseEvents
            usePortrait
            width={586}
            onFlip={handleFlip}
          >
            {pages.map((page) => (
              <FlipPage
                key={page.pageNumber}
                isPreloaded={preloadedPageSet.has(page.pageNumber)}
                page={page}
                title={title}
              />
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
