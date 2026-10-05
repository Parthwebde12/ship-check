const TEXT_EXT = /\.(js|jsx|ts|tsx|mjs|cjs|py|json|ya?ml|toml|ini|cfg|sh|go|rb|java|php|properties)$/i
const SKIP_DIRS = /(^|\/)(node_modules|dist|build|\.git|vendor|coverage)\//
const SKIP_FILES = /(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|\.min\.js)$/i

// Lines containing these are almost always placeholders or env lookups
const IGNORE_LINE =
  /(process\.env|os\.environ|import\.meta\.env|getenv|your[_-]|<.+>|example|changeme|xxxx|placeholder)/i

const PATTERNS = [
  { name: 'private key', re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: 'GitHub token', re: /(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})/ },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'Slack token', re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'Stripe live key', re: /sk_live_[0-9a-zA-Z]{20,}/ },
  { name: 'API key (sk-...)', re: /sk-[A-Za-z0-9_-]{20,}/ },
  {
    name: 'hardcoded secret',
    re: /(client[_-]?secret|secret[_-]?key|api[_-]?key|access[_-]?token|auth[_-]?token|password|passwd)["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i,
  },
]

function score(path) {
  let s = 0
  if (/(config|env|settings|secret|credential|auth)/i.test(path)) s += 3
  if (path.split('/').length <= 2) s += 2
  return s
}

// Pick the most likely files to hold secrets: small text files, max `limit`
export function pickFilesToScan(files, limit = 40) {
  return files
    .filter(
      (f) =>
        f.size <= 100000 &&
        !SKIP_DIRS.test(f.path) &&
        !SKIP_FILES.test(f.path) &&
        (TEXT_EXT.test(f.path) || /(^|\/)\.env/.test(f.path))
    )
    .sort((a, b) => score(b.path) - score(a.path))
    .slice(0, limit)
}

// Returns findings WITHOUT the secret text itself
export function scanText(path, text) {
  const findings = []
  text.split('\n').forEach((line, i) => {
    if (line.length > 500 || IGNORE_LINE.test(line)) return
    for (const p of PATTERNS) {
      if (p.re.test(line)) {
        findings.push({ path, line: i + 1, name: p.name })
        break
      }
    }
  })
  return findings
}


// Scans only the REMOVED lines of a commit's diff for one file.
// Returns findings without the secret text itself.
export function scanPatch(path, sha, patch) {
  if (SKIP_DIRS.test(path) || SKIP_FILES.test(path)) return []

  const findings = []
  for (const line of patch.split('\n')) {
    if (!line.startsWith('-')) continue
    const text = line.slice(1)
    if (text.length > 500 || IGNORE_LINE.test(text)) continue
    for (const p of PATTERNS) {
      if (p.re.test(text)) {
        findings.push({ path, sha: sha.slice(0, 7), name: p.name })
        break
      }
    }
  }
  return findings
}