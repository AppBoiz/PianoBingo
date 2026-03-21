import type { Locator, Page } from '@playwright/test'
import { HtmlLocatorBuilder } from './HtmlLocatorBuilder'

export class PianoBingoLocatorBuilder extends HtmlLocatorBuilder {
  constructor(locator: Locator) {
    super(locator)
  }

  welcomePage(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('welcome-page'))
  }

  packSelectPage(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('pack-select-page'))
  }

  gamePage(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('game-page'))
  }

  gameHistoryPage(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('game-history-page'))
  }

  packManagementPage(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('pack-management-page'))
  }

  packEditPage(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('pack-edit-page'))
  }

  songManagementPage(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('song-management-page'))
  }

  songViewPage(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('song-view-page'))
  }

  pageBody(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('body'))
  }

  welcomeNewGame(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator('[data-action="new-game"]'))
  }

  welcomeManageSongs(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator('[data-action="manage-songs"]'))
  }

  welcomeManagePlaylists(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator('[data-action="manage-playlists"]'))
  }

  list(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('list'))
  }

  option(id: number): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId(`option-${id}`))
  }

  packRadioInputs(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator('input[type="radio"]'))
  }

  startGameButton(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator('[data-action="start-game"]'))
  }

  header(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('header'))
  }

  footer(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('footer'))
  }

  menuWrapper(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('menu-wrapper'))
  }

  menu(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('menu'))
  }

  menuToggle(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('menu-toggle'))
  }

  menuToggleCheckbox(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('menu-toggle-checkbox'))
  }

  menuItem(actionId: 'next-song' | 'prev-song' | 'game-history' | 'end-game'): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.menu().locate().locator(`[data-action="${actionId}"]`))
  }

  nextSong(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.footer().locate().locator('[data-action="next-song"]'))
  }

  grid(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('grid'))
  }

  box(index1Based: number): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId(`box-${index1Based}`))
  }

  boxes(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator('[data-testid^="box-"]'))
  }

  highlightedBoxes(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator('.box.highlighted'))
  }

  emptyState(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('empty-state'))
  }

  primaryAction(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('primary-action'))
  }

  row(id: number): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId(`row-${id}`))
  }

  nameInput(id: number): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.row(id).locate().getByTestId('input'))
  }

  bySongUploadInput(songId: number): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId(`pdf-input-${songId}`))
  }

  action(actionId: string): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator(`[data-action="${actionId}"]`))
  }

  pdfViewer(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('pdf-viewer'))
  }

  pdfCanvas(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().getByTestId('pdf-viewer').locator('canvas'))
  }

  navTitle(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator('nav h1, #title').first())
  }

  backButton(): PianoBingoLocatorBuilder {
    return new PianoBingoLocatorBuilder(this.locate().locator('[data-action="back"]'))
  }
}

export function pianoBingoLocator(page: Page): PianoBingoLocatorBuilder {
  return new PianoBingoLocatorBuilder(page.locator('body'))
}

export const pianoBingoLocatorBuilder = pianoBingoLocator
