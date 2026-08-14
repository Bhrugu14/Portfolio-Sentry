export function Footer({ name }: { name: string | null }) {
  return (
    <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted">
      © {new Date().getFullYear()} {name}. Built with Next.js and Sanity.
    </footer>
  )
}
