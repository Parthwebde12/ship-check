const API = 'https://api.github.com'

async function gh(path, token) {
  const headers = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API}${path}`, { headers })
  if (res.status === 401)
    throw new Error('GitHub token is invalid. Update or clear it in Settings.')
  if (res.status === 404) throw new Error('Repo not found, empty, or private.')
  if (res.status === 403 || res.status === 429)
    throw new Error(
      token
        ? 'GitHub rate limit or permission problem. Try again later.'
        : 'GitHub rate limit reached. Add a token in Settings or try later.'
    )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function fetchRepoFiles(owner, repo, token) {
  const info = await gh(`/repos/${owner}/${repo}`, token)
  const branch = info.default_branch
  const tree = await gh(
    `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    token
  )

  const files = tree.tree
    .filter((item) => item.type === 'blob')
    .map((item) => ({ path: item.path, size: item.size ?? 0 }))

  return { files, truncated: tree.truncated, branch }
}

// Raw file contents. Returns null if the file can't be fetched.
export async function fetchText(owner, repo, branch, path, token) {
  const safePath = path.split('/').map(encodeURIComponent).join('/')
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURI(branch)}/${safePath}`
  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `token ${token}` } : {},
    })
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

export async function fetchRecentCommits(owner, repo, token, limit = 30) {
  const list = await gh(`/repos/${owner}/${repo}/commits?per_page=${limit}`, token)
  return list.map((c) => c.sha)
}

// Each file has { filename, status, patch? }. patch is missing for binary or huge diffs.
export async function fetchCommitFiles(owner, repo, sha, token) {
  const commit = await gh(`/repos/${owner}/${repo}/commits/${sha}`, token)
  return commit.files || []
}