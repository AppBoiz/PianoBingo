import React, { useEffect, useRef, useState } from 'react'
import { getDocument } from 'pdfjs-dist'

type Props = {
  base64: string | null | undefined
}

export default function PDFViewer({ base64 }: Props){
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [pdf, setPdf] = useState<any>(null)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    // set worker src from package
    try {
      // @ts-ignore
      import('pdfjs-dist/build/pdf.worker.entry').then((workerModule) => {
        // workerModule path is resolved by bundler; pdfjs will auto-use worker if available
        // explicit worker setting for safety:
        // @ts-ignore
        (window as any).pdfjsLib = (window as any).pdfjsLib || {};
        // no-op: Vite handles worker import
      })
    } catch (e) {
      console.warn('Could not set pdf worker via package import', e)
    }
  }, [])

  useEffect(() => {
    if (!base64) return;
    const load = async () => {
      // decode base64 into Uint8Array
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

      const loadingTask = getDocument({ data: bytes });
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
