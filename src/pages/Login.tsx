import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { ConnectWalletButton } from '../components/ConnectWalletButton'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] relative flex flex-col overflow-hidden safe-area-px mesh-bg">
      <div className="pointer-events-none absolute inset-0 noise-overlay" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_-8%,#b9defa_0%,transparent_52%)] dark:bg-[radial-gradient(110%_70%_at_50%_-8%,rgba(12,142,233,0.28)_0%,transparent_52%)]" />
        <div className="absolute -left-28 top-[22%] h-[22rem] w-[22rem] rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/15 animate-ambient-drift" />
        <div className="absolute -right-20 bottom-[18%] h-[24rem] w-[24rem] rounded-full bg-primary-300/25 blur-3xl dark:bg-primary-500/12 animate-ambient-drift-alt" />
        <div className="absolute inset-0 opacity-[0.28] dark:opacity-[0.1] [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-5 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-[0_10px_20px_-10px_rgba(0,112,199,0.8)]">
            <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
              <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-surface-900 dark:text-white">VeriFi AI</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 sm:px-6 pb-16">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-8 sm:mb-10 animate-login-rise">
            <p className="page-eyebrow text-center">Wallet-native finance</p>
            <h1 className="mt-3 font-display text-[2.65rem] sm:text-5xl font-bold tracking-[-0.04em] text-surface-900 dark:text-white leading-[1.05]">
              VeriFi AI
            </h1>
            <p className="mt-4 text-base sm:text-lg text-surface-600 dark:text-surface-300 tracking-tight">
              Sign in with your wallet
            </p>
            <p className="mt-2 text-sm text-surface-500 dark:text-surface-400 max-w-sm mx-auto leading-relaxed">
              One short signature. No gas fees, no password to remember.
            </p>
          </div>

          <div className="glass-panel rounded-[1.5rem] p-6 sm:p-8 animate-login-rise-delayed">
            <ConnectWalletButton onSuccess={() => navigate('/')} />
          </div>

          <p className="mt-6 text-center text-xs text-surface-400 dark:text-surface-500 animate-login-rise-late leading-relaxed">
            You keep control of your keys — we only verify the signature.
          </p>
        </div>
      </main>
    </div>
  )
}
