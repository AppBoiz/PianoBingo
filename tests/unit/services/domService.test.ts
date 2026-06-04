/** @jest-environment jsdom */
import {
  getRequiredElementById,
  getOrderedIdsFromContainer,
} from '../../../src/shared/services/runtime/domService'

afterEach(() => {
  document.body.innerHTML = ''
})

// ---------------------------------------------------------------------------
// getRequiredElementById
// ---------------------------------------------------------------------------

describe('getRequiredElementById', () => {
  test('returns the element when it exists', () => {
    document.body.innerHTML = '<div id="my-div">Hello</div>'
    const el = getRequiredElementById('my-div')
    expect(el).toBeTruthy()
    expect(el.tagName).toBe('DIV')
  })

  test('throws with the element id in the message when element does not exist', () => {
    expect(() => getRequiredElementById('nonexistent')).toThrow(
      'Required element not found: nonexistent',
    )
  })

  test('returns an input element with the correct type cast', () => {
    document.body.innerHTML = '<input id="my-input" type="text" />'
    const el = getRequiredElementById<HTMLInputElement>('my-input')
    expect(el.tagName).toBe('INPUT')
  })

  test('finds elements anywhere in the DOM tree', () => {
    document.body.innerHTML = '<section><article><span id="deep">x</span></article></section>'
    const el = getRequiredElementById('deep')
    expect(el.tagName).toBe('SPAN')
  })
})

// ---------------------------------------------------------------------------
// getOrderedIdsFromContainer
// ---------------------------------------------------------------------------

describe('getOrderedIdsFromContainer', () => {
  test('extracts numeric IDs from matching rows in DOM order', () => {
    document.body.innerHTML = `
      <ul>
        <li class="row" data-song-id="3"></li>
        <li class="row" data-song-id="1"></li>
        <li class="row" data-song-id="2"></li>
      </ul>
    `
    const ids = getOrderedIdsFromContainer(document.body, '.row', 'data-song-id')
    expect(ids).toEqual([3, 1, 2])
  })

  test('returns an empty array when no rows match the selector', () => {
    document.body.innerHTML = '<ul></ul>'
    const ids = getOrderedIdsFromContainer(document.body, '.row', 'data-song-id')
    expect(ids).toEqual([])
  })

  test('defaults to 0 when the id attribute is missing', () => {
    document.body.innerHTML = '<ul><li class="row"></li></ul>'
    const ids = getOrderedIdsFromContainer(document.body, '.row', 'data-song-id')
    expect(ids).toEqual([0])
  })

  test('defaults to 0 when the id attribute is an empty string', () => {
    document.body.innerHTML = '<ul><li class="row" data-song-id=""></li></ul>'
    const ids = getOrderedIdsFromContainer(document.body, '.row', 'data-song-id')
    expect(ids).toEqual([0])
  })

  test('works with a non-body container element', () => {
    const container = document.createElement('div')
    container.innerHTML = `
      <span class="item" data-pack-id="10"></span>
      <span class="item" data-pack-id="20"></span>
    `
    const ids = getOrderedIdsFromContainer(container, '.item', 'data-pack-id')
    expect(ids).toEqual([10, 20])
  })

  test('works with a different row selector and attribute name', () => {
    document.body.innerHTML = `
      <div>
        <section class="pack-row" data-pack-id="5"></section>
        <section class="pack-row" data-pack-id="8"></section>
      </div>
    `
    const ids = getOrderedIdsFromContainer(document.body, '.pack-row', 'data-pack-id')
    expect(ids).toEqual([5, 8])
  })
})
