export async function getToken() {
  const { ghToken } = (await globalThis.chrome?.storage?.local.get('ghToken')) || {}
  return ghToken || ''
}

export async function saveToken(token) {
  if (!globalThis.chrome?.storage?.local) return
  await globalThis.chrome.storage.local.set({ ghToken: token.trim() })
}

export async function clearToken() {
  if (!globalThis.chrome?.storage?.local) return
  await globalThis.chrome.storage.local.remove('ghToken')
}