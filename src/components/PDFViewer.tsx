import React, { useEffect, useRef, useState } from 'react'
// We'll dynamically import `pdfjs-dist` to keep the heavy PDF library out of the main bundle

type Props = {
  base64: string | null | undefined
}

export default function PDFViewer({ base64 }: Props){
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null | undefined>(base64)
  const [pdf, setPdf] = useState<any>(null)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    // noop: we'll create a dedicated Worker when loading each document
  }, [])

  useEffect(() => {
    // If a base64 prop is provided prefer it, otherwise attempt to load a legacy fallback
    if (base64) {
      setPdfBase64(base64)
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const resp = await fetch('/resources/base64/pack_tom.js')
        if (!resp.ok) return
        const txt = await resp.text()
        // find the first base64 PDF blob that starts with 'JVBERi0'
        const m = txt.match(/(['"])(JVBERi0[A-Za-z0-9+/=]+)\1/)
        if (m && !cancelled) setPdfBase64(m[2])
      } catch (err) {
        console.error('failed loading legacy base64 fallback', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [base64])

  useEffect(() => {
    if (!pdfBase64) return;
    const load = async () => {
      // decode base64 into Uint8Array
      const binary = atob(pdfBase64 as string);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      // Dynamically load pdfjs to keep it code-split
      const pdfjs = await import('pdfjs-dist')
      const { getDocument } = pdfjs as any
      // Use the packaged pdfjs worker via Vite's URL handling (bundles the worker).
      const worker = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url), { type: 'module' });
      const loadingTask = getDocument({ data: bytes, worker });
      const pdfDoc = await loadingTask.promise;
      setPdf(pdfDoc);
      setTotalPages(pdfDoc.numPages);
      setCurrentPage(1);
    }
    load().catch(err => console.error(err))
    return () => {
      setPdf(null);
      setTotalPages(0);
    }
  }, [pdfBase64])

  useEffect(() => {
    if (!pdf) return;
    const renderPage = async (pageNum: number) => {
      const page = await pdf.getPage(pageNum);
      const container = containerRef.current;
      if (!container) return;
      // Prefer width-based scaling to match legacy viewer sizing
      const unscaled = page.getViewport({ scale: 1 });
      const scale = container.clientWidth / unscaled.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = Math.floor(viewport.height);
      canvas.width = Math.floor(viewport.width);
      // clear previous canvases
      container.querySelectorAll('canvas').forEach(c => c.remove());
      container.appendChild(canvas);
      await page.render({ canvasContext: context, viewport }).promise;
    }
    renderPage(currentPage).catch(err => console.error(err))
  }, [pdf, currentPage])

  if (!pdfBase64) return <div>Loading PDF…</div>

  return (
    <div>
      <div id="pdf-viewer" ref={containerRef} style={{height: 'calc(100vh - 160px)'}}>
        <span className="left" onClick={() => setCurrentPage(p => Math.max(1, p-1))} />
        <span className="right" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} />
      </div>
      <div style={{marginTop:8}}>
        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))}>Prev Page</button>
        <span style={{margin: '0 8px'}}>{currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}>Next Page</button>
      </div>
    </div>
  )
}
