import React, { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { LEGACY_PDF_FALLBACK_PATH } from '../../constants/pdf'

// Keep the PDF runtime out of the main bundle until a document is actually opened.

type PdfDocument = PDFDocumentProxy

type PdfPage = PDFPageProxy

type Props = {
  base64: string | null | undefined
}

function markPdfLoadedForDiagnostics() {
  if (typeof window === 'undefined') return
  window.__PDF_LOADED__ = true
  window.__PDF_RENDER_ERROR__ = null
}

function markPdfRenderedForDiagnostics() {
  if (typeof window === 'undefined') return
  window.__PDF_RENDERED__ = true
}

function markPdfErrorForDiagnostics(error: unknown) {
  if (typeof window === 'undefined') return
  window.__PDF_RENDER_ERROR__ = String(error)
}

function resolveProvidedPdfBase64(base64: string) {
  const resolvePdfUrl = window.resolvePdfUrl
  const resolved = typeof resolvePdfUrl === 'function' ? resolvePdfUrl(base64) : base64
  const cleaned = (resolved || '').replace(/\s/g, '')

  if (cleaned.startsWith('JVBERi0')) {
    return cleaned
  }

  console.warn('Could not resolve PDF URL to valid base64:', base64)
  return null
}

async function loadLegacyFallbackPdfBase64() {
  const response = await fetch(LEGACY_PDF_FALLBACK_PATH)
  if (!response.ok) {
    return null
  }

  const fileContents = await response.text()
  const firstPdfMatch = fileContents.match(/(['"])(JVBERi0[A-Za-z0-9+/=]+)\1/)
  return firstPdfMatch?.[2] ?? null
}

function decodePdfBase64ToBytes(pdfBase64: string) {
  const binary = atob(pdfBase64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function useResolvedPdfBase64(base64: string | null | undefined) {
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const resolvePdfSource = async () => {
      if (base64) {
        setPdfBase64(resolveProvidedPdfBase64(base64))
        return
      }

      try {
        const fallbackBase64 = await loadLegacyFallbackPdfBase64()
        if (!cancelled) {
          setPdfBase64(fallbackBase64)
        }
      } catch (error) {
        console.error('failed loading legacy base64 fallback', error)
      }
    }

    setPdfBase64(null)
    resolvePdfSource()

    return () => {
      cancelled = true
    }
  }, [base64])

  return pdfBase64
}

function useLoadedPdfDocument(pdfBase64: string | null) {
  const [pdfDocument, setPdfDocument] = useState<PdfDocument | null>(null)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    let cancelled = false

    const loadPdfDocument = async () => {
      if (!pdfBase64 || !pdfBase64.startsWith('JVBERi0')) {
        setPdfDocument(null)
        setTotalPages(0)
        setCurrentPage(1)
        return
      }

      const pdfBytes = decodePdfBase64ToBytes(pdfBase64)
      const pdfjs = await import('pdfjs-dist')
      const { getDocument, GlobalWorkerOptions } = pdfjs
      const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)

      GlobalWorkerOptions.workerSrc = workerUrl.toString()

      const loadingTask = getDocument({ data: pdfBytes })
      const loadedPdfDocument = await loadingTask.promise

      if (cancelled) {
        return
      }

      setPdfDocument(loadedPdfDocument)
      setTotalPages(loadedPdfDocument.numPages)
      setCurrentPage(1)
      markPdfLoadedForDiagnostics()
    }

    setPdfDocument(null)
    setTotalPages(0)

    loadPdfDocument().catch(error => {
      if (!cancelled) {
        markPdfErrorForDiagnostics(error)
        console.error('Failed to load PDF document:', error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [pdfBase64])

  return {
    currentPage,
    pdfDocument,
    setCurrentPage,
    totalPages,
  }
}

function useRenderedPdfPage(containerRef: React.RefObject<HTMLDivElement | null>, pdfDocument: PdfDocument | null, currentPage: number) {
  useEffect(() => {
    if (!pdfDocument) {
      return
    }

    let cancelled = false

    const renderPageIntoContainer = async () => {
      const page = await pdfDocument.getPage(currentPage)
      const container = containerRef.current

      if (!container || cancelled) {
        return
      }

      // Match the legacy viewer's width-first behavior so sizing stays visually consistent.
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

      if (!cancelled) {
        markPdfRenderedForDiagnostics()
      }
    }

    renderPageIntoContainer().catch(error => {
      if (!cancelled) {
        markPdfErrorForDiagnostics(error)
        console.error(error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [containerRef, currentPage, pdfDocument])
}

export default function PDFViewer({ base64 }: Props){
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pdfBase64 = useResolvedPdfBase64(base64)
  const { pdfDocument, totalPages, currentPage, setCurrentPage } = useLoadedPdfDocument(pdfBase64)

  useRenderedPdfPage(containerRef, pdfDocument, currentPage)

  if (!pdfBase64) return <div>Loading PDF…</div>

  return (
    <div>
      <div id="pdf-viewer" ref={containerRef} style={{height: 'calc(100vh - 140px)'}}>
        <span className="left" onClick={() => setCurrentPage(p => Math.max(1, p-1))} />
        <span className="right" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} />
      </div>
    </div>
  )
}
