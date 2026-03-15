import { readFileAsDataUrl } from '../services/runtime/fileReaderService'

export function fileToBase64(file: File): Promise<string> {
  return readFileAsDataUrl(file)
}
