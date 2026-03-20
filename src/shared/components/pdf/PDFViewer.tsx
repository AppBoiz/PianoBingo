import React, { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import {
  loadLegacyFallbackPdfBase64,
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
}

function useResolvedPdfBase64(base64: string | null | undefined) {
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const resolvePdfSource = async () => {
      if (base64) {
        setPdfBase64(resolvePdfBase64(base64))
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
      markPdfLoaded()
    }

    setPdfDocument(null)
    setTotalPages(0)

    loadPdfDocument().catch(error => {
      if (!cancelled) {
        markPdfError(error)
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
      await renderPdfPageIntoContainer(container, page)

      if (!cancelled) {
        markPdfRendered()
      }
    }

    renderPageIntoContainer().catch(error => {
      if (!cancelled) {
        markPdfError(error)
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
      <div id="pdf-viewer" data-testid="pdf-viewer" ref={containerRef} style={{height: 'calc(100vh - 140px)'}}>
        <span data-testid="pdf-prev-page-zone" className="left" onClick={() => setCurrentPage(p => Math.max(1, p-1))} />
        <span data-testid="pdf-next-page-zone" className="right" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} />
      </div>
    </div>
  )
}
