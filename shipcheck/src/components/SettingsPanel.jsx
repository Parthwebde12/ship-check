import { useEffect, useState } from 'react'
import { getToken, saveToken, clearToken } from '../lib/storage.js'

export default function SettingsPanel({ onChange }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getToken().then((t) => {
      setValue(t)
      setSaved(!!t)
    })
  }, [])

  async function save() {
    await saveToken(value)
    setSaved(!!value.trim())
    onChange()
  }

  async function clear() {
    await clearToken()
    setValue('')
    setSaved(false)
    onChange()
  }

  return (
    <div className="settings">
      <button className="link" onClick={() => setOpen(!open)}>
        {open ? 'Hide settings' : 'Settings'}
        {saved ? ' · token saved' : ''}
      </button>
      {open && (
        <div className="settings-body">
          <input
            type="password"
            placeholder="GitHub token (optional)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="row">
            <button onClick={save}>Save</button>
            <button className="secondary" onClick={clear}>Clear</button>
          </div>
          <small>
            Raises the rate limit to 5,000/hr and allows private repos. Use a
            fine-grained, read-only token. It stays in this browser only.
          </small>
        </div>
      )}
    </div>
  )
}