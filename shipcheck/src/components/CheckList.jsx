const ICONS = { pass: '✅', warn: '⚠️', fail: '❌' }

export default function CheckList({ results }) {
  return (
    <ul className="checks">
      {results.map((r) => (
        <li key={r.id} className={r.status}>
          <span>{ICONS[r.status]}</span>
          <div>
            <strong>{r.label}</strong>
            <small>{r.detail}</small>
          </div>
        </li>
      ))}
    </ul>
  )
}