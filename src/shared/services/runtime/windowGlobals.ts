import type { Pack, Song } from '../../types/models'

export function getBasePackData(): Pack[] {
  return window.BASE_PACK_DATA ?? []
}

export function getBaseSongData(): Song[] {
  return window.BASE_SONG_DATA ?? []
}

export function setBaseData(packs: Pack[], songs: Song[]): void {
  window.BASE_PACK_DATA = packs
  window.BASE_SONG_DATA = songs
}

export function setPdfResolver(resolver: (pdfUrl: string) => string | null): void {
  window.resolvePdfUrl = resolver
}

export function getPdfResolver() {
  return window.resolvePdfUrl
}

export function getWindowStringValue(key: string): string | null {
  const dynamicWindow = window as unknown as Record<string, unknown>
  const value = dynamicWindow[key]

  return typeof value === 'string' ? value : null
}

export function markPdfLoaded(): void {
  window.__PDF_LOADED__ = true
  window.__PDF_RENDER_ERROR__ = null
}

export function markPdfRendered(): void {
  window.__PDF_RENDERED__ = true
}

export function markPdfError(error: unknown): void {
  window.__PDF_RENDER_ERROR__ = String(error)
}

export function resetPdfDiagnostics(): void {
  window.__PDF_LOADED__ = false
  window.__PDF_RENDERED__ = false
  window.__PDF_RENDER_ERROR__ = null
}