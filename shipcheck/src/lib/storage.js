export async function getToken() {
  const { ghToken } = await chrome.storage.local.get('ghToken')
  return ghToken || ''
}

export async function saveToken(token) {
  await chrome.storage.local.set({ ghToken: token.trim() })
}

export async function clearToken() {
  await chrome.storage.local.remove('ghToken')
}