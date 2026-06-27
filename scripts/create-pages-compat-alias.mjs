import { cp, mkdir, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LEGACY_PROJECT_PATH = 'PatrickOttleyPortfolio'
const ALIASED_PUBLIC_ASSETS = ['assets', 'writing', 'JPO.Resume.pdf']

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

export async function createPagesCompatAlias({ distDir = resolve(process.cwd(), 'dist') } = {}) {
  const legacyRoot = join(distDir, LEGACY_PROJECT_PATH)
  await mkdir(legacyRoot, { recursive: true })

  await Promise.all(
    ALIASED_PUBLIC_ASSETS.map(async (assetPath) => {
      const source = join(distDir, assetPath)
      if (!(await pathExists(source))) return

      await cp(source, join(legacyRoot, assetPath), {
        force: true,
        recursive: true,
      })
    }),
  )
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await createPagesCompatAlias()
}
