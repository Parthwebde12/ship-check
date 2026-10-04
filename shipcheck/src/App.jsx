import { useCallback, useEffect, useState } from 'react'
import { getRepoFromTab } from './lib/repo.js'
import { getToken } from './lib/storage.js'
import { analyze } from './lib/analyze.js'
import CheckList from './components/CheckList.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'

export default function App() {
  const [repo, setRepo] = useState(undefined) // undefined = loading, null = not a repo page
  const [results, setResults] = useState(null)
  const [truncated, setTruncated] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = useCallback(async () => {
    setError(null)
    setResults(null)
    setBusy(true)
    try {
      const r = await getRepoFromTab()
      setRepo(r)
      if (!r) return
      const token = await getToken()
      const out = await analyze(r.owner, r.repo, token)
      setResults(out.results)
      setTruncated(out.truncated)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void run()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [run])

  const count = (s) => (results ? results.filter((r) => r.status === s).length : 0)

  return (
    <div>
      <div className="header">
        <h1>🚢 shipcheck</h1>
        {repo && (
          <button onClick={run} disabled={busy}>
            {busy ? 'Checking…' : 'Re-check'}
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {!error && repo === undefined && <p>Loading…</p>}
      {!error && repo === null && (
        <p>Open a GitHub repository page, then click again.</p>
      )}
      {!error && repo && !results && (
        <p>Checking {repo.owner}/{repo.repo}…</p>
      )}

      {results && (
        <>
          <p className="repo-name">{repo.owner}/{repo.repo}</p>
          <div className="pills">
            <span className="pill pass">{count('pass')} passed</span>
            <span className="pill warn">{count('warn')} warnings</span>
            <span className="pill fail">{count('fail')} failed</span>
          </div>
          <CheckList results={results} />
          {truncated && (
            <p className="error">Repo is very large, so results may be incomplete.</p>
          )}
        </>
      )}

      <SettingsPanel onChange={run} />
    </div>
  )
}