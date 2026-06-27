/// <reference types="node" />
// @vitest-environment node

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('GitHub Pages compatibility aliases', () => {
  it('runs the compatibility alias step during production builds', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>
    }

    expect(packageJson.scripts?.build).toContain('node scripts/create-pages-compat-alias.mjs')
  })

  it('copies built public assets into the legacy project path', async () => {
    const scriptPath = resolve(process.cwd(), 'scripts', 'create-pages-compat-alias.mjs')
    expect(existsSync(scriptPath)).toBe(true)

    const { createPagesCompatAlias } = (await import(pathToFileURL(scriptPath).href)) as {
      createPagesCompatAlias: (options: { distDir: string }) => Promise<void>
    }
    const distDir = mkdtempSync(join(tmpdir(), 'pages-compat-'))

    try {
      mkdirSync(join(distDir, 'assets'), { recursive: true })
      mkdirSync(join(distDir, 'writing', 'verdant-umbra-pages'), { recursive: true })
      writeFileSync(join(distDir, 'assets', 'patrick-ottley.jpg'), 'portrait')
      writeFileSync(join(distDir, 'assets', 'life-on-our-planet-atlas.png'), 'atlas')
      writeFileSync(join(distDir, 'writing', 'writing-sample-ottley.pdf'), 'sample')
      writeFileSync(join(distDir, 'writing', 'verdant-umbra-pages', 'page-001.jpg'), 'page-one')
      writeFileSync(join(distDir, 'JPO.Resume.pdf'), 'resume')

      await createPagesCompatAlias({ distDir })

      expect(readFileSync(join(distDir, 'PatrickOttleyPortfolio', 'assets', 'patrick-ottley.jpg'), 'utf8')).toBe(
        'portrait',
      )
      expect(
        readFileSync(join(distDir, 'PatrickOttleyPortfolio', 'assets', 'life-on-our-planet-atlas.png'), 'utf8'),
      ).toBe('atlas')
      expect(
        readFileSync(join(distDir, 'PatrickOttleyPortfolio', 'writing', 'writing-sample-ottley.pdf'), 'utf8'),
      ).toBe('sample')
      expect(
        readFileSync(
          join(distDir, 'PatrickOttleyPortfolio', 'writing', 'verdant-umbra-pages', 'page-001.jpg'),
          'utf8',
        ),
      ).toBe('page-one')
      expect(readFileSync(join(distDir, 'PatrickOttleyPortfolio', 'JPO.Resume.pdf'), 'utf8')).toBe('resume')
    } finally {
      rmSync(distDir, { force: true, recursive: true })
    }
  })
})
