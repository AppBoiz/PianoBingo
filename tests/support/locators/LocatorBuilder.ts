import { expect as pwExpect, type Locator } from '@playwright/test'

export class LocatorBuilder {
  protected readonly current: Locator

  constructor(locator: Locator) {
    this.current = locator
  }

  // Always expose the wrapped locator for interop with native Playwright APIs.
  locate(): Locator {
    return this.current
  }

  locator(selector: string): LocatorBuilder {
    return new LocatorBuilder(this.current.locator(selector))
  }

  getByTestId(testId: string): LocatorBuilder {
    return new LocatorBuilder(this.current.getByTestId(testId))
  }

  getByText(text: string | RegExp): LocatorBuilder {
    return new LocatorBuilder(this.current.getByText(text))
  }

  getByRole(role: Parameters<Locator['getByRole']>[0], options?: Parameters<Locator['getByRole']>[1]): LocatorBuilder {
    return new LocatorBuilder(this.current.getByRole(role, options))
  }

  nth(index: number): LocatorBuilder {
    return new LocatorBuilder(this.current.nth(index))
  }

  filter(options: Parameters<Locator['filter']>[0]): LocatorBuilder {
    return new LocatorBuilder(this.current.filter(options))
  }

  click(options?: Parameters<Locator['click']>[0]): Promise<void> {
    return this.current.click(options)
  }

  fill(value: string, options?: Parameters<Locator['fill']>[1]): Promise<void> {
    return this.current.fill(value, options)
  }

  press(key: string, options?: Parameters<Locator['press']>[1]): Promise<void> {
    return this.current.press(key, options)
  }

  count(): Promise<number> {
    return this.current.count()
  }

  textContent(options?: Parameters<Locator['textContent']>[0]): Promise<string | null> {
    return this.current.textContent(options)
  }

  first(): LocatorBuilder {
    return new LocatorBuilder(this.current.first())
  }

  getAttribute(name: string, options?: Parameters<Locator['getAttribute']>[1]): Promise<string | null> {
    return this.current.getAttribute(name, options)
  }

  setInputFiles(files: Parameters<Locator['setInputFiles']>[0], options?: Parameters<Locator['setInputFiles']>[1]): Promise<void> {
    return this.current.setInputFiles(files, options)
  }

  async as<T>(fn: (scoped: this) => Promise<T> | T): Promise<T> {
    return fn(this)
  }
}

// Derive the return type that pwExpect produces when given a Locator (i.e. LocatorAssertions)
function _expectLocator(l: Locator) { return pwExpect(l) }
type LocatorAssertions = ReturnType<typeof _expectLocator>

type ExpectFn = ((value: LocatorBuilder) => LocatorAssertions) & typeof pwExpect

export const expect = ((value: unknown) => {
  if (value instanceof LocatorBuilder) {
    return pwExpect(value.locate())
  }
  return pwExpect(value as never)
}) as unknown as ExpectFn
