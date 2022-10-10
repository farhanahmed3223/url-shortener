"use client"
import { useState } from "react"
interface Props { shortUrl: string; code: string }

export function ResultCard({ shortUrl, code }: Props) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div>
      <a href={shortUrl}>{shortUrl}</a>
      <button onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
    </div>
  )
}
