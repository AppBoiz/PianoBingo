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
  const header = '%PDF-1.4\n'
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>\nendobj\n',
  ]

  let body = ''
  const offsets = objects.map(objectText => {
    const offset = header.length + body.length
    body += objectText
    return offset
  })

  const xrefOffset = header.length + body.length
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    '0000000000 65535 f \n',
    ...offsets.map(offset => `${offset.toString().padStart(10, '0')} 00000 n \n`),
  ].join('')
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return btoa(`${header}${body}${xref}${trailer}`)
}

export function decodePdfBase64ToBytes(pdfBase64: string): Uint8Array {
  const binary = atob(pdfBase64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}