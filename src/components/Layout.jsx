export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-val-bg">

      {/* Header */}
      <header className="bg-val-surface border-b border-val-border relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-val-red" />
        <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10"
          style={{ background: 'linear-gradient(to left, #FF4655, transparent)' }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-val-red val-clip-sm flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-val-text tracking-widest uppercase leading-none">CEPREVAL</h1>
              <p className="text-xs text-val-muted tracking-widest uppercase leading-tight">SIMULADOR &middot; UNHEVAL</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-val-green rounded-full animate-pulse" />
            <span className="text-xs tracking-widest uppercase font-semibold text-val-muted">Modo Examen</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-val-border bg-val-surface mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-val-muted tracking-widest uppercase">
            CEPREVAL &copy; {new Date().getFullYear()} &mdash; UNHEVAL
          </span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-val-red" />
            <span className="text-xs text-val-muted tracking-widest uppercase">v2026</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
