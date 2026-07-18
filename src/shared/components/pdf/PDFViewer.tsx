import React, { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import {
  loadFallbackPdfBase64,
  resolvePdfBase64,
} from '../../services/pdf/pdfSourceService'
import {
  loadPdfDocumentFromBase64,
  renderPdfPageIntoContainer,
} from '../../services/pdf/pdfDocumentService'
import {
  markPdfError,
  markPdfLoaded,
  markPdfRendered,
  resetPdfDiagnostics,
} from '../../services/runtime/windowGlobals'

// Keep the PDF runtime out of the main bundle until a document is actually opened.

type PdfDocument = PDFDocumentProxy

type PdfPage = PDFPageProxy

type Props = {
  base64: string | null | undefined
  scaleMode?: 'fit-width' | 'fit-contain'
}

type PdfFailureStage = 'resolve' | 'load' | 'render'

function getFriendlyPdfErrorMessage(stage: PdfFailureStage, error: string | null) {
  const detail = error ? `\n\nDetails: ${error}` : ''

  if (stage === 'resolve') {
    return `We could not find the PDF for this song. The file may be missing or unavailable on this device.${detail}`
  }

  if (stage === 'load') {
    return `The PDF file was found, but this device could not open it. This can happen on older iOS versions or when a PDF is corrupted.${detail}`
  }

  return `The PDF opened, but the viewer could not draw the page on screen. You can try again, or go back and reopen the song.${detail}`
}

function useResolvedPdfBase64(base64: string | null | undefined, retryToken: number) {
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const resolvePdfSource = async () => {
      if (base64) {
        const resolved = resolvePdfBase64(base64)
        if (!resolved) {
          setResolveError('The PDF reference could not be resolved.')
        }
        setPdfBase64(resolved)
        return
      }

      try {
        const fallbackBase64 = await loadFallbackPdfBase64()
        if (!cancelled) {
          setPdfBase64(fallbackBase64)
          setResolveError(null)
        }
      } catch (error) {
        console.error('failed loading fallback pdf', error)
        if (!cancelled) {
          setResolveError('The fallback PDF could not be loaded.')
        }
      }
    }

    setPdfBase64(null)
    setResolveError(null)
    resolvePdfSource()

    return () => {
      cancelled = true
    }
  }, [base64, retryToken])

  return { pdfBase64, resolveError }
}

function useLoadedPdfDocument(pdfBase64: string | null, retryToken: number) {
  const [pdfDocument, setPdfDocument] = useState<PdfDocument | null>(null)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadPdfDocument = async () => {
      if (!pdfBase64 || !pdfBase64.startsWith('JVBERi0')) {
        setPdfDocument(null)
        setTotalPages(0)
        setCurrentPage(1)
        setLoadError(pdfBase64 ? 'The PDF data was not valid base64 PDF content.' : null)
        resetPdfDiagnostics()
        return
      }

      const loadedPdfDocument = await loadPdfDocumentFromBase64(pdfBase64)

      if (cancelled) {
        return
      }

      setPdfDocument(loadedPdfDocument)
      setTotalPages(loadedPdfDocument.numPages)
      setCurrentPage(1)
      setLoadError(null)
      markPdfLoaded()
    }

    setPdfDocument(null)
    setTotalPages(0)
    setLoadError(null)

    loadPdfDocument().catch(error => {
      if (!cancelled) {
        setLoadError(String(error))
        markPdfError(error)
        console.error('Failed to load PDF document:', error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [pdfBase64, retryToken])

  return {
    currentPage,
    loadError,
    pdfDocument,
    setCurrentPage,
    totalPages,
  }
}

function useRenderedPdfPage(
  containerRef: React.RefObject<HTMLDivElement | null>,
  pdfDocument: PdfDocument | null,
  currentPage: number,
  scaleMode: 'fit-width' | 'fit-contain',
  retryToken: number,
) {
  const [renderError, setRenderError] = useState<string | null>(null)

  useEffect(() => {
    if (!pdfDocument) {
      setRenderError(null)
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
      await renderPdfPageIntoContainer(container, page, scaleMode)

      if (!cancelled) {
        setRenderError(null)
        markPdfRendered()
      }
    }

    renderPageIntoContainer().catch(error => {
      if (!cancelled) {
        setRenderError(String(error))
        markPdfError(error)
        console.error(error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [containerRef, currentPage, pdfDocument, scaleMode, retryToken])

  return renderError
}

export default function PDFViewer({ base64, scaleMode = 'fit-width' }: Props){
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const { pdfBase64, resolveError } = useResolvedPdfBase64(base64, retryToken)
  const { pdfDocument, totalPages, currentPage, setCurrentPage, loadError } = useLoadedPdfDocument(pdfBase64, retryToken)
  const renderError = useRenderedPdfPage(containerRef, pdfDocument, currentPage, scaleMode, retryToken)

  const failureError = resolveError || loadError || renderError
  const failureStage: PdfFailureStage = resolveError ? 'resolve' : loadError ? 'load' : 'render'

  if (failureError) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-8">
        <div className="max-w-lg rounded-3xl border border-amber-200 bg-white/95 p-6 text-center shadow-pdf backdrop-blur">
          <p className="text-2xl font-semibold text-zinc-900">PDF viewer problem</p>
          <p className="mt-3 whitespace-pre-line text-base leading-6 text-zinc-700">
            {getFriendlyPdfErrorMessage(failureStage, failureError)}
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
            onClick={() => setRetryToken(token => token + 1)}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!pdfBase64) {
    return <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-xl text-zinc-600">Loading PDF...</div>
  }

  return (
    <div
      id="pdf-viewer"
      data-testid="pdf-viewer"
      ref={containerRef}
      className="relative flex min-h-0 flex-1 flex-wrap items-center justify-center overflow-hidden [--pdf-render-inset-x:16px] [--pdf-render-inset-y:16px] [&_canvas]:max-h-full [&_canvas]:max-w-full [&_canvas]:rounded-xl [&_canvas]:shadow-pdf"
    >
      <span
        data-testid="pdf-prev-page-zone"
        className="left absolute left-0 top-0 h-full w-1/2 cursor-pointer"
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      />
      <span
        data-testid="pdf-next-page-zone"
        className="right absolute left-1/2 top-0 h-full w-1/2 cursor-pointer"
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      />
    </div>
  )
}
