import { useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCoach } from '../context/CoachContext'
import { ThemeToggle } from './ThemeToggle'
import { ChatPanel } from './ChatPanel'

const primaryNav = [
  { to: '/', label: 'Home', end: true },
  { to: '/transactions', label: 'Activity' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/savings', label: 'Savings' },
  { to: '/loans', label: 'Loans' },
  { to: '/chatbot', label: 'Coach' },
]

const moreNav = [
  {
    to: '/accounts',
    label: 'Accounts',
    description: 'Link and sync banks',
  },
  {
    to: '/verify',
    label: 'Verify',
    description: 'Identity for loans',
  },
  {
    to: '/insights',
    label: 'Insights',
    description: 'Monthly spending deep dive',
  },
  {
    to: '/blockchain',
    label: 'Chain',
    description: 'On-chain attestations',
  },
]

function shortWallet(address?: string | null) {
  if (!address) return null
  if (address.length < 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { panelOpen, openPanel, closePanel } = useCoach()
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const wallet = shortWallet(user?.walletAddress)

  const moreActive = moreNav.some((i) => location.pathname === i.to)

  useEffect(() => {
    setMoreOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!moreOpen && !mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreOpen(false)
        setMobileOpen(false)
      }
    }
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (target?.closest('[data-more-menu]')) return
      setMoreOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [moreOpen, mobileOpen])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `shrink-0 px-1.5 py-1 rounded-md text-sm font-semibold tracking-tight transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
        : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100/80 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800'
    }`

  return (
    <div className="min-h-[100dvh] mesh-bg overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 noise-overlay" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-sky-200/20 blur-3xl dark:bg-sky-600/10 animate-ambient-drift" />
        <div className="absolute -right-28 bottom-1/4 h-80 w-80 rounded-full bg-primary-200/15 blur-3xl dark:bg-primary-600/10 animate-ambient-drift-alt" />
      </div>

      {/* Header is wider than page content — page-shell (~768px) is too narrow for full nav */}
      <header className="sticky top-0 z-30 safe-area-pt safe-area-px">
        <div className="mx-auto w-full max-w-6xl page-pad-x pt-2 sm:pt-3">
          <div className="rounded-2xl border border-white/70 dark:border-surface-700/60 bg-white/75 dark:bg-surface-900/70 backdrop-blur-xl px-3 sm:px-4 py-2 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_10px_28px_-20px_rgba(15,23,42,0.25)]">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-[0_8px_16px_-8px_rgba(0,112,199,0.7)]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-display text-base font-bold tracking-tight text-surface-900 dark:text-white hidden sm:inline">
                  VeriFi AI
                </span>
              </Link>

              <nav className="hidden lg:flex flex-1 items-center gap-0 min-w-0" aria-label="Main">
                <div className="flex items-center gap-0 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {primaryNav.map((item) => (
                    <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
                {/* Keep More outside overflow scroll — otherwise the dropdown is clipped */}
                <div className="relative shrink-0" data-more-menu>
                  <button
                    type="button"
                    onClick={() => setMoreOpen((o) => !o)}
                    className={`px-1.5 py-1 rounded-md text-sm font-semibold tracking-tight transition-colors whitespace-nowrap ${
                      moreOpen || moreActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                        : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100/80 dark:text-surface-400 dark:hover:text-white dark:hover:bg-surface-800'
                    }`}
                    aria-expanded={moreOpen}
                    aria-haspopup="menu"
                  >
                    More
                  </button>
                  {moreOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 top-full mt-2 w-64 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-lg p-1.5 z-50 animate-scale-in"
                    >
                      {moreNav.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          className={`block rounded-xl px-3 py-2.5 ${
                            location.pathname === item.to
                              ? 'bg-primary-50 dark:bg-primary-950/40'
                              : 'hover:bg-surface-50 dark:hover:bg-surface-700/60'
                          }`}
                        >
                          <span className="block text-sm font-semibold text-surface-900 dark:text-white">{item.label}</span>
                          <span className="block text-xs text-surface-500">{item.description}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  className="lg:hidden rounded-xl p-2 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                  aria-label="Open menu"
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((o) => !o)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    {mobileOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    )}
                  </svg>
                </button>
                <ThemeToggle />
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="hidden sm:inline text-xs font-semibold text-primary-600 dark:text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/40"
                  >
                    Admin
                  </Link>
                )}
                {wallet && (
                  <span
                    className="hidden xl:inline text-[11px] text-surface-500 font-mono truncate max-w-[6.5rem] rounded-lg bg-surface-100/80 dark:bg-surface-800 px-2 py-1"
                    title={user?.walletAddress ?? undefined}
                  >
                    {wallet}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => logout().then(() => navigate('/login'))}
                  className="text-sm text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-surface-100/80 dark:hover:bg-surface-800 transition-colors whitespace-nowrap"
                >
                  Log out
                </button>
              </div>
            </div>

            {mobileOpen && (
              <nav className="lg:hidden mt-2 pt-2 border-t border-surface-200/80 dark:border-surface-700 space-y-0.5 animate-fade-in" aria-label="Mobile">
                {wallet && (
                  <p className="px-2.5 py-1.5 text-[11px] font-mono text-surface-500 truncate" title={user?.walletAddress ?? undefined}>
                    {wallet}
                  </p>
                )}
                {primaryNav.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                    {item.label}
                  </NavLink>
                ))}
                <p className="px-2.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-surface-400">More</p>
                {moreNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`block px-2.5 py-2 rounded-lg text-sm font-semibold ${
                      location.pathname === item.to
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                        : 'text-surface-600 dark:text-surface-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

      <main className="relative page-shell page-pad-x pt-5 sm:pt-6 pb-24 min-w-0">
        <Outlet />
      </main>

      {panelOpen && <ChatPanel onClose={closePanel} />}

      {!panelOpen && location.pathname !== '/chatbot' && (
        <button
          type="button"
          onClick={openPanel}
          className="fixed z-30 w-12 h-12 rounded-2xl bg-primary-600 text-white shadow-[0_14px_32px_-10px_rgba(0,112,199,0.7)] flex items-center justify-center hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 animate-fab-in right-4 sm:right-6 bottom-4 sm:bottom-6 safe-area-pb"
          aria-label="Open coach"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09z" />
          </svg>
        </button>
      )}
    </div>
  )
}
