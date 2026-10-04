import { useEffect, useState } from 'react'
import { getRepoFromTab } from './lib/repo.js'

export default function App() {
  const [repo, setRepo] = useState(undefined)

  useEffect(() => {
    getRepoFromTab().then(setRepo)
  }, [])

  return (
    <div>
      <h1>shipcheck</h1>
      {repo === undefined && <p>Loading…</p>}
      {repo === null && <p>Open a GitHub repository page, then click again.</p>}
      {repo && <p>Repo detected: {repo.owner}/{repo.repo}</p>}
    </div>
  )
}