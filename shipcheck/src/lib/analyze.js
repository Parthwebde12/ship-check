import { fetchRepoFiles, fetchText } from './github.js'
import { runChecks, runContentChecks } from './checks.js'
import { pickFilesToScan, scanText } from './scan.js'

export async function analyze(owner, repo, token) {
  const { files, truncated, branch } = await fetchRepoFiles(owner, repo, token)
  const paths = files.map((f) => f.path)
  const fileResults = runChecks(paths)

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

  return { results: [...fileResults, ...contentResults], truncated }
}