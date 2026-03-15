import { PAGE, PAGE_NAME } from '../../constants/navigation'

export { PAGE }
export { PAGE_NAME as PAGE_NAME_CONSTANT }

// For legacy pages running outside React, post a message to parent (iframe host)
export function loadPageLegacy(page: string){
  try {
    const message = { type: 'goToPage', page }
    window.parent.postMessage(message, '*')
  } catch (e) {
    // no-op
  }
}
