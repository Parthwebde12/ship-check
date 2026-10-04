const base = (p) => p.split('/').pop()

export function runChecks(paths) {
  const root = paths.filter((p) => !p.includes('/'))
  const results = []

  const license = root.find((p) => /^(license|licence|copying)(\..+)?$/i.test(p))
  results.push({
    id: 'license',
    label: 'LICENSE file',
    status: license ? 'pass' : 'fail',
    detail: license ?? 'Missing. Add one (MIT is a common pick).',
  })

  const readme = root.find((p) => /^readme(\..+)?$/i.test(p))
  results.push({
    id: 'readme',
    label: 'README',
    status: readme ? 'pass' : 'fail',
    detail: readme ?? 'Missing. Add run instructions.',
  })

  const hasGitignore = root.includes('.gitignore')
  results.push({
    id: 'gitignore',
    label: '.gitignore',
    status: hasGitignore ? 'pass' : 'fail',
    detail: hasGitignore ? '.gitignore' : 'Missing at the repo root.',
  })

  const envExample = paths.find((p) =>
    /^\.env\.(example|sample|template)$/i.test(base(p))
  )
  results.push({
    id: 'env-example',
    label: '.env.example',
    status: envExample ? 'pass' : 'warn',
    detail: envExample ?? 'Not found. Helps others know which variables to set.',
  })

  const committedEnv = paths.filter(
    (p) =>
      /^\.env(\..+)?$/i.test(base(p)) &&
      !/\.(example|sample|template)$/i.test(base(p))
  )
  results.push({
    id: 'committed-env',
    label: 'No committed .env',
    status: committedEnv.length ? 'fail' : 'pass',
    detail: committedEnv.length
      ? `Committed: ${committedEnv.join(', ')}`
      : 'None found.',
  })

  const hasNodeModules = paths.some((p) => /(^|\/)node_modules\//.test(p))
  results.push({
    id: 'node-modules',
    label: 'No committed node_modules',
    status: hasNodeModules ? 'fail' : 'pass',
    detail: hasNodeModules ? 'node_modules is in the repo.' : 'None found.',
  })

  return results
}

export function runContentChecks({
  gitignoreText,
  readmeText,
  hasPackageJson,
  findings,
  scannedCount,
}) {
  const out = []

  if (gitignoreText != null) {
    const lines = gitignoreText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))

    const ignoresEnv = lines.some((l) =>
      /^\/?(\*\*\/)?\.env(\*|\.\*|\.local)?$/.test(l)
    )
    out.push({
      id: 'gi-env',
      label: '.gitignore covers .env',
      status: ignoresEnv ? 'pass' : 'fail',
      detail: ignoresEnv ? 'Found.' : 'Add ".env" to .gitignore.',
    })

    if (hasPackageJson) {
      const ignoresNm = lines.some((l) =>
        /^\/?(\*\*\/)?node_modules\/?$/.test(l)
      )
      out.push({
        id: 'gi-nm',
        label: '.gitignore covers node_modules',
        status: ignoresNm ? 'pass' : 'fail',
        detail: ignoresNm ? 'Found.' : 'Add "node_modules" to .gitignore.',
      })
    }
  }

  if (readmeText != null) {
    const hasHeading =
      /^#{1,6}\s*.*(install|setup|set up|getting started|usage|run|quick ?start)/im.test(readmeText)
    const hasCommand =
      /(npm (install|run|start)|yarn|pnpm|pip install|python |docker|go run|cargo run)/i.test(readmeText)
    const ok = hasHeading || hasCommand
    out.push({
      id: 'readme-run',
      label: 'README has run instructions',
      status: ok ? 'pass' : 'warn',
      detail: ok
        ? 'Setup or run instructions found.'
        : 'No install/usage section or commands found.',
    })
  }

  const n = findings.length
  out.push({
    id: 'secrets',
    label: 'No key-like strings in code',
    status: n ? 'fail' : 'pass',
    detail: n
      ? findings
          .slice(0, 5)
          .map((f) => `${f.path}:${f.line} (${f.name})`)
          .join(', ') + (n > 5 ? ` +${n - 5} more` : '')
      : `Scanned ${scannedCount} files (max 40). Heuristic only.`,
  })

  return out
}