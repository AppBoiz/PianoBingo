import fs from 'fs'
import path from 'path'

const projectRoot = process.cwd()
const srcRoot = path.join(projectRoot, 'src')

function listDirNames(dirPath: string): string[] {
  return fs.readdirSync(dirPath)
}

function listDirs(dirPath: string): string[] {
  return fs.readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

function walkFiles(dirPath: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, acc)
    } else {
      acc.push(fullPath)
    }
  }

  return acc
}

describe('architecture rules', () => {
  test('src top-level structure matches finalized contract', () => {
    const required = ['App.tsx', 'main.tsx', 'pages', 'shared', 'init', 'styles', 'vite-env.d.ts']
    const allowed = new Set(required)
    const entries = listDirNames(srcRoot)

    for (const entry of entries) {
      expect(allowed.has(entry)).toBe(true)
    }

    for (const expected of required) {
      expect(entries).toContain(expected)
    }
  })

  test('feature folders exist under src/pages', () => {
    const pagesRoot = path.join(srcRoot, 'pages')
    const actualFeatures = new Set(listDirs(pagesRoot))
    const expectedFeatures = ['game', 'packs', 'songs', 'welcome']

    for (const feature of expectedFeatures) {
      expect(actualFeatures.has(feature)).toBe(true)
    }
  })

  test('no components directory exists under src/pages', () => {
    const pagesRoot = path.join(srcRoot, 'pages')
    const stack = [pagesRoot]

    while (stack.length > 0) {
      const current = stack.pop() as string
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue

        expect(entry.name).not.toBe('components')
        stack.push(path.join(current, entry.name))
      }
    }
  })

  test('required page entry files exist with explicit names', () => {
    const requiredEntries = [
      ['game', 'Game', 'Game.tsx'],
      ['game', 'GameHistory', 'GameHistory.tsx'],
      ['game', 'PackSelect', 'PackSelect.tsx'],
      ['packs', 'PackEdit', 'PackEdit.tsx'],
      ['packs', 'PackManagement', 'PackManagement.tsx'],
      ['songs', 'SongManagement', 'SongManagement.tsx'],
      ['songs', 'SongView', 'SongView.tsx'],
      ['welcome', 'WelcomePage', 'WelcomePage.tsx'],
    ] as const

    for (const [feature, pageDir, fileName] of requiredEntries) {
      const fullPath = path.join(srcRoot, 'pages', feature, pageDir, fileName)
      expect(fs.existsSync(fullPath)).toBe(true)
    }
  })

  test('game page naming is free of legacy PdfReader symbols', () => {
    const gameRoot = path.join(srcRoot, 'pages', 'game', 'Game')
    const forbiddenTokens = ['PdfReader', 'PdfHamburgerMenu', 'PdfReaderHeader', 'PdfReaderFooter']

    for (const filePath of walkFiles(gameRoot).filter((file) => /\.(ts|tsx)$/.test(file))) {
      const text = fs.readFileSync(filePath, 'utf8')
      for (const token of forbiddenTokens) {
        expect(text.includes(token)).toBe(false)
      }
    }
  })

  test('routing contracts match architecture expectations', () => {
    const navigationText = fs.readFileSync(path.join(srcRoot, 'shared', 'constants', 'navigation.ts'), 'utf8')
    const appText = fs.readFileSync(path.join(srcRoot, 'App.tsx'), 'utf8')

    expect(navigationText).toMatch(/GAME:\s*'\/game'/)
    expect(appText).toContain("import Game from './pages/game/Game/Game'")
    expect(appText).toMatch(/Route\s+path=\{PAGE\.GAME\}\s+element=\{<Game\/>\}/)
  })
})
