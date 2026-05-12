import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Patrick Ottley portfolio', () => {
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
})
