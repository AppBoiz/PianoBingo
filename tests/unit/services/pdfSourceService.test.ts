import {
  isPdfBase64,
  resolvePdfBase64,
  loadLegacyFallbackPdfBase64,
  decodePdfBase64ToBytes,
} from '../../../src/shared/services/pdf/pdfSourceService'

jest.mock('../../../src/shared/services/runtime/windowGlobals', () => ({
  getPdfResolver: jest.fn(),
  getWindowStringValue: jest.fn(),
}))

jest.mock('../../../src/shared/services/network/resourceLoader', () => ({
  fetchTextResource: jest.fn(),
}))

import { getPdfResolver, getWindowStringValue } from '../../../src/shared/services/runtime/windowGlobals'
import { fetchTextResource } from '../../../src/shared/services/network/resourceLoader'

// A minimal valid PDF base64 prefix (PDF magic bytes "JVBERi0")
const VALID_PDF_BASE64 = 'JVBERi0xLjQgdGVzdA=='

// ---------------------------------------------------------------------------
// isPdfBase64
// ---------------------------------------------------------------------------

describe('isPdfBase64', () => {
  test('returns true for a string starting with the PDF magic prefix', () => {
    expect(isPdfBase64('JVBERi0xLjQ=')).toBe(true)
  })

  test('returns true when the value has leading/trailing whitespace', () => {
    expect(isPdfBase64('  JVBERi0xLjQ=  ')).toBe(true)
  })

  test('returns true for a longer valid PDF base64 string', () => {
    expect(isPdfBase64(VALID_PDF_BASE64)).toBe(true)
  })

  test('returns false for a non-PDF base64 string', () => {
    expect(isPdfBase64('SGVsbG8gV29ybGQ=')).toBe(false)
  })

  test('returns false for an empty string', () => {
    expect(isPdfBase64('')).toBe(false)
  })

  test('returns false for null', () => {
    expect(isPdfBase64(null)).toBe(false)
  })

  test('returns false for undefined', () => {
    expect(isPdfBase64(undefined)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// resolvePdfBase64
// ---------------------------------------------------------------------------

describe('resolvePdfBase64', () => {
  beforeEach(() => {
    jest.mocked(getPdfResolver).mockReturnValue(undefined)
    jest.mocked(getWindowStringValue).mockReturnValue(null)
  })

  test('returns the input when no resolver is set and input is valid PDF base64', () => {
    const result = resolvePdfBase64(VALID_PDF_BASE64)
    expect(result).toBe(VALID_PDF_BASE64)
  })

  test('uses the resolver when one is provided and it returns valid base64', () => {
    jest.mocked(getPdfResolver).mockReturnValue(() => VALID_PDF_BASE64)
    const result = resolvePdfBase64('some-lookup-key')
    expect(result).toBe(VALID_PDF_BASE64)
  })

  test('falls back to getWindowStringValue when resolver returns null', () => {
    jest.mocked(getPdfResolver).mockReturnValue(() => null)
    jest.mocked(getWindowStringValue).mockReturnValue(VALID_PDF_BASE64)
    const result = resolvePdfBase64('some-key')
    expect(result).toBe(VALID_PDF_BASE64)
  })

  test('returns null and emits a console.warn when resolution fails completely', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.mocked(getPdfResolver).mockReturnValue(() => null)
    jest.mocked(getWindowStringValue).mockReturnValue(null)

    const result = resolvePdfBase64('bad-key')

    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Could not resolve'),
      'bad-key',
    )
    warnSpy.mockRestore()
  })

  test('strips whitespace from the resolved base64 before returning', () => {
    jest.mocked(getPdfResolver).mockReturnValue(() => 'JVBERi0 xLjQ=')
    const result = resolvePdfBase64('key')
    expect(result).toBe('JVBERi0xLjQ=')
  })

  test('passes the input key to getWindowStringValue when resolver returns null', () => {
    jest.mocked(getPdfResolver).mockReturnValue(() => null)
    jest.mocked(getWindowStringValue).mockReturnValue(null)
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    resolvePdfBase64('lookup-key')

    expect(jest.mocked(getWindowStringValue)).toHaveBeenCalledWith('lookup-key')
  })
})

// ---------------------------------------------------------------------------
// loadLegacyFallbackPdfBase64
// ---------------------------------------------------------------------------

describe('loadLegacyFallbackPdfBase64', () => {
  test('extracts base64 from a double-quoted PDF string in file contents', async () => {
    jest.mocked(fetchTextResource).mockResolvedValue(`var x = "${VALID_PDF_BASE64}";`)
    const result = await loadLegacyFallbackPdfBase64()
    expect(result).toBe(VALID_PDF_BASE64)
  })

  test('extracts base64 from a single-quoted PDF string', async () => {
    jest.mocked(fetchTextResource).mockResolvedValue(`var x = '${VALID_PDF_BASE64}';`)
    const result = await loadLegacyFallbackPdfBase64()
    expect(result).toBe(VALID_PDF_BASE64)
  })

  test('returns null when no PDF base64 string is present', async () => {
    jest.mocked(fetchTextResource).mockResolvedValue('var x = "not-a-pdf";')
    const result = await loadLegacyFallbackPdfBase64()
    expect(result).toBeNull()
  })

  test('returns the first match when multiple PDF strings are in the file', async () => {
    const second = 'JVBERi0second=='
    jest.mocked(fetchTextResource).mockResolvedValue(
      `var a = "${VALID_PDF_BASE64}"; var b = "${second}";`
    )
    const result = await loadLegacyFallbackPdfBase64()
    expect(result).toBe(VALID_PDF_BASE64)
  })
})

// ---------------------------------------------------------------------------
// decodePdfBase64ToBytes
// ---------------------------------------------------------------------------

describe('decodePdfBase64ToBytes', () => {
  test('decodes a known base64 string to the correct bytes', () => {
    // 'Hello' in base64 is 'SGVsbG8='
    const bytes = decodePdfBase64ToBytes('SGVsbG8=')
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111])
  })

  test('decodes "ABC" (base64 "QUJD") to [65, 66, 67]', () => {
    const bytes = decodePdfBase64ToBytes('QUJD')
    expect(Array.from(bytes)).toEqual([65, 66, 67])
  })

  test('returns a Uint8Array of the correct decoded length', () => {
    // 4 base64 chars encode 3 bytes
    const bytes = decodePdfBase64ToBytes('AAAA')
    expect(bytes.length).toBe(3)
  })

  test('returns an empty Uint8Array for an empty string', () => {
    const bytes = decodePdfBase64ToBytes('')
    expect(bytes.length).toBe(0)
  })
})
