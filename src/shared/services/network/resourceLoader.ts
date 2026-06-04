export async function fetchTextResource(url: string): Promise<string> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to load resource: ${url}`)
  }

  return response.text()
}

export function fetchTextResources(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(fetchTextResource))
}