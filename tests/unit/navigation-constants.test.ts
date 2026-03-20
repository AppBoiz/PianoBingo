import { PAGE, PAGE_NAME } from '../../src/shared/constants/navigation'

describe('navigation constants', () => {
  test('maps GAME to /game', () => {
    expect(PAGE.GAME).toBe('/game')
  })

  test('contains expected page name key', () => {
    expect(PAGE_NAME.GAME).toBe('GAME')
  })
})
