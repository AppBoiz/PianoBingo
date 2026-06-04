export function getRequiredElementById<T extends HTMLElement>(elementId: string): T {
  const element = document.getElementById(elementId)

  if (!element) {
    throw new Error(`Required element not found: ${elementId}`)
  }

  return element as T
}

export function getOrderedIdsFromContainer(
  container: ParentNode,
  rowSelector: string,
  idAttribute: string,
): number[] {
  return Array.from(container.querySelectorAll(rowSelector))
    .map(element => parseInt(element.getAttribute(idAttribute) || '0', 10))
}