import React, { useEffect, useRef, useState } from 'react'
// We'll dynamically import `pdfjs-dist` to keep the heavy PDF library out of the main bundle

type Props = {
  base64: string | null | undefined
}

export default function PDFViewer({ base64 }: Props){
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [pdf, setPdf] = useState<any>(null)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    // noop: we'll create a dedicated Worker when loading each document
  }, [])

  useEffect(() => {
    if (!base64) return;
    const load = async () => {
      // decode base64 into Uint8Array
      const binary = atob(base64);
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
  }, [base64])

  useEffect(() => {
    if (!pdf) return;
    const renderPage = async (pageNum: number) => {
      const page = await pdf.getPage(pageNum);
      const container = containerRef.current;
      if (!container) return;
      const viewport = page.getViewport({ scale: container.clientHeight / page.getViewport({ scale:1 }).height });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      // clear
      container.querySelectorAll('canvas').forEach(c => c.remove());
      container.appendChild(canvas);
      await page.render({ canvasContext: context, viewport }).promise;
    }
    renderPage(currentPage).catch(err => console.error(err))
  }, [pdf, currentPage])

  if (!base64) return <div>No PDF available</div>

  return (
    <div>
      <div id="pdf-viewer" ref={containerRef} style={{height: '70vh'}} />
      <div style={{marginTop:8}}>
        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))}>Prev Page</button>
        <span style={{margin: '0 8px'}}>{currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}>Next Page</button>
      </div>
    </div>
  )
}
