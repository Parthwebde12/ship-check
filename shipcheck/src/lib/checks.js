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