import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { decodePdfBase64ToBytes } from './pdfSourceService'

type PdfJsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs')

let pdfJsModulePromise: Promise<PdfJsModule> | null = null

async function getPdfJsModule(): Promise<PdfJsModule> {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import('pdfjs-dist/legacy/build/pdf.mjs')
  }

  return pdfJsModulePromise
}

export async function loadPdfDocumentFromBase64(pdfBase64: string): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJsModule()
  const data = decodePdfBase64ToBytes(pdfBase64)

  const loadingTask = pdfjs.getDocument({ data, disableWorker: true })
  return await loadingTask.promise
}

export async function renderPdfPageIntoContainer(
  container: HTMLDivElement,
  page: PDFPageProxy,
  scaleMode: 'fit-width' | 'fit-contain' = 'fit-width',
): Promise<void> {
  const styles = window.getComputedStyle(container)
  const insetX = Number.parseFloat(styles.getPropertyValue('--pdf-render-inset-x')) || 0
  const insetY = Number.parseFloat(styles.getPropertyValue('--pdf-render-inset-y')) || 0
  const availableWidth = Math.max(container.clientWidth - insetX * 2, 1)
  const availableHeight = Math.max(container.clientHeight - insetY * 2, 1)
  const unscaledViewport = page.getViewport({ scale: 1 })
  const widthScale = availableWidth / unscaledViewport.width
  const heightScale = availableHeight / unscaledViewport.height
  const scale = scaleMode === 'fit-contain'
    ? Math.min(widthScale, heightScale)
    : widthScale
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas 2D context is not available')
  }

  canvas.height = Math.floor(viewport.height)
  canvas.width = Math.floor(viewport.width)

  container.querySelectorAll('canvas').forEach(existingCanvas => existingCanvas.remove())
  container.appendChild(canvas)

  await page.render({ canvas, canvasContext: context, viewport }).promise
}
