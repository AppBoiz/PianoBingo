import { LEGACY_PDF_FALLBACK_PATH } from '../../constants/pdf'
import { fetchTextResource } from '../network/resourceLoader'
import { getPdfResolver, getWindowStringValue } from '../runtime/windowGlobals'

const PDF_BASE64_PREFIX = 'JVBERi0'

export function isPdfBase64(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.replace(/\s/g, '').startsWith(PDF_BASE64_PREFIX)
}

export function resolvePdfBase64(base64: string): string | null {
  const resolver = getPdfResolver()
  const resolved = typeof resolver === 'function' ? resolver(base64) : base64
  const cleaned = (resolved || '').replace(/\s/g, '')

  if (isPdfBase64(cleaned)) {
    return cleaned
  }

  const dynamicValue = getWindowStringValue(base64)
  if (isPdfBase64(dynamicValue)) {
    return dynamicValue.replace(/\s/g, '')
  }

  console.warn('Could not resolve PDF URL to valid base64:', base64)
  return null
}

export async function loadLegacyFallbackPdfBase64(): Promise<string | null> {
  const fileContents = await fetchTextResource(LEGACY_PDF_FALLBACK_PATH)
  const firstPdfMatch = fileContents.match(/(['"])(JVBERi0[A-Za-z0-9+/=]+)\1/)
  return firstPdfMatch?.[2] ?? null
}

export function decodePdfBase64ToBytes(pdfBase64: string): Uint8Array {
  const binary = atob(pdfBase64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}