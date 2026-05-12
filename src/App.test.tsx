import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Patrick Ottley portfolio', () => {
  it('renders the concise professional portfolio content and public links', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /patrick ottley/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/financial analyst/i)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /northwestern mutual/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/williams college/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/philosophy/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/political science/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/securities industry essentials/i).length).toBeGreaterThan(0)

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
  })
})
