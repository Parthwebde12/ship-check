const API = 'https://api.github.com'

async function gh(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (res.status === 404) throw new Error('Repo not found, empty, or private.')
  if (res.status === 403 || res.status === 429)
    throw new Error('GitHub rate limit reached. Try again in a few minutes.')
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function fetchRepoFiles(owner, repo) {
  const info = await gh(`/repos/${owner}/${repo}`)
  const branch = encodeURIComponent(info.default_branch)
  const tree = await gh(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)

  const paths = tree.tree
    .filter((item) => item.type === 'blob') // files only
    .map((item) => item.path)

  return { paths, truncated: tree.truncated }
}