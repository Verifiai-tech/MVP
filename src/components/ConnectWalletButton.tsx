import { CONNECT_STAGE_LABEL, useWalletConnect, type DetectedWallet } from '../hooks/useWalletConnect'

function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function WalletGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
      />
    </svg>
  )
}

interface ConnectWalletButtonProps {
  onSuccess?: () => void
  className?: string
}

export function ConnectWalletButton({ onSuccess, className = '' }: ConnectWalletButtonProps) {
  const { error, setError, stage, busy, wallets, noWallet, connectWallet } = useWalletConnect(onSuccess)

  const handleConnect = (wallet: DetectedWallet) => {
    if (busy) return
    setError('')
    connectWallet(wallet)
  }

  const stageLabel = CONNECT_STAGE_LABEL[stage]
  const showPicker = !busy && wallets.length > 1
  const single = !busy && wallets.length === 1 ? wallets[0] : null

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <p role="alert" className="text-sm text-center text-red-600 dark:text-red-400 animate-scale-in rounded-xl bg-red-50 dark:bg-red-950/30 px-3 py-2 border border-red-100 dark:border-red-900/50">
          {error}
        </p>
      )}

      {busy ? (
        <button
          type="button"
          disabled
          className="group relative w-full overflow-hidden rounded-2xl bg-primary-600 text-white shadow-[0_12px_28px_-10px_rgba(0,112,199,0.65)] opacity-60 pointer-events-none"
        >
          <span className="relative flex items-center justify-center gap-2.5 py-4 px-5 text-base font-semibold tracking-tight">
            <Spinner />
            {stageLabel || 'Connecting…'}
          </span>
        </button>
      ) : showPicker ? (
        <div className="space-y-2">
          <p className="text-center text-sm text-surface-500 dark:text-surface-400">Choose a wallet</p>
          <ul className="space-y-2">
            {wallets.map((wallet) => (
              <li key={`${wallet.id}-${wallet.chain}-${wallet.name}`}>
                <button
                  type="button"
                  onClick={() => handleConnect(wallet)}
                  className="w-full flex items-center gap-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800/80 px-4 py-3.5 text-left hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                    <WalletGlyph />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-surface-900 dark:text-white">{wallet.name}</span>
                    <span className="block text-xs text-surface-500 dark:text-surface-400 truncate">
                      {wallet.detail} · {wallet.chain === 'solana' ? 'Solana' : 'EVM'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (single) handleConnect(single)
            else setError('Install MetaMask or another wallet, then refresh.')
          }}
          disabled={noWallet}
          className="group relative w-full overflow-hidden rounded-2xl bg-primary-600 text-white shadow-[0_12px_28px_-10px_rgba(0,112,199,0.65)] transition-all duration-200 hover:bg-primary-700 hover:shadow-[0_16px_32px_-10px_rgba(0,112,199,0.7)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none disabled:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600 dark:focus-visible:ring-offset-surface-800"
        >
          <span
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
            aria-hidden="true"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-80" aria-hidden="true" />
          <span className="relative flex items-center justify-center gap-2.5 py-4 px-5 text-base font-semibold tracking-tight">
            <WalletGlyph className="w-5 h-5 opacity-90" />
            {single ? `Connect ${single.name}` : 'Connect Wallet'}
          </span>
        </button>
      )}

      {busy && stageLabel && (
        <p className="text-center text-sm text-surface-500 dark:text-surface-400" aria-live="polite">
          {stage === 'opening' && 'Approve the connection in your wallet.'}
          {stage === 'signing' && 'Sign the message to prove it’s you.'}
          {stage === 'verifying' && 'Finishing sign-in…'}
        </p>
      )}

      {!busy && noWallet && (
        <p className="text-center text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
          Install{' '}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 font-medium underline-offset-2 hover:underline"
          >
            MetaMask
          </a>{' '}
          or another wallet, then refresh.
        </p>
      )}

      {!busy && !noWallet && !error && !showPicker && (
        <p className="text-center text-sm text-surface-500 dark:text-surface-400">
          Opens your browser wallet to approve a signature.
        </p>
      )}
    </div>
  )
}
