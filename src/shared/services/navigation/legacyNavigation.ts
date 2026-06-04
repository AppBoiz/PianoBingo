import { PAGE, PAGE_NAME } from '../../constants/navigation'
import { postMessageToParent } from '../runtime/frameMessaging'

export { PAGE }
export { PAGE_NAME as PAGE_NAME_CONSTANT }

// For legacy pages running outside React, post a message to parent (iframe host)
export function loadPageLegacy(page: string){
  try {
    const message = { type: 'goToPage', page }
    postMessageToParent(message)
  } catch (e) {
    // no-op
  }
}
