import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { ConnectWalletButton } from '../components/ConnectWalletButton'
import { Logo } from '../components/Logo'

const points = [
  { title: 'See the month clearly', body: 'Balances, budgets, and spending in one place.' },
  { title: 'Know if a loan fits', body: 'A score built from your cash flow, not a black box.' },
  { title: 'Keep a record on-chain', body: 'Optional attestations you can show, not just store.' },
]

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] mesh-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 noise-overlay" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/15 animate-ambient-drift" />
        <div className="absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-primary-300/25 blur-3xl dark:bg-primary-600/15 animate-ambient-drift-alt" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-5">
        <Logo className="lg:invisible" />
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100dvh-4.5rem)] w-full max-w-6xl items-center gap-10 px-5 pb-12 pt-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <section className="hidden lg:block animate-login-rise">
          <Logo />
          <p className="page-eyebrow mt-8">Wallet-native finance</p>
          <h1 className="mt-4 font-display text-6xl font-bold tracking-[-0.045em] leading-[0.95] text-surface-900 dark:text-white">
            Money, scored
            <br />
            and signed.
          </h1>
          <p className="mt-5 max-w-md text-lg text-surface-600 dark:text-surface-300 leading-relaxed">
            Link a bank, watch the month, and carry a loan decision you can explain.
          </p>
          <ul className="mt-10 space-y-4">
            {points.map((point) => (
              <li key={point.title} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                <span>
                  <span className="block text-sm font-semibold text-surface-900 dark:text-white">{point.title}</span>
                  <span className="block text-sm text-surface-500">{point.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-[440px] animate-login-rise-delayed">
          <div className="mb-6 text-center lg:text-left">
            <p className="page-eyebrow lg:hidden">Wallet-native finance</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-[-0.04em] text-surface-900 dark:text-white lg:text-[2.4rem]">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-surface-500 leading-relaxed">
              One signature. No gas, no password.
            </p>
          </div>
          <div className="glass-panel rounded-[1.6rem] p-6 sm:p-8">
            <ConnectWalletButton onSuccess={() => navigate('/')} />
          </div>
          <p className="mt-5 text-center text-xs leading-relaxed text-surface-400 lg:text-left">
            You keep the keys. VeriFi only checks the signature.
          </p>
        </section>
      </main>
    </div>
  )
}
