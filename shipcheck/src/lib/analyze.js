import {
  fetchRepoFiles,
  fetchText,
  fetchRecentCommits,
  fetchCommitFiles,
} from './github.js'
import { runChecks, runContentChecks, runHistoryCheck } from './checks.js'
import { pickFilesToScan, scanText, scanPatch } from './scan.js'

// Run async work a few items at a time, so we don't hammer the API
async function inBatches(items, size, fn) {
  const out = []
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.allSettled(items.slice(i, i + size).map(fn))))
  }
  return out
}

async function historyCheck(owner, repo, token) {
  if (!token) {
    return runHistoryCheck({
      skippedReason: 'Skipped. Add a GitHub token in Settings to scan recent commits.',
    })
  }
  try {
    const shas = await fetchRecentCommits(owner, repo, token, 30)
    const settled = await inBatches(shas, 5, (sha) =>
      fetchCommitFiles(owner, repo, sha, token).then((files) => ({ sha, files }))
    )
    const ok = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value)
    const findings = ok.flatMap(({ sha, files }) =>
      files.flatMap((f) => (f.patch ? scanPatch(f.filename, sha, f.patch) : []))
    )
    return runHistoryCheck({ findings, scanned: ok.length, total: shas.length })
  } catch (e) {
    return runHistoryCheck({ skippedReason: `History scan failed: ${e.message}` })
  }
}

export async function analyze(owner, repo, token) {
  const { files, truncated, branch } = await fetchRepoFiles(owner, repo, token)
  const paths = files.map((f) => f.path)
  const fileResults = runChecks(paths)

  // Start the history scan now so it runs alongside the file fetching
  const historyPromise = historyCheck(owner, repo, token)

  const root = paths.filter((p) => !p.includes('/'))
  const readmePath = root.find((p) => /^readme(\..+)?$/i.test(p))
  const toScan = pickFilesToScan(files)

  const [gitignoreText, readmeText, ...texts] = await Promise.all([
    root.includes('.gitignore')
      ? fetchText(owner, repo, branch, '.gitignore', token)
      : null,
    readmePath ? fetchText(owner, repo, branch, readmePath, token) : null,
    ...toScan.map((f) => fetchText(owner, repo, branch, f.path, token)),
  ])

  const findings = texts.flatMap((t, i) =>
    t ? scanText(toScan[i].path, t) : []
  )

  const contentResults = runContentChecks({
    gitignoreText,
    readmeText,
    hasPackageJson: paths.includes('package.json'),
    findings,
    scannedCount: toScan.length,
  })

  const history = await historyPromise

  return { results: [...fileResults, ...contentResults, history], truncated }
}