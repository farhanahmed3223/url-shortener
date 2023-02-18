"use client"
import { useEffect, useState } from "react"
import { LinkTable } from "@/components/LinkTable"

export default function Dashboard() {
  const [links, setLinks] = useState([])
  useEffect(() => {
    fetch("/api/links").then(r => r.json()).then(setLinks)
  }, [])
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Links</h1>
      <LinkTable links={links} />
    </main>
  )
}
