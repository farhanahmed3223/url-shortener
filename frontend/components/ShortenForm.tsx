"use client"
import { useState } from "react"

export function ShortenForm() {
  const [url, setUrl] = useState("")
  const [result, setResult] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    const data = await res.json()
    setResult(data.short_url)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
      <button type="submit">Shorten</button>
      {result && <p>Short URL: <a href={result}>{result}</a></p>}
    </form>
  )
}
