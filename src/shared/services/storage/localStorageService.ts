export function saveJsonToLocalStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadJsonFromLocalStorage<T>(key: string): T | null {
  const rawValue = localStorage.getItem(key)

  if (!rawValue) {
    return null
  }

  return JSON.parse(rawValue) as T
}

export function removeLocalStorageItem(key: string): void {
  localStorage.removeItem(key)
}