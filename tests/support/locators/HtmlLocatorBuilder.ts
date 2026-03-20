import type { Locator } from '@playwright/test'
import { LocatorBuilder } from './LocatorBuilder'

export class HtmlLocatorBuilder extends LocatorBuilder {
  constructor(locator: Locator) {
    super(locator)
  }

  byAction(actionId: string): HtmlLocatorBuilder {
    return new HtmlLocatorBuilder(this.locate().locator(`[data-action="${actionId}"]`))
  }

  byTestId(testId: string): HtmlLocatorBuilder {
    return new HtmlLocatorBuilder(this.locate().getByTestId(testId))
  }

  byClass(className: string): HtmlLocatorBuilder {
    return new HtmlLocatorBuilder(this.locate().locator(`.${className}`))
  }

  byTag(tagName: string): HtmlLocatorBuilder {
    return new HtmlLocatorBuilder(this.locate().locator(tagName))
  }

  first(): HtmlLocatorBuilder {
    return new HtmlLocatorBuilder(this.locate().first())
  }

  second(): HtmlLocatorBuilder {
    return new HtmlLocatorBuilder(this.locate().nth(1))
  }

  third(): HtmlLocatorBuilder {
    return new HtmlLocatorBuilder(this.locate().nth(2))
  }

  fourth(): HtmlLocatorBuilder {
    return new HtmlLocatorBuilder(this.locate().nth(3))
  }

  nth(index: number): HtmlLocatorBuilder {
    return new HtmlLocatorBuilder(this.locate().nth(index))
  }
}
