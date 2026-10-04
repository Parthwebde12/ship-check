import { useEffect, useState } from 'react'
import { getRepoFromTab } from './lib/repo.js'
import { fetchRepoFiles } from './lib/github.js'
import { runChecks } from './lib/checks.js'
import CheckList from './components/CheckList.jsx'

export default function App() {
  const [repo, setRepo] = useState(undefined) // undefined = loading, null = not a repo page
  const [results, setResults] = useState(null)
  const [truncated, setTruncated] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const r = await getRepoFromTab()
        setRepo(r)
        if (!r) return
        const { paths, truncated } = await fetchRepoFiles(r.owner, r.repo)
        setResults(runChecks(paths))
        setTruncated(truncated)
      } catch (e) {
        setError(e.message)
      }
    }
    load()
  }, [])

  const passed = results ? results.filter((r) => r.status === 'pass').length : 0

  return (
    <div>
      <h1>🚢 shipcheck</h1>
      {error && <p className="error">{error}</p>}
      {!error && repo === undefined && <p>Loading…</p>}
      {!error && repo === null && (
        <p>Open a GitHub repository page, then click again.</p>
      )}
      {!error && repo && !results && <p>Checking {repo.owner}/{repo.repo}…</p>}
      {results && (
        <>
          <p className="summary">
            {repo.owner}/{repo.repo}: {passed}/{results.length} passed
          </p>
          <CheckList results={results} />
          {truncated && (
            <p className="error">Repo is very large, so results may be incomplete.</p>
          )}
        </>
      )}
    </div>
  )
}