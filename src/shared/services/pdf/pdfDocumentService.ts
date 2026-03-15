import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { decodePdfBase64ToBytes } from './pdfSourceService'

type PdfJsModule = typeof import('pdfjs-dist')

let pdfJsModulePromise: Promise<PdfJsModule> | null = null

async function getPdfJsModule(): Promise<PdfJsModule> {
  if (!pdfJsModulePromise) {
    pdfJsModulePromise = import('pdfjs-dist').then(pdfjs => {
      const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.toString()
      return pdfjs
    })
  }

  return pdfJsModulePromise
}

export async function loadPdfDocumentFromBase64(pdfBase64: string): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJsModule()
  const loadingTask = pdfjs.getDocument({ data: decodePdfBase64ToBytes(pdfBase64) })
  return loadingTask.promise
}

export async function renderPdfPageIntoContainer(
  container: HTMLDivElement,
  page: PDFPageProxy,
): Promise<void> {
  const unscaledViewport = page.getViewport({ scale: 1 })
  const scale = container.clientWidth / unscaledViewport.width
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