function getParentTargetOrigin(): string {
  if (typeof document !== 'undefined' && document.referrer) {
    try {
      return new URL(document.referrer).origin
    } catch {
      return '*'
    }
  }

  return '*'
}

export function postMessageToParent(message: unknown): void {
  if (typeof window === 'undefined' || window.parent === window) {
    return
  }

  window.parent.postMessage(message, getParentTargetOrigin())
}