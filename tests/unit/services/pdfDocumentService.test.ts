jest.mock('pdfjs-dist/legacy/build/pdf.js', () => ({
  __esModule: true,
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: jest.fn(),
}))

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js'
import { loadPdfDocumentFromBase64 } from '../../../src/shared/services/pdf/pdfDocumentService'

describe('loadPdfDocumentFromBase64', () => {
  test('uses the emitted classic worker and passes decoded bytes to PDF.js', async () => {
    const pdfDocument = { numPages: 1 }
    jest.mocked(pdfjs.getDocument).mockReturnValue({
      promise: Promise.resolve(pdfDocument),
    } as ReturnType<typeof pdfjs.getDocument>)

    await expect(loadPdfDocumentFromBase64('JVBERi0xLjQ=')).resolves.toBe(pdfDocument)

    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/assets/pdf-worker.test.js')
    expect(pdfjs.getDocument).toHaveBeenCalledWith({
      data: expect.any(Uint8Array),
    })
    const data = jest.mocked(pdfjs.getDocument).mock.calls[0][0]
    expect('disableWorker' in (data as Record<string, unknown>)).toBe(false)
  })
})
