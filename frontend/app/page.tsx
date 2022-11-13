import { ShortenForm } from "@/components/ShortenForm"

export default function Home() {
  return (
    <main className="container mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8">Snip — URL Shortener</h1>
      <ShortenForm />
    </main>
  )
}
