"use client"
interface Link { short_code: string; original_url: string; click_count: number }
interface Props { links: Link[] }

export function LinkTable({ links }: Props) {
  return (
    <table className="w-full">
      <thead><tr><th>Short URL</th><th>Original URL</th><th>Clicks</th></tr></thead>
      <tbody>
        {links.map(l => (
          <tr key={l.short_code}>
            <td>{l.short_code}</td>
            <td>{l.original_url}</td>
            <td>{l.click_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
