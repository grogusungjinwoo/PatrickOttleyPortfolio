import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: () => ({
    promise: Promise.resolve({
      destroy: vi.fn(),
      getPage: vi.fn(),
      numPages: 59,
    }),
  }),
}))

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: '/mock-pdf-worker.mjs',
}))

vi.mock('react-pageflip', async () => {
  const React = await import('react')

  return {
    default: React.forwardRef<
      { pageFlip: () => { flipNext: () => void; flipPrev: () => void; getCurrentPageIndex: () => number; getPageCount: () => number; turnToPage: (page: number) => void } },
      { children: React.ReactNode; className?: string; onFlip?: (event: { data: number }) => void }
    >(({ children, className, onFlip }, ref) => {
      React.useImperativeHandle(ref, () => ({
        pageFlip: () => ({
          flipNext: () => onFlip?.({ data: 1 }),
          flipPrev: () => onFlip?.({ data: 0 }),
          getCurrentPageIndex: () => 0,
          getPageCount: () => React.Children.count(children),
          turnToPage: (page: number) => onFlip?.({ data: page }),
        }),
      }))

      return <div className={className}>{children}</div>
    }),
  }
})

describe('Patrick Ottley portfolio', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders the concise professional portfolio content and public links', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Patrick Ottley' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Patrick Ottley.' })).not.toBeInTheDocument()
    expect(screen.getByText(/financial analyst/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /northwestern mutual/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/williams college/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/philosophy/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/political science/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/securities industry essentials/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /public builds/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /writing samples/i })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'The Forge' })).toHaveAttribute(
      'href',
      'https://github.com/grogusungjinwoo/The-Forge',
    )
    expect(screen.getByRole('link', { name: 'Pokedex' })).toHaveAttribute(
      'href',
      'https://github.com/grogusungjinwoo/Pokedex',
    )
    expect(screen.getByRole('link', { name: 'DobbyDogzNYC.com' })).toHaveAttribute(
      'href',
      'https://github.com/grogusungjinwoo/dobbydogz-website',
    )
    expect(screen.getByRole('link', { name: 'DobbyDogzNYC.com live site' })).toHaveAttribute(
      'href',
      'https://www.dobbydogznyc.com/',
    )
    expect(screen.getByRole('link', { name: 'Brokerage Simulator' })).toHaveAttribute(
      'href',
      'https://github.com/grogusungjinwoo/Brokerage-Simulator',
    )
    expect(screen.getByRole('link', { name: 'Brokerage Simulator live site' })).toHaveAttribute(
      'href',
      'https://grogusungjinwoo.github.io/Brokerage-Simulator/',
    )
    expect(screen.getByRole('link', { name: /morality of zoos/i })).toHaveAttribute(
      'href',
      '/PatrickOttleyPortfolio/writing/writing-sample-ottley.pdf',
    )
    expect(screen.getByRole('link', { name: /foucault and information technologies/i })).toHaveAttribute(
      'href',
      '/PatrickOttleyPortfolio/writing/writing-sample-ii-ottley-james.pdf',
    )
    expect(screen.getByRole('link', { name: /transcendence of film to art/i })).toHaveAttribute(
      'href',
      '/PatrickOttleyPortfolio/writing/writing-sample-iii-ottley-james.pdf',
    )

    expect(screen.getAllByRole('link', { name: /email/i })[0]).toHaveAttribute(
      'href',
      'mailto:ottley.work@gmail.com',
    )
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/j-patrick-o-73101473/',
    )
    expect(screen.getAllByRole('link', { name: /download resume/i })[0]).toHaveAttribute(
      'href',
      '/PatrickOttleyPortfolio/JPO.Resume.pdf',
    )
    expect(screen.getByText(/available for analyst opportunities/i)).toBeInTheDocument()
    expect(
      screen.getByText(/available for paraplanning and registered client service associate roles/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/available for entry-level project manager roles/i)).toBeInTheDocument()
  })

  it('renders the Verdant Umbra flipbook reader with replaceable PDF links', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Verdant Umbra' })).toBeInTheDocument()
    expect(screen.getByText(/draft chapters i-iii/i)).toBeInTheDocument()
    expect(screen.queryByTitle('Verdant Umbra PDF reader')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: /verdant umbra flipbook reader/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
    expect(screen.getByText(/page 1 of 59/i)).toBeInTheDocument()

    const reader = screen.getByRole('region', { name: /verdant umbra flipbook reader/i })
    fireEvent.click(within(reader).getByRole('button', { name: /next page/i }))
    expect(screen.getByText(/page 2 of 59/i)).toBeInTheDocument()
    fireEvent.click(within(reader).getByRole('button', { name: /previous page/i }))
    expect(screen.getByText(/page 1 of 59/i)).toBeInTheDocument()

    fireEvent.click(within(reader).getByRole('button', { name: /turn forward/i }))
    expect(screen.getByText(/page 2 of 59/i)).toBeInTheDocument()
    fireEvent.click(within(reader).getByRole('button', { name: /turn back/i }))
    expect(screen.getByText(/page 1 of 59/i)).toBeInTheDocument()

    fireEvent.wheel(reader, { deltaY: 120 })
    expect(screen.getByText(/page 2 of 59/i)).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /open pdf/i })).toHaveAttribute(
      'href',
      '/PatrickOttleyPortfolio/writing/verdant-umbra-draft.pdf',
    )
    expect(screen.getByRole('link', { name: /download draft/i })).toHaveAttribute(
      'href',
      '/PatrickOttleyPortfolio/writing/verdant-umbra-draft.pdf',
    )
  })

  it('renders the Life On Our Planet atlas preview with project links', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Life On Our Planet atlas' })).toBeInTheDocument()
    expect(screen.getByText(/ecological timeline and conservation interface/i)).toBeInTheDocument()
    expect(screen.getByText(/atlas status/i)).toBeInTheDocument()
    expect(screen.getByText(/timeline lens/i)).toBeInTheDocument()
    expect(screen.getByText(/conservation signals/i)).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /open live atlas/i })).toHaveAttribute(
      'href',
      'https://grogusungjinwoo.github.io/David-Attenborough-s-Life-On-Our-Planet/',
    )
    expect(screen.getByRole('link', { name: /view source/i })).toHaveAttribute(
      'href',
      'https://github.com/grogusungjinwoo/David-Attenborough-s-Life-On-Our-Planet',
    )
  })
})
