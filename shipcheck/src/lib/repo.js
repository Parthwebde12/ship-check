const RESERVED = new Set([
  'settings', 'orgs', 'marketplace', 'topics', 'explore', 'notifications',
  'pulls', 'issues', 'sponsors', 'features', 'login', 'new', 'search',
])

export async function getRepoFromTab() {
  const [tab] = await globalThis.chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || !tab.url) return null

  const url = new URL(tab.url)
  if (url.hostname !== 'github.com') return null

  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2 || RESERVED.has(parts[0])) return null

  return { owner: parts[0], repo: parts[1] }
}